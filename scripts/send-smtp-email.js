import net from 'node:net';
import tls from 'node:tls';

const host = process.env.USAGE_IMPORT_SMTP_HOST;
const port = Number.parseInt(process.env.USAGE_IMPORT_SMTP_PORT ?? '0', 10);
const username = process.env.USAGE_IMPORT_SMTP_USER;
const password = process.env.USAGE_IMPORT_SMTP_PASSWORD;
const from = process.env.USAGE_IMPORT_SMTP_FROM;
const to = process.env.USAGE_IMPORT_ALERT_EMAIL_TO;
const subject = process.env.ALERT_EMAIL_SUBJECT;
const body = process.env.ALERT_EMAIL_BODY;
const securityMode = `${process.env.USAGE_IMPORT_SMTP_SECURE ?? 'starttls'}`.toLowerCase();

if (!host || !port || !username || !password || !from || !to || !subject || !body) {
  throw new Error('Missing SMTP configuration for failure alert email.');
}

let socket = createSocket();
socket.setEncoding('utf8');

function createSocket() {
  if (securityMode === 'true' || securityMode === 'tls' || securityMode === 'ssl' || securityMode === '465') {
    return tls.connect({ host, port, servername: host });
  }

  return net.createConnection({ host, port });
}

function waitForReply(expectedPrefix, activeSocket = socket) {
  return new Promise((resolve, reject) => {
    let buffer = '';

    const onError = (error) => {
      activeSocket.off('data', onData);
      activeSocket.off('error', onError);
      reject(error);
    };

    const onData = (chunk) => {
      buffer += chunk;
      const lines = buffer.split('\r\n').filter(Boolean);
      const lastLine = lines[lines.length - 1] ?? '';

      if (!lastLine || lastLine[3] === '-') {
        return;
      }

      activeSocket.off('data', onData);
      activeSocket.off('error', onError);

      if (!lastLine.startsWith(expectedPrefix)) {
        reject(new Error(`Unexpected SMTP response. Expected ${expectedPrefix}, got: ${lastLine}`));
        return;
      }

      resolve(lines);
    };

    activeSocket.on('data', onData);
    activeSocket.on('error', onError);
  });
}

function sendCommand(command, expectedPrefix, activeSocket = socket) {
  activeSocket.write(`${command}\r\n`);
  return waitForReply(expectedPrefix, activeSocket);
}

async function upgradeToStartTls() {
  await sendCommand('STARTTLS', '220');

  socket = await new Promise((resolve, reject) => {
    const secureSocket = tls.connect({ socket, servername: host }, () => resolve(secureSocket));
    secureSocket.setEncoding('utf8');
    secureSocket.on('error', reject);
  });
}

async function main() {
  await waitForReply('220');
  await sendCommand(`EHLO ${host}`, '250');

  if (securityMode === 'starttls' || (securityMode === 'auto' && port === 587)) {
    await upgradeToStartTls();
    await sendCommand(`EHLO ${host}`, '250');
  }

  await sendCommand('AUTH LOGIN', '334');
  await sendCommand(Buffer.from(username).toString('base64'), '334');
  await sendCommand(Buffer.from(password).toString('base64'), '235');
  await sendCommand(`MAIL FROM:<${from}>`, '250');
  await sendCommand(`RCPT TO:<${to}>`, '250');
  await sendCommand('DATA', '354');

  const message = [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: ${subject}`,
    'Content-Type: text/plain; charset=utf-8',
    '',
    body.replace(/\r?\n/g, '\r\n'),
    '.',
  ].join('\r\n');

  socket.write(`${message}\r\n`);
  await waitForReply('250');
  await sendCommand('QUIT', '221');
}

main()
  .then(() => {
    socket.end();
  })
  .catch((error) => {
    socket.destroy();
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });

import { parseArgs } from 'node:util';
import { readFile } from 'node:fs/promises';
import { upsertCustomerAccess } from '../server/customer-data.js';

function parseServices(value) {
  const parsed = JSON.parse(value);
  if (!Array.isArray(parsed) || parsed.length === 0) {
    throw new Error('The services payload must be a non-empty JSON array.');
  }

  return parsed;
}

async function main() {
  const { values } = parseArgs({
    options: {
      email: { type: 'string' },
      'profile-name': { type: 'string' },
      'account-number': { type: 'string' },
      'account-name': { type: 'string' },
      services: { type: 'string' },
      'services-file': { type: 'string' },
      'append-services': { type: 'boolean', default: false },
    },
  });

  let servicesPayload = values.services;
  if (!servicesPayload && values['services-file']) {
    servicesPayload = await readFile(values['services-file'], 'utf8');
  }

  if (!values.email || !values['profile-name'] || !values['account-number'] || !values['account-name'] || !servicesPayload) {
    throw new Error(
      'Usage: node scripts/onboard-customer.js --email <email> --profile-name <name> --account-number <account> --account-name <name> --services <json-array> [--append-services]',
    );
  }

  const result = await upsertCustomerAccess(
    {
      email: values.email,
      profileDisplayName: values['profile-name'],
      accountNumber: values['account-number'],
      accountDisplayName: values['account-name'],
      services: parseServices(servicesPayload),
    },
    { appendServices: values['append-services'] },
  );

  console.log(
    JSON.stringify(
      {
        message: 'Customer onboarding completed.',
        result,
      },
      null,
      2,
    ),
  );
}

void main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});

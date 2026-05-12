import { parseArgs } from 'node:util';
import { grantCustomerAccountAccess } from '../server/customer-data.js';

async function main() {
  const { values } = parseArgs({
    options: {
      email: { type: 'string' },
      'profile-name': { type: 'string' },
      'account-number': { type: 'string' },
      role: { type: 'string', default: 'viewer' },
    },
  });

  if (!values.email || !values['profile-name'] || !values['account-number']) {
    throw new Error(
      'Usage: node scripts/grant-account-access.js --email <email> --profile-name <name> --account-number <account> [--role viewer]',
    );
  }

  const result = await grantCustomerAccountAccess({
    email: values.email,
    profileDisplayName: values['profile-name'],
    accountNumber: values['account-number'],
    accessRole: values.role,
  });

  console.log(
    JSON.stringify(
      {
        message: 'Utility account access granted.',
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

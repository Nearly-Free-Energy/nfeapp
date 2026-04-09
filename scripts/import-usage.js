import { importUsageFromEnv } from '../server/usage-import.js';

async function main() {
  const result = await importUsageFromEnv();

  console.log(
    JSON.stringify(
      {
        message: 'Usage import completed.',
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

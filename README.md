# nfeapp

App for customers and microgrid managers to monitor electricity usage.

## Local development

Install dependencies and start the Vite dev server:

```bash
npm install
npm run dev
```

Useful commands:

```bash
npm test
npm run build
npm run release:check
```

`npm run release:check` is the required local gate before merging work to `main`. It runs the full test suite and a production build.

## Vercel deployment

This repository is set up for a trunk-based Vercel workflow:

- `main` is the only long-lived branch and the only deploy source.
- Vercel should treat this as a static Vite frontend.
- A merge to `main` should create a staged production deployment.
- That staged deployment is validated in preprod first.
- Production is updated only by manually promoting the already-tested staged deployment.

### Repo-side Vercel config

The repository includes [`vercel.json`](/Users/atushabe/NearlyFreeEnergy/NFE%20Web%20App/vercel.json) to pin the expected Vercel behavior:

- framework: `vite`
- build command: `npm run build`
- output directory: `dist`

Also note:

- `.vercel/` is gitignored because it is local machine/project linkage metadata.
- No backend runtime config is needed for the current `main` branch.

### Required Vercel project settings

Configure one Vercel project for this repo with:

- Production branch: `main`
- Auto-assign custom production domains: disabled for the Production environment
- Production domain: your live customer-facing domain
- Preprod domain: a stable dedicated domain such as `preprod.<your-domain>`

With auto-assignment disabled, merges to `main` create staged production deployments that do not immediately replace the live site. Promote the deployment manually after preprod validation.

Reference: [Vercel promoting deployments](https://vercel.com/docs/deployments/promoting-a-deployment)

## Release policy

### Daily workflow

1. Pull the latest `main`.
2. Do the work locally.
3. Run `npm run release:check`.
4. Merge to `main` only if the local checks pass.

### Merge policy

- Keep merges to `main` small and self-contained.
- Avoid batching unrelated changes into a single merge.
- Treat every merge to `main` as a release candidate.

### Preprod policy

After the merge reaches `main`:

1. Wait for Vercel to finish the staged production deployment.
2. Open the preprod domain and verify:
   - the site loads without console-breaking issues
   - the main navigation or primary user path works
   - the deployed build matches the intended change
   - there are no obvious visual regressions on desktop and mobile-width layouts
3. If preprod fails, do not promote. Fix locally, rerun `npm run release:check`, merge again, and validate the new staged deployment.

### Production policy

- Production promotion is always manual.
- Promote only the exact staged deployment that passed preprod.
- Do not trigger a fresh rebuild for production.

### Rollback policy

If a bad release reaches production, roll back by promoting the previous known-good Vercel deployment rather than patching production directly.

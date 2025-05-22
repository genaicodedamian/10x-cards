# CI/CD Workflow

This workflow performs tests and a production build.

## Triggers

- Manual execution
- Push to the `master` branch

## Steps

1.  **Checkout code**: Uses `actions/checkout@v4`.
2.  **Setup Node.js**: Uses `actions/setup-node@v4` with the Node.js version from `.nvmrc` and caches npm dependencies.
3.  **Install dependencies**: Runs `npm ci`.
4.  **Run tests**: Runs `npm test`.
5.  **Build project**: Runs `npm run build`.

## Workflow File

The workflow is defined in `.github/workflows/ci.yml`:

```yaml
name: CI

on:
  push:
    branches:
      - master
  workflow_dispatch:

jobs:
  build_and_test:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version-file: '.nvmrc' # Use .nvmrc to specify Node.js version
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm test

      - name: Build project
        run: npm run build
```

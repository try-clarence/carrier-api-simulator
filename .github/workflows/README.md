# GitHub Actions Workflows

This directory contains all CI/CD workflows for the Carrier API Simulator.

## Workflows

### 1. CI/CD Pipeline (`ci.yml`)

Main continuous integration pipeline that runs on every push and pull request.

**Jobs:**
- ✅ Lint Check
- ✅ Security Audit
- ✅ Unit Tests (39 tests)
- ✅ E2E Tests (14 tests)
- ✅ Build Check

**Duration:** ~5-7 minutes

### 2. CodeQL Security Scan (`codeql.yml`)

Advanced security analysis using GitHub's CodeQL engine.

**Runs:**
- On push to main
- On pull requests
- Scheduled weekly (Mondays)

### 3. Dependency Review (`dependency-review.yml`)

Reviews dependency changes in pull requests.

**Checks:**
- Vulnerable dependencies
- License compliance
- Security advisories

## Status

All workflows are active and passing ✅

## Configuration

See [CICD.md](../../CICD.md) for detailed documentation.

## Local Testing

Before pushing, run:

```bash
npm run lint && npm test && npm run test:e2e && npm run build
```

## Support

For issues with CI/CD:
1. Check workflow logs in Actions tab
2. Review [CICD.md](../../CICD.md)
3. Open an issue with `ci/cd` label


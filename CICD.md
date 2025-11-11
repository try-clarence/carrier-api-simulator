# CI/CD Pipeline Documentation

## Overview

This project uses GitHub Actions for continuous integration and continuous deployment. The CI/CD pipeline automatically runs on every push and pull request to ensure code quality, security, and functionality.

## Workflows

### 1. Main CI/CD Pipeline (`.github/workflows/ci.yml`)

**Triggers:**
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop` branches

**Jobs:**

#### Lint Check
- Runs ESLint on all TypeScript files
- Ensures code style consistency
- Auto-fixes issues where possible
- **Command:** `npm run lint`

#### Security Audit
- Runs `npm audit` to check for vulnerabilities
- Checks both all dependencies and production-only
- Fails on high-severity issues in production dependencies
- Allows moderate issues in dev dependencies
- **Commands:**
  - `npm audit --audit-level=moderate`
  - `npm audit --production --audit-level=high`

#### Unit Tests
- Runs all unit tests (39 tests)
- Tests on Node.js versions 18 and 20
- Generates code coverage report
- Uploads coverage to Codecov (on Node 18)
- **Command:** `npm test`

#### E2E Tests
- Runs all end-to-end integration tests (14 tests)
- Tests full API workflows
- Validates authentication, caching, and error handling
- **Command:** `npm run test:e2e`

#### Build Check
- Compiles TypeScript to JavaScript
- Validates that the application builds successfully
- Archives build artifacts for 7 days
- **Command:** `npm run build`

#### All Checks Passed
- Final validation job
- Ensures all previous jobs succeeded
- Provides clear success/failure status

---

### 2. CodeQL Security Scan (`.github/workflows/codeql.yml`)

**Triggers:**
- Push to `main` branch
- Pull requests to `main` branch
- Scheduled: Every Monday at 00:00 UTC

**Purpose:**
- Advanced security analysis
- Detects security vulnerabilities
- Identifies code quality issues
- Uses GitHub's CodeQL engine

---

### 3. Dependency Review (`.github/workflows/dependency-review.yml`)

**Triggers:**
- Pull requests to `main` or `develop` branches

**Purpose:**
- Reviews dependency changes in PRs
- Identifies vulnerable dependencies
- Checks for license compliance
- Comments summary directly in PR
- Fails on moderate or higher severity issues

---

## Pipeline Status

### Status Badges

Add these to your `README.md`:

```markdown
![CI/CD Pipeline](https://github.com/YOUR_USERNAME/carrier-api-simulator/actions/workflows/ci.yml/badge.svg)
![CodeQL](https://github.com/YOUR_USERNAME/carrier-api-simulator/actions/workflows/codeql.yml/badge.svg)
![Dependency Review](https://github.com/YOUR_USERNAME/carrier-api-simulator/actions/workflows/dependency-review.yml/badge.svg)
```

---

## Local Testing Before Push

To ensure your code passes CI/CD checks, run these commands locally:

### 1. Lint Check
```bash
npm run lint
```

### 2. Unit Tests
```bash
npm test
```

### 3. E2E Tests
```bash
npm run test:e2e
```

### 4. Build Check
```bash
npm run build
```

### 5. Security Audit
```bash
npm audit --audit-level=moderate
```

### 6. Run All Checks
```bash
npm run lint && npm test && npm run test:e2e && npm run build && npm audit
```

---

## Test Coverage

### Current Coverage

| Category | Tests | Status |
|----------|-------|--------|
| Unit Tests | 39 | ✅ Passing |
| E2E Tests | 14 | ✅ Passing |
| **Total** | **53** | ✅ **Passing** |

### Coverage Goals

- **Statements**: > 80%
- **Branches**: > 75%
- **Functions**: > 80%
- **Lines**: > 80%

### View Coverage Report

```bash
# Generate coverage report
npm run test:cov

# View HTML report
open coverage/lcov-report/index.html
```

---

## CI/CD Best Practices

### For Contributors

1. **Always run tests locally** before pushing
2. **Fix lint errors** before committing
3. **Update tests** when adding new features
4. **Check npm audit** for security issues
5. **Keep dependencies updated** regularly
6. **Write meaningful commit messages**
7. **Reference issues** in commit messages and PRs

### For Maintainers

1. **Require all checks to pass** before merging PRs
2. **Review security audit results** carefully
3. **Keep Node.js versions updated** in workflows
4. **Monitor test coverage trends**
5. **Address CodeQL alerts** promptly
6. **Update dependencies** regularly
7. **Document breaking changes**

---

## Troubleshooting CI/CD Failures

### Lint Failures

```bash
# Run lint locally
npm run lint

# Auto-fix issues
npm run lint -- --fix
```

### Test Failures

```bash
# Run specific test file
npm test -- quote.service.spec.ts

# Run tests in watch mode
npm run test:watch

# Debug tests
npm run test:debug
```

### Build Failures

```bash
# Clean build directory
rm -rf dist/

# Rebuild
npm run build

# Check TypeScript errors
npx tsc --noEmit
```

### Audit Failures

```bash
# Check for vulnerabilities
npm audit

# Fix automatically (if possible)
npm audit fix

# Force fix (use with caution)
npm audit fix --force

# Review specific vulnerability
npm audit [package-name]
```

---

## GitHub Actions Configuration

### Required Secrets

None required for basic CI/CD. Optional:

- `CODECOV_TOKEN` - For code coverage reporting (optional)

### Branch Protection Rules

Recommended settings for `main` branch:

- ✅ Require pull request reviews before merging
- ✅ Require status checks to pass before merging
  - `Lint Check`
  - `Security Audit`
  - `Unit Tests`
  - `E2E Tests`
  - `Build Check`
- ✅ Require branches to be up to date before merging
- ✅ Include administrators
- ✅ Restrict pushes that create matching branches

---

## Continuous Deployment (Future)

### Planned Enhancements

1. **Automatic Deployment**
   - Deploy to staging on `develop` branch
   - Deploy to production on `main` branch release tags

2. **Docker Integration**
   - Build and push Docker images
   - Deploy to container registry

3. **Performance Testing**
   - Run load tests on staging
   - Monitor API response times

4. **Integration Testing**
   - Test against real carrier APIs (sandbox)
   - Validate API contracts

---

## Monitoring & Alerts

### GitHub Actions

- View workflow runs: `Actions` tab in GitHub
- Check logs for failed jobs
- Re-run failed workflows if needed

### Notifications

Configure notifications in GitHub:
- Settings → Notifications
- Watch repository for workflow failures
- Set up Slack/Discord webhooks (optional)

---

## Performance Metrics

### CI/CD Pipeline Duration

- **Lint Check**: ~30 seconds
- **Security Audit**: ~1 minute
- **Unit Tests**: ~2 minutes (per Node version)
- **E2E Tests**: ~2 minutes
- **Build Check**: ~1 minute

**Total Pipeline Duration**: ~5-7 minutes

---

## Support

For CI/CD issues or questions:

1. Check workflow logs in GitHub Actions
2. Review this documentation
3. Check `TESTING.md` for test-specific help
4. Open an issue with `ci/cd` label

---

## Updates & Maintenance

### Regular Tasks

- **Weekly**: Review security audit results
- **Monthly**: Update Node.js versions
- **Quarterly**: Review and update GitHub Actions versions
- **As needed**: Adjust test coverage thresholds

---

**Last Updated**: November 11, 2025  
**Pipeline Version**: 1.0  
**Status**: ✅ All Workflows Configured and Tested


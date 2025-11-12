# GitHub Repository Setup & CI/CD Testing Guide

## 🎯 Overview

This guide will help you:
1. Create a new repository in the `try-clarence` GitHub organization
2. Push your code to GitHub
3. Create a Pull Request to test CI/CD pipeline
4. Verify all automated checks pass

---

## 📋 Prerequisites

- GitHub account with access to `try-clarence` organization
- Git installed locally
- Node.js 18+ installed
- All tests passing locally (`npm test && npm run test:e2e`)

---

## 🚀 Step-by-Step Instructions

### Step 1: Create Repository on GitHub

1. **Go to the try-clarence organization:**
   - Visit: https://github.com/try-clarence/
   - Click the **"New"** button (or go to https://github.com/organizations/try-clarence/repositories/new)

2. **Repository Settings:**
   - **Repository name:** `carrier-api-simulator`
   - **Description:** `Simple mock API simulator for insurance carriers - MVP version`
   - **Visibility:** Choose `Public` or `Private` (as per your preference)
   - **Initialize repository:** 
     - ❌ **DO NOT** check "Add a README file"
     - ❌ **DO NOT** check "Add .gitignore"
     - ❌ **DO NOT** check "Choose a license"
   - Click **"Create repository"**

3. **Copy the repository URL:**
   - You'll see a page with setup instructions
   - Copy the repository URL (e.g., `https://github.com/try-clarence/carrier-api-simulator.git`)

---

### Step 2: Initialize Local Git Repository

Open terminal in your project directory:

```bash
# Navigate to project directory
cd /Users/minhdoan/work/ai/carrier-api-simulator

# Initialize git (if not already initialized)
git init

# Check current status
git status
```

---

### Step 3: Configure Git (if needed)

```bash
# Set your name and email (if not already set globally)
git config user.name "Your Name"
git config user.email "your.email@example.com"

# Verify
git config user.name
git config user.email
```

---

### Step 4: Add All Files and Create Initial Commit

```bash
# Add all files
git add .

# Check what will be committed
git status

# Create initial commit
git commit -m "Initial commit: Carrier API Simulator with CI/CD

- Complete NestJS backend with 8 API endpoints
- 39 unit tests + 14 E2E tests (all passing)
- Smart quote caching system
- Comprehensive error handling
- CI/CD pipeline with GitHub Actions
- Full documentation"

# Verify commit
git log --oneline
```

---

### Step 5: Add Remote and Push to GitHub

```bash
# Add remote repository (replace with your actual URL)
git remote add origin https://github.com/try-clarence/carrier-api-simulator.git

# Verify remote
git remote -v

# Push to main branch
git branch -M main
git push -u origin main
```

**Note:** You may be prompted for GitHub credentials. Use:
- **Personal Access Token** (recommended) - Create one at: https://github.com/settings/tokens
- Or your GitHub username and password

---

### Step 6: Update README Badges

After pushing, update the README badges with your actual repository path:

1. **Open `README.md`**
2. **Replace `YOUR_USERNAME` with `try-clarence`:**

```markdown
[![CI/CD Pipeline](https://github.com/try-clarence/carrier-api-simulator/actions/workflows/ci.yml/badge.svg)](https://github.com/try-clarence/carrier-api-simulator/actions/workflows/ci.yml)
[![CodeQL](https://github.com/try-clarence/carrier-api-simulator/actions/workflows/codeql.yml/badge.svg)](https://github.com/try-clarence/carrier-api-simulator/actions/workflows/codeql.yml)
```

3. **Commit and push the update:**

```bash
git add README.md
git commit -m "Update README badges with correct repository path"
git push
```

---

### Step 7: Verify CI/CD is Running

1. **Go to your repository on GitHub:**
   - Visit: https://github.com/try-clarence/carrier-api-simulator

2. **Check Actions tab:**
   - Click on **"Actions"** tab
   - You should see workflows running automatically
   - Wait for them to complete (5-7 minutes)

3. **Verify all checks pass:**
   - ✅ Lint Check
   - ✅ Security Audit
   - ✅ Unit Tests
   - ✅ E2E Tests
   - ✅ Build Check

---

### Step 8: Create a Test Pull Request

#### Option A: Create PR via GitHub Web Interface

1. **Create a new branch:**
   ```bash
   # Create and switch to new branch
   git checkout -b test/ci-cd-verification
   
   # Make a small change (e.g., update a comment)
   # Edit any file, or just add a comment to README.md
   
   # Commit the change
   git add .
   git commit -m "Test: Verify CI/CD pipeline on PR"
   
   # Push the branch
   git push -u origin test/ci-cd-verification
   ```

2. **Create Pull Request:**
   - Go to: https://github.com/try-clarence/carrier-api-simulator
   - You'll see a banner: "test/ci-cd-verification had recent pushes"
   - Click **"Compare & pull request"**
   - **Title:** `Test: Verify CI/CD Pipeline`
   - **Description:**
     ```markdown
     ## Purpose
     Testing CI/CD pipeline to ensure all automated checks work correctly.
     
     ## Changes
     - Minor documentation update
     
     ## Checklist
     - [x] All tests pass locally
     - [x] Lint check passes
     - [x] Ready for review
     ```
   - Click **"Create pull request"**

#### Option B: Create PR via GitHub CLI

```bash
# Install GitHub CLI if not installed
# brew install gh  # macOS
# or download from: https://cli.github.com/

# Authenticate
gh auth login

# Create PR
gh pr create --title "Test: Verify CI/CD Pipeline" \
  --body "Testing CI/CD pipeline to ensure all automated checks work correctly." \
  --base main \
  --head test/ci-cd-verification
```

---

### Step 9: Monitor CI/CD on Pull Request

1. **View PR:**
   - Go to: https://github.com/try-clarence/carrier-api-simulator/pulls
   - Click on your PR

2. **Check Status Checks:**
   - Scroll down to see "Checks" section
   - You should see:
     - ✅ Lint Check
     - ✅ Security Audit
     - ✅ Unit Tests (Node 18)
     - ✅ Unit Tests (Node 20)
     - ✅ E2E Tests
     - ✅ Build Check
     - ✅ CodeQL Analysis

3. **Wait for completion:**
   - All checks should complete in ~5-7 minutes
   - Green checkmarks ✅ = Passed
   - Red X ❌ = Failed (check logs)

---

### Step 10: Review CI/CD Results

#### If All Checks Pass ✅

1. **Review the PR:**
   - All status checks show green ✅
   - Code coverage is reported
   - Security scan completed

2. **Merge the PR:**
   - Click **"Merge pull request"**
   - Confirm merge
   - Delete the branch (optional)

#### If Checks Fail ❌

1. **Check the logs:**
   - Click on the failed check
   - Review error messages
   - Fix issues locally

2. **Fix and push:**
   ```bash
   # Make fixes
   # ... edit files ...
   
   # Commit and push
   git add .
   git commit -m "Fix: [describe the fix]"
   git push
   ```

3. **CI/CD will re-run automatically**

---

## 🔍 What to Expect from CI/CD

### Automated Checks

| Check | Duration | What It Does |
|-------|----------|--------------|
| **Lint Check** | ~30 sec | Runs ESLint on all TypeScript files |
| **Security Audit** | ~1 min | Runs `npm audit` for vulnerabilities |
| **Unit Tests** | ~2 min | Runs 39 unit tests on Node 18 & 20 |
| **E2E Tests** | ~2 min | Runs 14 integration tests |
| **Build Check** | ~1 min | Compiles TypeScript to JavaScript |
| **CodeQL** | ~5 min | Advanced security analysis |
| **Dependency Review** | ~1 min | Reviews dependency changes |

**Total Time:** ~5-7 minutes

### Expected Results

✅ **All checks should pass:**
- 39 unit tests passing
- 14 E2E tests passing
- 0 lint errors
- 0 high-severity vulnerabilities
- Successful build
- No security issues detected

---

## 🛠️ Troubleshooting

### Issue: "Permission denied" when pushing

**Solution:**
```bash
# Use Personal Access Token instead of password
# Create token at: https://github.com/settings/tokens
# Select scopes: repo, workflow, write:packages

# Or use SSH instead:
git remote set-url origin git@github.com:try-clarence/carrier-api-simulator.git
```

### Issue: CI/CD workflows not running

**Solution:**
1. Check if GitHub Actions is enabled:
   - Repository → Settings → Actions → General
   - Ensure "Allow all actions" is selected

2. Check workflow files are in correct location:
   - `.github/workflows/ci.yml` exists
   - `.github/workflows/codeql.yml` exists
   - `.github/workflows/dependency-review.yml` exists

### Issue: Tests failing in CI but passing locally

**Solution:**
```bash
# Run tests exactly as CI does
npm ci  # Clean install (not npm install)
npm test
npm run test:e2e
npm run lint
```

### Issue: Badge not showing

**Solution:**
1. Wait a few minutes after first push
2. Ensure workflow has run at least once
3. Check badge URL matches repository path exactly

---

## 📝 Branch Protection Setup (Optional)

To require CI/CD checks before merging:

1. **Go to Settings:**
   - Repository → Settings → Branches

2. **Add Branch Protection Rule:**
   - Branch name pattern: `main`
   - ✅ Require pull request reviews before merging
   - ✅ Require status checks to pass before merging
     - Select all checks:
       - `Lint Check`
       - `Security Audit`
       - `Unit Tests`
       - `E2E Tests`
       - `Build Check`
   - ✅ Require branches to be up to date before merging
   - ✅ Include administrators

3. **Save changes**

---

## ✅ Verification Checklist

Before creating PR, verify locally:

- [ ] `npm run lint` - No errors
- [ ] `npm test` - All 39 tests pass
- [ ] `npm run test:e2e` - All 14 tests pass
- [ ] `npm run build` - Builds successfully
- [ ] `npm audit` - No high-severity issues
- [ ] All files committed
- [ ] README badges updated with correct repo path

---

## 🎉 Success Indicators

You'll know everything is working when:

1. ✅ Repository created successfully
2. ✅ Code pushed to GitHub
3. ✅ Actions tab shows workflows running
4. ✅ All checks pass (green checkmarks)
5. ✅ PR shows all status checks passing
6. ✅ Badges display correctly in README
7. ✅ Code coverage reported
8. ✅ Security scan completed

---

## 📚 Additional Resources

- **GitHub Actions Docs:** https://docs.github.com/en/actions
- **Creating Personal Access Token:** https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token
- **GitHub CLI:** https://cli.github.com/
- **Branch Protection:** https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches

---

## 🚀 Quick Command Reference

```bash
# Initialize and push
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/try-clarence/carrier-api-simulator.git
git branch -M main
git push -u origin main

# Create test PR
git checkout -b test/ci-cd-verification
# ... make changes ...
git add .
git commit -m "Test: Verify CI/CD"
git push -u origin test/ci-cd-verification
gh pr create --title "Test CI/CD" --body "Testing pipeline"
```

---

**Last Updated:** November 11, 2025  
**Status:** Ready to Use ✅




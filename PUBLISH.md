# Publishing tkr-llm-client to GitHub

## Step 1: Create GitHub Repository

Go to: https://github.com/new

Fill in:
- **Repository name**: `tkr-llm-client`
- **Description**: `Generic LLM client library with Claude SDK and local LLM server support`
- **Visibility**: Public (or Private if preferred)
- **Initialize**: ❌ DO NOT initialize with README, .gitignore, or license (we already have these)

Click "Create repository"

## Step 2: Push Local Repository

Once the GitHub repository is created, run:

```bash
cd /Volumes/tkr-riffic/@tkr-projects/tkr-llm-client
git push -u origin main
```

## Step 3: Verify on GitHub

Visit: https://github.com/TuckerTucker/tkr-llm-client

You should see:
- ✅ 77 files
- ✅ 16,059 lines of code
- ✅ README.md displayed
- ✅ MIT license
- ✅ Initial commit: "feat: initial commit of @tkr/llm-client library"

## Step 4: Update ACE to Use New Repository

After successful push, we'll update tkr-ace to reference the new repository.

Two options:

### Option A: Git Submodule (for active development)
```bash
cd /Volumes/tkr-riffic/@tkr-projects/tkr-ace
git rm -rf packages/llm-client
git commit -m "refactor: move @tkr/llm-client to standalone repository"
git submodule add https://github.com/TuckerTucker/tkr-llm-client.git packages/llm-client
git commit -m "chore: add tkr-llm-client as submodule"
```

### Option B: NPM Package (after publishing to npm)
```bash
cd /Volumes/tkr-riffic/@tkr-projects/tkr-ace
rm -rf packages/llm-client
# Update package.json to use published version
npm install @tkr/llm-client
```

## Optional: Publish to NPM

```bash
cd /Volumes/tkr-riffic/@tkr-projects/tkr-llm-client

# Install dependencies and build
npm install
npm run build

# Login to npm (if not already logged in)
npm login

# Publish
npm publish --access public
```

## Repository URL

- **GitHub**: https://github.com/TuckerTucker/tkr-llm-client
- **Clone URL**: `git clone https://github.com/TuckerTucker/tkr-llm-client.git`
- **NPM** (after publishing): `npm install @tkr/llm-client`

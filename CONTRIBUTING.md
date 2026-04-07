# Contributing to Hollow.js

Thank you for your interest in contributing to Hollow.js! This guide explains our development workflow, release process, and contribution guidelines.

## Development Workflow

We use a **trunk-based development** workflow with feature branches merging directly to `main`.

### 1. Setting Up Your Development Environment

```bash
# Clone the repository
git clone https://github.com/yonatang/hollow-js.git
cd hollow-js

# Install dependencies
npm install

# Run tests
npm test -w lib

# Build the library
npm run build -w lib
```

### 2. Making Changes

#### Create a Feature Branch

Always create a new branch from `main` for your changes:

```bash
git checkout main
git pull origin main
git checkout -b feature/your-feature-name
```

Branch naming conventions:
- `feature/` - New features or enhancements
- `fix/` - Bug fixes
- `docs/` - Documentation updates
- `refactor/` - Code refactoring
- `test/` - Test additions or improvements

#### Make Your Changes

- Write clean, well-documented code
- Follow existing code style and conventions
- Add tests for new functionality
- Ensure all tests pass: `npm test -w lib`
- Build successfully: `npm run build -w lib`

### 3. Adding a Changeset

If your changes affect users (new features, bug fixes, breaking changes), you must add a changeset:

```bash
npx changeset
```

This will prompt you to:
1. **Select version bump type** (see Version Bump Guidelines below)
2. **Write a user-friendly description** of your change

The command creates a `.changeset/*.md` file that should be committed with your changes.

#### When to Add a Changeset

**Always add a changeset for:**
- Bug fixes (patch)
- New features (minor)
- Breaking changes (major)
- API changes
- Behavior changes that affect users
- Performance improvements
- Security fixes

**Skip changesets for:**
- Documentation updates
- Test updates
- Build configuration changes
- Internal refactoring (no user-facing impact)
- Development tooling changes
- README updates

#### Version Bump Guidelines

Choose the appropriate version bump type following [Semantic Versioning](https://semver.org/):

**Patch (0.1.0 → 0.1.1)**
- Bug fixes
- Security patches
- Minor performance improvements
- Documentation fixes

**Minor (0.1.0 → 0.2.0)**
- New features
- New APIs (backwards compatible)
- Deprecations (with backwards compatibility)
- Significant performance improvements

**Major (0.1.0 → 1.0.0)**
- Breaking changes
- Removed features or APIs
- Changed behavior that breaks existing code
- Changed APIs (incompatible with previous version)

**Note:** Before 1.0.0, breaking changes may use minor bumps instead of major bumps at maintainer discretion.

#### Writing Good Changeset Descriptions

Write descriptions from the user's perspective:

**Good examples:**
```
Add support for reading multi-shard snapshots
Fix crash when loading snapshots with empty lists
Improve performance of GenericHollowObject field access by 30%
```

**Bad examples:**
```
Updated code
Fixed bug
Changed implementation
```

### 4. Submitting a Pull Request

#### Before Submitting

- [ ] All tests pass: `npm test -w lib`
- [ ] Code builds successfully: `npm run build -w lib`
- [ ] Changeset added (if applicable)
- [ ] Code follows project conventions
- [ ] Documentation updated (if needed)

#### Create the PR

```bash
git add .
git commit -m "feat: add your feature description"
git push origin feature/your-feature-name
```

Then open a Pull Request on GitHub:
- Use a clear, descriptive title
- Reference any related issues
- Describe what changed and why
- Include screenshots for UI changes
- Add testing instructions if relevant

#### PR Review Process

- CI will automatically run tests on your PR
- Maintainers will review your changes
- Address any feedback or requested changes
- Once approved, a maintainer will merge your PR

### 5. After Your PR is Merged

- Your changeset will accumulate on `main`
- Your changes will NOT be released immediately
- Releases are batched and happen when a maintainer triggers them
- You'll be credited in the CHANGELOG when the release happens

## Release Process (For Maintainers)

### How Releases Work

We use a **batching release strategy** where multiple changes accumulate on `main` and are released together at controlled intervals.

### Triggering a Release

1. **Navigate to GitHub Actions** → "Create Version PR"
2. **Click "Run workflow"** on the `main` branch
3. **Wait for the workflow** to create a "Version Packages" PR
4. **Review the PR:**
   - Check that the version bump is appropriate
   - Review all changelog entries
   - Verify all changes are properly documented
5. **Merge the PR** to trigger automatic publishing

### What Happens When You Merge the Version PR

1. The publish workflow automatically runs
2. Tests are executed
3. Library is built
4. Package is published to npm
5. Git tag is created (e.g., `v0.2.0`)
6. GitHub release is created with changelog

### Release Cadence

Releases can happen:
- **Weekly** - Regular cadence for batching changes
- **Bi-weekly** - For larger releases
- **Ad-hoc** - For urgent fixes or when significant features are ready
- **Emergency** - Immediate release for critical bugs/security issues

### Emergency Hotfix Process

For critical bugs or security issues:

1. Create hotfix branch from `main`
2. Make the fix
3. Add changeset with patch bump
4. Get PR approved and merged
5. **Immediately** trigger "Create Version PR" workflow
6. Review and merge Version PR
7. Verify publish completes successfully

## Code Style and Conventions

### JavaScript/TypeScript

- Use ES6+ features
- Follow existing indentation (2 spaces)
- Use meaningful variable and function names
- Add JSDoc comments for public APIs
- Prefer `const` over `let`, avoid `var`

### Testing

- Write tests for new features
- Maintain or improve code coverage
- Use descriptive test names
- Test edge cases and error conditions

### Commit Messages

Use conventional commit format:

```
type(scope): description

[optional body]

[optional footer]
```

Types:
- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation changes
- `test` - Test additions/changes
- `refactor` - Code refactoring
- `perf` - Performance improvements
- `chore` - Maintenance tasks

Examples:
```
feat(api): add support for snapshot deltas
fix(parser): handle empty string fields correctly
docs(readme): update installation instructions
test(types): add tests for map type edge cases
```

## Development Tips

### Running Tests

```bash
# Run all tests
npm test -w lib

# Run tests in watch mode
npm test -w lib -- --watch

# Run specific test file
npm test -w lib -- path/to/test.js
```

### Building

```bash
# Build library
npm run build -w lib

# Build and watch for changes
npm run build -w lib -- --watch
```

### Using the Demo App

Test your changes in the demo application:

```bash
# Build library and install in demo
npm run install:demo

# Start demo server
npm run dev:demo

# Open http://localhost:5173
```

### Debugging

- Use browser DevTools for debugging in the demo
- Add `console.log` statements for quick debugging
- Use breakpoints in browser DevTools

## Getting Help

- **Questions?** Open a [Discussion](https://github.com/yonatang/hollow-js/discussions)
- **Bug reports?** Open an [Issue](https://github.com/yonatang/hollow-js/issues)
- **Feature requests?** Open an [Issue](https://github.com/yonatang/hollow-js/issues) with the `enhancement` label

## Code of Conduct

- Be respectful and inclusive
- Provide constructive feedback
- Focus on what's best for the project
- Help others learn and grow

## License

By contributing to Hollow.js, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to Hollow.js!

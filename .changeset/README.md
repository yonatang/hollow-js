# Changesets

This directory contains changeset files that track changes to the `@yonatang/hollow-js` package.

## Quick Start

When making user-facing changes (bug fixes, new features, breaking changes):

```bash
npx changeset
```

This creates a changeset file that describes your change and will be included in the next release.

## Developer Workflow

We use a **trunk-based development** workflow where changes merge directly to `main` and releases are batched.

### Making Changes

1. **Create a feature branch** from `main`
   ```bash
   git checkout -b feature/your-feature
   ```

2. **Make your changes** in `lib/`

3. **Add a changeset** (for user-facing changes)
   ```bash
   npx changeset
   ```
   - Select version bump: **patch** (bug fix), **minor** (feature), **major** (breaking change)
   - Write a user-friendly description
   - Commit the generated `.changeset/*.md` file

4. **Open a PR** to `main`
   - CI runs tests automatically
   - Review and merge when approved

5. **Changes accumulate** on `main`
   - Your changeset files remain on `main`
   - No automatic release happens

### When Releases Happen

Releases are triggered **manually by maintainers** when ready to batch multiple changes:

1. Maintainer triggers "Create Version PR" workflow in GitHub Actions
2. CI creates a PR that:
   - Consumes all accumulated changesets
   - Updates `lib/package.json` version
   - Updates `lib/CHANGELOG.md`
   - Deletes consumed changeset files
3. Maintainer reviews and merges the Version PR
4. CI automatically publishes to npm

### Version Bump Guidelines

Choose the appropriate bump type:

- **patch** (0.1.0 → 0.1.1) - Bug fixes, security patches, minor improvements
- **minor** (0.1.0 → 0.2.0) - New features, new APIs (backwards compatible)
- **major** (0.1.0 → 1.0.0) - Breaking changes, removed features

### When to Add Changesets

**Add a changeset for:**
- Bug fixes
- New features
- Breaking changes
- API changes
- Behavior changes
- Performance improvements
- Security fixes

**Skip changesets for:**
- Documentation updates
- Test updates
- Build configuration
- Internal refactoring
- Development tooling

## What Happens Behind the Scenes

- Changesets accumulate on `main` without triggering releases
- Manual workflow dispatch creates a Version PR
- Merging the Version PR triggers automatic publish to npm
- Git tags and GitHub releases are created automatically
- Changesets are configured to ignore the `demo` workspace (only version the library)

## Learn More

For complete contributing guidelines, see [CONTRIBUTING.md](../CONTRIBUTING.md)

Additional resources:
- [Changesets Documentation](https://github.com/changesets/changesets)
- [Adding a Changeset](https://github.com/changesets/changesets/blob/main/docs/adding-a-changeset.md)
- [Semantic Versioning](https://semver.org/)

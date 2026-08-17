# Contributing

Pull requests are welcome!

To begin, clone the repo, then install dependencies.

```bash
pnpm install
```

The source code is written in TypeScript. Spin up the compiler to watch for source changes:

```bash
pnpm run watch
```

Note remember to add a Changeset entry for your work before submitting a PR. (`pnpm changeset` then follow the prompts.)


## Publishing

Releases are published from CI via npm Trusted Publishing (OIDC) — never locally. To release:

```bash
pnpm changeset version   # folds pending changesets into CHANGELOG.md and bumps package.json
git commit -am "chore: release X.Y.Z"
git tag vX.Y.Z
git push origin main vX.Y.Z
```

Pushing the tag triggers `.github/workflows/release.yml`, which verifies the tag matches `package.json`, builds, lints, tests, and publishes to npm with provenance. The weekly update workflow also auto-releases a patch version when dependency updates produce changes.

See [Changesets Docs](https://github.com/changesets/changesets/blob/main/docs/intro-to-using-changesets.md) for more info on how to use changesets.

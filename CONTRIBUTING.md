# Contributing

Pull requests are welcome!

To begin, clone the repo, then install dependencies.

```
npm install
```

The source code is written in TypeScript. Spin up the compiler to watch for source changes:

```
npm run watch
```

## Publishing

1. Publish the package and push.

    ```
    npm version major/minor/patch
    npm publish
    git push
    git push --tags
    ```

1. Create a Github release with notable changes.

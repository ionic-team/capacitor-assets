---
'@capacitor/assets': patch
---

Declare `@ionic/cli-framework-output` as a runtime dependency.

`src/util/log.ts` and `src/util/cli.ts` import it directly, but it was never listed
in `dependencies`. It happened to be installed because `@capacitor/cli` depended on
it. Once `@capacitor/cli` moved to `devDependencies`, nothing pulled it into a
consumer's tree, and `capacitor-assets` failed at startup with
`Cannot find module '@ionic/cli-framework-output'`.

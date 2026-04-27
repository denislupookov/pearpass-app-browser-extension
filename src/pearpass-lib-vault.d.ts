// Ambient declaration for @tetherto/pearpass-lib-vault.
// The published package ships JavaScript without a bundled .d.ts, so TypeScript
// consumers hit TS7016 ("could not find a declaration file"). Declaring the
// module here silences that error repo-wide; symbols remain `any` until the
// upstream package ships real types.
declare module '@tetherto/pearpass-lib-vault'

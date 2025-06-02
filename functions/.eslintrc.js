module.exports = {
  root: true,
  env: {
    es6: true,
    node: true,
  },
  extends: [
    "eslint:recommended",
    "plugin:import/errors",
    "plugin:import/warnings",
    "plugin:import/typescript",
    "google",
    "plugin:@typescript-eslint/recommended"
  ],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    // Point at the Functions TypeScript config(s)
    project: ["./tsconfig.json"],
    sourceType: "module",
    ecmaVersion: 2021
  },
  ignorePatterns: [
    "/lib/**/*",         // compiled output
    "/node_modules/**/*" // dependencies
  ],
  plugins: [
    "@typescript-eslint",
    "import"
  ],
  rules: {
    // Use double quotes by default; allow single when escaping
    "quotes": ["error", "double", { "avoidEscape": true }],
    // Turn off unresolved-import errors (we trust TypeScript)
    "import/no-unresolved": "off",
    // enforce 2-space indentation
    "indent": ["error", 2],
    // allow console.log in functions
    "no-console": "off",
    // disable the Google rule that conflicts with TypeScript’s optional chaining, etc.
    "require-jsdoc": "off",
    // ensure imports appear at top
    "import/first": "error",
    // allow non-null assertions in TS
    "@typescript-eslint/no-non-null-assertion": "off"
  }
};

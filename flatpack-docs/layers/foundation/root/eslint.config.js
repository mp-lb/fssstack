import eslintJs from "@eslint/js";
import importPlugin from "eslint-plugin-import";
import format from "eslint-plugin-prettier/recommended";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";
import react from "eslint-plugin-react";
import reactRefresh from "eslint-plugin-react-refresh";

export default [
  {
    ignores: [
      "**/dist/**",
      "**/.next/**",
      "**/node_modules/**",
      "**/.turbo/**",
      "**/.git/**",
      "etc/**",
      "**/vitest.config.ts",
      "**/vite.config.ts",
      "**/tailwind.config.ts",
      "**/tailwind.config.js",
      "**/tailwind.config.mjs",
      "**/eslint.config.js",
      "**/next.config.ts",
      "**/postcss.config.mjs",
      "eslint.config.js",
    ],
  },
  eslintJs.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: {
      parserOptions: {
        project: [
          "./etc/tsconfig.base.json",
          "./apps/**/tsconfig.json",
          "./apps/**/tsconfig.app.json",
          "./packages/**/tsconfig.json",
        ],
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      "react-hooks": reactHooks,
      react,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
    },
  },
  format,
  {
    plugins: { import: importPlugin },
    rules: {
      "import/no-duplicates": "warn",
      "import/no-default-export": "warn",
      "import/extensions": ["error", "never", { json: "always" }],
      "import/no-useless-path-segments": ["error", { noUselessIndex: true }],
      "padding-line-between-statements": [
        "error",
        { blankLine: "always", prev: "*", next: "block-like" },
        { blankLine: "always", prev: "block-like", next: "*" },
        { blankLine: "always", prev: "multiline-expression", next: "*" },
        { blankLine: "always", prev: "multiline-const", next: "*" },
        { blankLine: "always", prev: "*", next: "multiline-const" },
      ],
      "@typescript-eslint/no-explicit-any": "off",
      "react/jsx-newline": ["error", { prevent: true }],
    },
  },
];

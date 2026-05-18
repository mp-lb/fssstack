import eslintJs from "@eslint/js";
import prettier from "eslint-plugin-prettier/recommended";
import globals from "globals";
import tseslint from "typescript-eslint";

export default [
  {
    ignores: [
      ".doctrine/**",
      "node_modules/**",
      "scripts/**",
      "layers/**",
      "extensions/**",
    ],
  },
  eslintJs.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.ts", "**/*.js"],
    languageOptions: {
      globals: globals.node,
    },
  },
  prettier,
];

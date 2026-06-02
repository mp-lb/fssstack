import { createBaseEslintConfig } from "@mp-lb/fssstack-config/eslint";

export default createBaseEslintConfig({
  tsconfigRootDir: import.meta.dirname,
});

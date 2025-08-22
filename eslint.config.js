// eslint.config.js
import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default [
  // Ignore build output
  { ignores: ["dist"] },

  // Base JS rules
  js.configs.recommended,

  // TypeScript rules (non type-checked, fast)
  ...tseslint.configs.recommended,

  // Project rules
  {
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",

      semi: ["error", "always"],
      quotes: ["error", "double"],
      "no-unused-vars": "warn",
      "@typescript-eslint/no-explicit-any": "off",
    },
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser,
    },
  },
];

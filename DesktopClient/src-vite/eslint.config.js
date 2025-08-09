import js from "@eslint/js";
import stylistic from '@stylistic/eslint-plugin';
import eslintPluginReact from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import { defineConfig, globalIgnores } from "eslint/config";
import globals from "globals";
import tseslint from "typescript-eslint";

export default defineConfig([
    globalIgnores(["dist"]),
    {
        files: ["**/*.{js,jsx,ts,tsx}"],
        extends: [
            js.configs.recommended,
            reactHooks.configs["recommended-latest"],
        ],
        languageOptions: {
            ecmaVersion: 2023,
            globals: {
                ...globals.browser,
                igniteView: "readonly",
            },
            parser: tseslint.parser,
            parserOptions: {
                ecmaVersion: 2023,
                ecmaFeatures: { jsx: true },
                sourceType: "module"
            },
        },
        plugins: {
            "@typescript-eslint": tseslint.plugin,
            react: eslintPluginReact,
            '@stylistic': stylistic
        },
        rules: {
            "no-unused-vars": ["off", { varsIgnorePattern: "^[A-Z_]" }],
            "@stylistic/indent": ["error", 4, { SwitchCase: 1 }],
            "quotes": ["error", "double", { avoidEscape: true }],
            "semi": ["error", "always"],
            "no-var": "error",
            "react-hooks/exhaustive-deps": "off",
            "react/jsx-max-props-per-line": ["error", {
                maximum: 1,
                when: "multiline",
            }],
            "function-paren-newline": ["error", "multiline-arguments"],
        },
    },
]);
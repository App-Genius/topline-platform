import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,

  // Architecture enforcement: Pages must not import api-client directly
  {
    files: ["app/**/page.tsx", "app/**/layout.tsx"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "@/lib/api-client",
              message:
                "Pages must not import api-client directly. Use hooks from @/hooks/useApi instead.",
            },
          ],
          patterns: [
            {
              group: ["**/lib/api-client*"],
              message:
                "Pages must not import api-client directly. Use hooks from @/hooks/useApi instead.",
            },
          ],
        },
      ],
    },
  },

  // Architecture enforcement: UI Components must be pure presentational
  {
    files: ["components/ui/**/*.tsx"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "@/hooks/useApi",
              message:
                "UI components must be pure presentational. No data fetching hooks allowed.",
            },
            {
              name: "@/lib/api-client",
              message:
                "UI components must be pure presentational. No API imports allowed.",
            },
            {
              name: "@/context/AuthContext",
              message:
                "UI components must be pure presentational. Use props instead of auth context.",
            },
          ],
          patterns: [
            {
              group: ["**/hooks/useApi*", "**/lib/api-client*"],
              message:
                "UI components must be pure presentational. No data fetching allowed.",
            },
          ],
        },
      ],
    },
  },

  // Architecture enforcement: Feature components use hooks, not api-client
  {
    files: ["components/features/**/*.tsx"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "@/lib/api-client",
              message:
                "Feature components must use hooks for data. Import from @/hooks/useApi instead.",
            },
          ],
          patterns: [
            {
              group: ["**/lib/api-client*"],
              message:
                "Feature components must use hooks for data. Import from @/hooks/useApi instead.",
            },
          ],
        },
      ],
    },
  },

  // General rules
  {
    rules: {
      // Warn on console.log in production code
      "no-console": ["warn", { allow: ["warn", "error"] }],

      // TypeScript: allow unused vars with underscore prefix
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],

      // Warn on any type usage
      "@typescript-eslint/no-explicit-any": "warn",
    },
  },

  // Override default ignores
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "node_modules/**",
    "coverage/**",
  ]),
]);

export default eslintConfig;

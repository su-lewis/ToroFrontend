import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";
// It's good practice to also import globals if you need to define them,
// and js from @eslint/js for base JavaScript rules, though Next.js config might handle this.
// import globals from "globals";
// import js from "@eslint/js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
  // resolvePluginsRelativeTo: __dirname, // Might be needed if plugins are local
});

// Start with the Next.js core web vitals configuration
const eslintConfig = [
  ...compat.extends("next/core-web-vitals"),

  // ADD YOUR CUSTOM RULE OVERRIDES HERE
  // This new object will apply to all files matched by the extended config,
  // or you can add a "files" glob here if you want to be more specific.
  {
    rules: {
      "react/no-unescaped-entities": "off", // "off" disables the rule, "warn" makes it a warning
      // You can add other custom rule settings here, for example:
      // "no-console": "warn", // Example: Warn about console.log statements
    },
    // If you wanted this rule override to only apply to certain files, you'd add:
    // files: ["src/**/*.{js,jsx,ts,tsx}"], 
    // But for a general override of a rule from an extended config, just `rules` is often enough.
  }
];

export default eslintConfig;
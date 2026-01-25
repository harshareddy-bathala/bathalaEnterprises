import eslintConfigNext from "eslint-config-next";

/** @type {import('eslint').Linter.Config[]} */
export default [
  ...eslintConfigNext(
    {
      extends: ["next/core-web-vitals"],
      rules: {
        "@next/next/no-img-element": "off"
      }
    },
    { nextRootDir: "./" }
  )
];
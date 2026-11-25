import next from "eslint-config-next/core-web-vitals";

const config = [
  { ignores: [".next/**", "next-env.d.ts"] },
  ...next,
  {
    files: ["**/*.{js,jsx,mjs,ts,tsx}"],
    rules: {
      // React-Compiler-Regeln: vorerst Hinweise. Beheben hieße, Lade-/Login-Logik umzubauen.
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/purity": "warn",
      // Anführungszeichen in deutschem UI-Text sind gewollt.
      "react/no-unescaped-entities": "off",
    },
  },
];

export default config;

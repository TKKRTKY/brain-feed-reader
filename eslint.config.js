import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

/** @type {import("eslint").Linter.Config} */
const config = {
  root: true,
  extends: [
    'next/core-web-vitals',
    'prettier'
  ],
  parserOptions: {
    project: path.join(__dirname, 'tsconfig.json')
  }
};

export default config;

# Portfolio — Uday Chittala

One page, seven sections, no router. `DESIGN.md` is the specification.

## Running it

```sh
npm run dev     # site on :5173
npm run api     # contact API on :8787 — dev proxies /api to it
npm test        # ripple, bloub, contrast, and the contact API
npm run build   # static site into dist/
```

The site works with no API at all: the contact form falls back to the
`mailto:` link that is already the biggest thing in the section. The API only
makes it convenient.

## Contact API

`server/` is dependency-free — `node:http` and `node:sqlite`, both stdlib on
Node 22.5+. `POST /api/contact` validates, stores the request in SQLite, and
answers immediately; mail goes out afterwards and never blocks the response.

| Env | What it does |
|---|---|
| `PORT` | API port, default `8787` |
| `CONTACT_DB` | SQLite file, default `contact.db` (gitignored) |
| `RESEND_API_KEY` | Mail provider key. Unset ⇒ requests are stored and logged, not mailed |
| `CONTACT_TO` | Where the notification goes |
| `CONTACT_FROM` | A sender on a domain verified with the provider |

In production, put the API behind the same origin as the static site so the
browser call stays same-origin and there is no CORS to configure.

Read stored requests with any SQLite client:

```sh
sqlite3 contact.db 'select created_at, name, email, message from requests order by id desc'
```

---

# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is enabled on this template. See [this documentation](https://react.dev/learn/react-compiler) for more information.

Note: This will impact Vite dev & build performances.

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])

```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])

```

# Shelf Esteem

A virtual bookshelf for your Goodreads books. Enter your Goodreads user ID and Shelf Esteem reads
your "read" shelf from the public Goodreads RSS feed. For now it shows your name and how many books
you have read; the actual bookshelf view is coming next.

Your user ID is the last part of your Goodreads profile URL, number and name together, e.g.
`goodreads.com/user/show/123456789-cooluser` -> `123456789-cooluser`.

## Local development

```bash
pnpm install
pnpm start
```

Then open `http://localhost:4200/`.

Goodreads does not allow cross-origin requests, so the dev server proxies every request under
`/goodreads` to `https://www.goodreads.com` (see `proxy.conf.json`). That only works with
`pnpm start`; a production build will need a backend that fetches the feed instead.

## Tests

```bash
pnpm test
```

Unit tests run with [Vitest](https://vitest.dev/) through the Angular CLI.

## Building

```bash
pnpm build
```

The build output goes to `dist/`.

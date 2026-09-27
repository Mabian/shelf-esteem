# Shelf Esteem

A virtual bookshelf for your Goodreads books. Enter your Goodreads user ID and Shelf Esteem reads
your "read" shelf from the public Goodreads RSS feed and puts every book on a drawn bookcase,
newest first, with a divider for each year. Each spine takes its color from the book's cover.
Hover a book to tip it out of the shelf, click it to see its cover large. The bookcase comes in
Walnut, Oak, Lavender and White.

Pages:

- `/`: enter your Goodreads user ID
- `/shelf/<user-id>`: the bookcase, shareable
- `/shelf/<user-id>/book/<book-id>`: one opened book

Your user ID is the last part of your Goodreads profile URL, number and name together, e.g.
`goodreads.com/user/show/123456789-cooluser` -> `123456789-cooluser`.

## Local development

```bash
pnpm install
pnpm start
```

Then open `http://localhost:4200/`.

Goodreads does not allow cross-origin requests, so the dev server proxies every request under
`/goodreads` to `https://www.goodreads.com` (see `proxy.conf.json`). Production builds go through
a Cloudflare Worker instead, see [Deployment](#deployment).

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

## Deployment

The app is served from GitHub Pages at `https://mabian.github.io/shelf-esteem/`. Every push to
`main` builds and deploys it (`.github/workflows/deploy.yml`). The path it is served under is
`BASE_HREF` in that workflow.

In production the app fetches the feed through a Cloudflare Worker (`goodreads-proxy/`), which
forwards only shelf RSS requests to Goodreads and adds a CORS header for the app's origin. Its URL
is `goodreadsUrl` in `src/environments/environment.ts`, the allowed origin is `ALLOWED_ORIGIN` in
`goodreads-proxy/wrangler.toml`. Deploy it with:

```bash
pnpm wrangler login
pnpm deploy:proxy
```

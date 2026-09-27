// Forwards requests for a Goodreads RSS shelf and adds the CORS header Goodreads does not send.

interface Env {
  ALLOWED_ORIGIN: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    // Only the shelf feed, so the worker cannot be used as an open proxy
    if (!/^\/review\/list_rss\/[\w-]+$/.test(url.pathname)) {
      return new Response('Not found', { status: 404 });
    }
    const upstream = await fetch(`https://www.goodreads.com${url.pathname}${url.search}`, {
      // Goodreads answers some non-browser user agents with 403
      headers: {
        'user-agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36',
      },
    });
    const response = new Response(upstream.body, upstream);
    response.headers.set('access-control-allow-origin', env.ALLOWED_ORIGIN);
    return response;
  },
};

# Kingfisher

The source for Kingfisher, a web interface for visualizing the data provided by the Kingfisher API [[source]](https://git.rthak.com/rthak/kingfisher-api).

Inspired by [Madgrades](https://github.com/Madgrades/madgrades.com).

## Development

```sh
npm ci
npm run dev
```

The dev server proxies `/v1` requests to a local instance of the [Kingfisher API](https://git.rthak.com/rthak/kingfisher-api). Set `VITE_API_URL` to point at a different API instance if needed.

## Building

```sh
npm run build
```

## Docker

```sh
docker compose up --build
```

## Cloudflare Tunnel deployment

The Docker Compose configuration binds the web server to `127.0.0.1:5903` so it
cannot be reached directly from the Internet. Configure the Tunnel's public
hostname to point to `http://localhost:5903` on the host.

For U.S. visitor logging, configure Cloudflare Request Header Transform Rules to
remove `x-kf-us-visitor` and `x-kf-state` from every request, then add both only
when `ip.src.country eq "US"`. The server writes one JSON log record for each
U.S. HTML page request using `cf-connecting-ip`, `x-kf-state`, the path, and the
referrer.

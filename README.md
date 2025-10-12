This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Docker Run

Run the app in Docker with a minimal production image.

- Build image:

```bash
docker build -t url-dashboard:latest .
```

- Run container (set required environment variables):

```bash
docker run -d \
  -p 3000:3000 \
  --name url-dashboard \
  -e NOCODB_API_URL="https://nocodb.yourdomain.com/api/v2/tables/" \
  -e NOCODB_TABLE_ID="mj4pqtmythccrm0" \
  -e NOCODB_API_TOKEN="<your_nocodb_api_token>" \
  url-dashboard:latest
```

- Or with Docker Compose (uses provided `docker-compose.yml`):

```bash
docker-compose up -d
```

Notes:
- The app listens on port `3000`.
- `NOCODB_API_URL` should be the base URL only (e.g., `https://nocodb.yourdomain.com/api/v2/tables/`).
- The code constructs the full endpoint as `${NOCODB_API_URL}${NOCODB_TABLE_ID}/records?offset=0&limit=1000`.
- Prefer passing secrets via environment variables instead of baking them into the image.

## Change Log

### 2025-10-12
- Fixed Next.js dynamic route params for v15+: await `params` before destructuring.
- Corrected NocoDB authentication header from `xc-auth` to `xc-token`.
- Separated base API URL and table ID:
  - `NOCODB_API_URL` now stores only `https://nocodb.yourdomain.com/api/v2/tables/`.
  - Full records endpoint is hardcoded in code: `/records?offset=0&limit=1000`.
- Implemented URL status indicators on cards with client-side async checks.
- Added infinite scroll style batch checking (9 URLs per viewport batch).
- Added containerization support: `.dockerignore`, `Dockerfile`, and `docker-compose.yml` for minimal production builds.

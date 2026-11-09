# Vercel deployment

User chose Vercel for both frontend and backend. MongoDB remains on Atlas and images on Cloudinary. Public deployment and credentials are not verified yet.

## Import settings

- Import GitHub repository `Raju-ol/student-doubt-forum`.
- Root Directory: repository root (`./`), not `client` or `server`.
- Framework Preset: Vite.
- Build Command: `npm run build`.
- Output Directory: `client/dist`.
- Install Command: `npm ci`.
- Node.js: 24.x, matching the local tested major release.

`vercel.json` declares these build settings and routes `/api/*` to the Node function. Other routes fall back to the React application. `api/index.js` runs the Express API after obtaining a cached MongoDB connection. The frontend calls the same-origin `/api/v1` endpoint. Do not set `VITE_API_URL` to localhost in Vercel.

## Private environment variables

Configure these in Vercel, not in GitHub or chat:

| Name | Value |
|---|---|
| MONGO_URI | Atlas connection URI with real database password and database name `student_doubt_forum` |
| JWT_SECRET | A newly generated cryptographic random value, minimum 32 characters |
| NODE_ENV | production |
| CLIENT_URL | Exact public HTTPS website origin; update after the domain is known |
| CLOUDINARY_CLOUD_NAME | Cloudinary account cloud name |
| CLOUDINARY_API_KEY | Cloudinary account API key |
| CLOUDINARY_API_SECRET | Cloudinary account secret |

Keep Preview credentials in a separate database from Production if enabling preview deployments. Do not copy the local MongoDB URL into Vercel. URI passwords containing reserved characters must be percent-encoded, using a trusted local method rather than an online converter. Avoid pasting a raw password into a terminal command/history.

## Network access and deployment check

Atlas must allow the deployed function's outbound connections. Use the available Vercel networking options and corresponding Atlas allowlist. No broad allowlist change is assumed authorized. Resolve network access before calling deployment complete.

After deployment, verify `/api/v1/health`, signup/login, two-student question/answer/vote/accept/search flow, deep-link refresh, admin moderation and real image upload/deletion. A successful build alone does not prove database connectivity.

Vercel function requests have payload/time limits. Current application uses a 3 MB image limit, below the documented 4.5 MB request payload limit, allowing for multipart overhead. Rate-limit counters currently live in each function instance's memory, so they are not globally shared across instances. Wider public usage needs a shared limiter.

References checked 9 November 2026:
- https://vercel.com/docs/frameworks/backend/express
- https://vercel.com/docs/functions/runtimes/node-js
- https://vercel.com/docs/rewrites

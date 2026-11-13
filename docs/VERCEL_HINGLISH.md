<!-- consistency-review-2026-11-13 -->
> Current status, 13 November 2026 — See [current implementation and limits](CURRENT_STATE.md). The active design has Auto/Light/Dark themes and a separate community resource Library. Institution-scoped curriculum and publication review remain planned. Older counts, release IDs and provider checks below are dated evidence, not current certification.

# Vercel deployment and service configuration

Reviewed 10 November 2026. [Stable production URL](https://student-doubt-forum-theta.vercel.app/) · [Verified deployment](https://vercel.com/int-0f9c/student-doubt-forum/81MPP4fVFjP6gTwYEaMyvAirC4uu)

Vercel hosts the frontend and Express function from one repository and one origin. Atlas stores forum data, Cloudinary stores screenshots, and Upstash coordinates rate limits across function instances. This setup was chosen for GitHub-linked deploys, HTTPS, one public URL and one dashboard for configuration and logs.

## Import and build

Import Raju-ol/student-doubt-forum or your fork. Use the repository root, Vite, npm ci, npm run build, and client/dist. Match a supported Node version from package.json and CI. vercel.json handles API and SPA routing plus response headers. Point CLIENT_URL and APP_URL to the stable origin. Use an isolated Atlas database and provider configuration for Preview.

## Environment variables

| Variable | Production purpose |
| --- | --- |
| MONGO_URI | Private Atlas connection URI, including database name student_doubt_forum. Scope the database user to the app database. |
| JWT_SECRET | Private random JWT signing secret of at least 32 characters. |
| CLIENT_URL, APP_URL | Stable frontend origin and email link base. |
| CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET | Matching Cloudinary configuration. Keep the API secret private. |
| UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN | Matching Upstash REST settings. Store the token as a secret. |
| GOOGLE_CLIENT_ID | Google Web client ID. Register the stable site origin under Authorized JavaScript origins. Use the popup from that origin. |
| EMAIL_PROVIDER | gmail selects Gmail SMTP. Unset defaults to the Resend path. |
| GMAIL_SMTP_USER, GMAIL_APP_PASSWORD | Sender Gmail address and its own Google-generated App Password. Save the password as Secret. |
| EMAIL_RECOVERY_ENABLED | 1 allows recovery for eligible password accounts. |
| EMAIL_ENABLED, EMAIL_VERIFICATION_REQUIRED | Leave unset or 0 for recovery-only rollout. |
| EMAIL_TEST_RECIPIENT | Optional single-recipient test while general recovery is off. |
| RESEND_API_KEY, EMAIL_FROM | Alternative Resend configuration when selected, with an eligible sender. |

Redeploy after updating Production variables. Keep all keys and passwords in Vercel rather than Git or shareable material. Full setup and troubleshooting are in [playbook section G](DOUBT_FORUM_A_TO_Z_PLAYBOOK.md#g-deploy-and-configure).

## Deployment checks

1. Confirm the intended commit and check /api/v1/health for a connected database.
2. Confirm /api/v1/catalog and /api/v1/doubts?scope=all&tag=study-library&limit=1 return expected data.
3. From the stable URL, confirm login, deep-link refresh, the two-student walkthrough, Google popup, and reset delivery to an approved inbox.
4. Check Vercel Runtime Logs for failures. The response Server-Timing header helps separate database readiness, rate limiting and feed queries.
5. Track the actual Atlas allowlist expiry. Check networking before a public launch. Use [owner checklist](OWNER_NEXT_STEPS_HINGLISH.md) for the restore and staging gates.

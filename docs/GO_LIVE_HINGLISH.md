# Live application setup

Target: 12 November 2026, based on the user's reply. Deadline is a target, not a guarantee. Code is prepared locally; a public URL has not been deployed yet.

## Sabse pehla step

GitHub account banayein: https://github.com/signup

Apna email verify karein. Password, OTP aur recovery codes khud enter karein; chat mein share na karein. Account ready ho to Codex ko sirf “GitHub account ready” batayein. Phir source repository connect karne ka next step karenge. Is folder ke private `.env` ya `node_modules` upload nahi karne.

## Phir live database

MongoDB Atlas account: https://www.mongodb.com/cloud/atlas/register

1. Account verify karein aur naya project banayein.
2. Free cluster option choose karein; paid upgrade mat select karein.
3. Database user ka strong password khud banayein.
4. Database access ko intended application database tak limit karein.
5. Network access mein development ke liye apna current IP, deployment ke liye hosting service ke required outbound IPs allow karein. Broad internet access ko default mat banayein.
6. Drivers connection string ko private hosting environment mein `MONGO_URI` ke roop mein configure karna hai. Chat mein connection string mat paste karein.

## Images ke liye Cloudinary

Signup: https://cloudinary.com/users/register_free

Console ke Settings → API Keys mein cloud name, API key aur API secret milenge. Private local `server/.env` aur hosting environment mein corresponding `CLOUDINARY_` variables set karein. Values chat, screenshots ya GitHub mein share na karein. Phir actual upload, image open, ownership check aur delete test karenge.

## Website hosting

Render signup: https://dashboard.render.com/register

User-owned repository connect karke Node Web Service banayein. Agar repository root ye project hai:

- Build command: `npm ci && npm run build`
- Start command: `npm start`
- Health path: `/api/v1/health`
- Node version: compatible Node 24 release or 22.12+
- `NODE_ENV=production`, `TRUST_PROXY=1`
- Private `JWT_SECRET`: generated random value, minimum 32 characters
- Private `MONGO_URI`: Atlas URI with intended database name
- `CLIENT_URL`: actual HTTPS public website URL
- Three Cloudinary variables: private account values

Frontend aur backend ek service par rahenge. Alag frontend hosting account ki zaroorat nahi. `render.yaml` is configuration ka blueprint hai; account creation, environment values aur deployment abhi pending hain. Current free-plan availability/limits dashboard par confirm karein. Render free web services may sleep after inactivity; first request may take longer. Select a paid service only with explicit user approval.

## Website ko complete live kab kahenge

- Public HTTPS URL opens on another device/network.
- Two new accounts can register and log in.
- First account posts a question with actual uploaded image.
- Second account answers and votes.
- Question owner accepts the answer.
- Search/filter finds the discussion.
- Reload restores a valid session; sign out removes access in that tab.
- Teacher badge and admin reports/bans work on live database.
- No secrets in repository/archive and no accidental demo admin credentials deployed.
- Database persistence confirmed after service restart.

## Official references checked on 9 November 2026

- https://render.com/docs/your-first-deploy
- https://render.com/docs/web-services
- https://www.mongodb.com/docs/atlas/tutorial/deploy-free-tier-cluster/
- https://cloudinary.com/documentation/developer_onboarding_faq_find_credentials

# Satellite Dashboard

Internal admin dashboard for points.tn and the 10 satellite content sites
(soukbladi.tn, generaldesign.tn, lequotidien.tn, snitnord.tn, webline.tn,
chedmed.tn, openmosques.tn, pcs.tn, smartimpact.tn, yatout.tn).

Lets an admin:
- See every site's daily auto-generation status (last run, success/failure)
- Review, edit, and mark-as-reviewed each auto-generated article
- Publish/unpublish satellite-site articles from their homepage/category listing
- Trigger a new article generation on demand per site

Not indexed by search engines, requires login.

## Local development

```
npm install
npm run dev
```

Requires a `.env.local` with:
```
DASHBOARD_USERNAME=admin
DASHBOARD_PASSWORD_HASH=\$2b\$10\$... (bcrypt hash — escape every $ as \$, Next.js's env loader otherwise treats $ as variable interpolation and silently truncates the value)
SESSION_SECRET=<random 32+ byte hex string>
```

## Deployment

Runs on the VPS via PM2, reverse-proxied by Nginx at `satellite.galylio.com`.
See `/home/ubuntu/satellite-dashboard/` on the VPS. Reads/writes the live
site files directly (points.tn's MDX content + the 10 static sites' HTML) —
no database, no build step for content changes.

# Database backup & disaster recovery

The Postgres database (Supabase) holds the entire system of record: bookings, payments, customer accounts, partner ownership, audit log. Losing it = losing the business. This doc is the runbook for keeping that from happening, and for what to do when it does anyway.

**Audience**: ops/admin, not customer-facing.

## What's at stake

| Data | Recovery acceptable | Notes |
|---|---|---|
| `bookings` + `payments` | < 1 hour data loss | These touch real money. Stripe is the secondary record but reconciling is painful. |
| `users` (customers) | < 24 hour | Recreate-able from email + Google OAuth, but loses preferences |
| `hotels` + `cars` + `room_types` | < 7 days | Partner can re-enter, but they'll be unhappy |
| `reviews` | < 7 days | User-generated content, irreplaceable |
| `admin_audit_log` | NEVER | Compliance — must not be lost |
| `email_campaigns` | < 7 days | History only; no business consequence to losing it |

## Layer 1 — Supabase automated backups (always on)

Supabase Pro plan and above include daily backups. **This is the baseline; verify it's enabled before launching:**

1. Go to https://supabase.com/dashboard/project/_/database/backups
2. Confirm "Daily backups" is enabled
3. Confirm "PITR (Point-in-Time Recovery)" is enabled — this is the feature that lets you restore to any point in the last 7 days, not just the last daily snapshot
4. Note the backup retention period (Pro = 7 days, Team = 14, Enterprise = 30)

**Free tier doesn't include backups.** Don't ship to production on free tier.

## Layer 2 — Weekly manual export (defense in depth)

Backups stored only in Supabase are at risk if Supabase itself has an outage that affects backup access. Once a week, export a snapshot to a separate cloud (S3 / GCS / your laptop):

```bash
# From a machine with `supabase` CLI installed
supabase db dump \
  --linked \
  --data-only=false \
  --file=backup-$(date +%Y-%m-%d).sql

# Or via direct pg_dump if you have the connection string
pg_dump "$DATABASE_URL" \
  --no-owner \
  --no-acl \
  --format=custom \
  --file="backup-$(date +%Y-%m-%d).dump"
```

Compress + encrypt + upload:

```bash
gpg --symmetric --cipher-algo AES256 backup-$(date +%Y-%m-%d).dump
aws s3 cp backup-*.dump.gpg s3://your-backup-bucket/db/
```

Or set up a GitHub Action that runs this weekly (template in `.github/workflows/backup-template.yml.example` if/when added).

## Layer 3 — Critical-table replication (optional, for high-stakes tables)

If the business gets bigger, set up logical replication of `bookings` + `payments` to a read-only replica in a different region/provider. Supabase docs cover this. Skip for MVP.

## Restore procedures

### Scenario A: someone deleted a row (oops)

Most common. Use Point-in-Time Recovery to read the row from history:

1. Open Supabase Dashboard → SQL Editor
2. Run a time-travel query against PITR:
   ```sql
   -- Restore to a specific point in the last 7 days
   SELECT * FROM bookings AS OF SYSTEM TIME '2026-04-25 10:00:00+07'
   WHERE booking_code = 'TE260425-AB12';
   ```
3. Re-insert the row manually if confirmed.

(Note: SQL syntax for PITR varies. Supabase's web console guides you through their UI.)

### Scenario B: full database loss

1. **Don't panic.** Communicate with the team first.
2. In Supabase dashboard → Database → Backups, click "Restore" on the most recent backup.
3. Follow Supabase's guided flow. The restored database comes up at a new connection string; update env vars in Vercel:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Redeploy backend + frontend (Vercel will pick up the new env vars).
5. **Verify** by hitting `/api/health` — should return `{status:'ok', mockMode:{supabase:false}}`.

### Scenario C: corruption discovered later (silent data drift)

Hardest to recover from. Restore to a point BEFORE the corruption:

1. Identify when the corruption started (check `admin_audit_log` for unusual patterns).
2. Use PITR to restore to that timestamp.
3. Manually reconcile: anything done AFTER the restore point is lost — go through `admin_audit_log` and `email_campaigns` from the period in question and replay manually if needed.

## Drill schedule

- **Monthly**: verify the most recent automated backup exists in Supabase dashboard.
- **Quarterly**: do a full restore drill into a staging project. Without this, you don't actually know the backups work.

## Encryption keys / secret rotation

If a backup is compromised, rotate:
1. Supabase service-role key
2. JWT_SECRET
3. Stripe webhook secret

See `docs/SECRET_ROTATION.md` for the full procedure.

## What this doesn't cover

- **Stripe data** — Stripe is its own system of record. They have their own retention. We don't back it up.
- **Resend / Brevo email logs** — same, they retain message logs on their end.
- **Customer-uploaded files** — none today (we don't accept file uploads from customers). If we ever do, Supabase Storage has its own backup story.
- **Vercel deployment artifacts** — git is the source of truth; Vercel is recoverable from a redeploy.

## Pre-launch checklist

- [ ] Supabase Pro plan or higher (free tier has no backups)
- [ ] Daily backups enabled in Supabase dashboard
- [ ] PITR enabled
- [ ] At least one manual export tested + uploaded to external storage
- [ ] Restore drill performed in staging
- [ ] On-call rotation knows where to find this doc

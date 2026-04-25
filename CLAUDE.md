# GitHub standards for this repo

Rules to follow on every change pushed to https://github.com/divinedavis/LogiCal.

## Public README

The README is public; treat it as marketing + feature docs, not ops docs.

- **Do** describe features, the live URL, the stack, and route paths.
- **Don't** include any of the following:
  - Server IPs (DigitalOcean droplet addresses, internal IPs, anything routable).
  - Deploy commands (`ssh`, `pm2`, `prisma db push --accept-data-loss`, `git pull` on the server, etc.).
  - Filesystem paths on the production host (`/root/LogiCal`, nginx config paths).
  - Local-dev bootstrap (`cp .env.example .env`, `npm install`, etc.). Assume the reader knows Node/Next basics or check `package.json`.
  - Any non-public infrastructure detail (database hostnames, ports, process manager names, reverse-proxy specifics).

The public domain (`slottingcal.com`) is fine to mention.

## Secrets and sensitive data

- Never commit `.env`, `.env.local`, or any file containing real credentials. `.gitignore` already covers these — keep it that way.
- The only env file allowed in git is `.env.example`, and every value in it must be a placeholder (e.g. `change-me-to-a-long-random-string`, `localhost`, etc.).
- Never hardcode IPs, hostnames, API keys, tokens, passwords, or DB connection strings in source. Read them from `process.env`.
- Before committing, scan diffs for: IP addresses, `Bearer `, `postgresql://`, `password =`, `secret =`, `.pem`/`.key`/`.p12` files. If anything matches, fix before pushing.
- If a secret slips into git, it must be rotated *and* purged from history (not just removed in a follow-up commit) — those cases are escalations to the user, not silent fixes.

## Commit hygiene

- Conventional, imperative subject lines under ~70 chars; body explains *why* when not obvious.
- Always include the `Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>` trailer on commits Claude authors.
- Never `--no-verify`, never force-push to `main`, never amend a published commit. Make a new commit instead.
- Stage specific files, not `git add -A`, when there's any chance untracked files exist that shouldn't be committed.

## Where deploy/ops info lives

Operational details (IPs, deploy steps, pm2 process names, nginx vhosts, certbot setup) live in the user's auto-memory at `~/.claude/projects/-Users-divinedavis/memory/`, not in this repo. If a deploy procedure changes, update the memory entry — don't put it in `README.md` or any other repo-tracked file.

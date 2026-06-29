# Self-hosting Security Notes

MultiProdTool is intended for private self-hosted use.

## Current security model

The server supports optional HTTP Basic Authentication:

```text
MULTIPROD_AUTH_USERNAME=admin
MULTIPROD_AUTH_PASSWORD=your-long-password
```

If these environment variables are not set, the app runs without login protection. This is acceptable only on a trusted private network or behind a VPN/authenticated tunnel.

## Do not expose directly without protection

Avoid exposing port `8787` directly to the internet unless you have added access control.

Recommended protection:

- Tailscale or ZeroTier
- Cloudflare Tunnel with Cloudflare Access
- Reverse proxy with HTTPS and auth

## Data location

Main data file:

```text
/data/multiprodtool-data.json
```

Automatic backups:

```text
/data/backups
```

The server creates an automatic backup before overwriting the main data file and keeps the most recent 30 backups.

## Backup/import risk

The in-app import feature replaces the current app data after confirmation. Only import backups you trust and keep Docker volume backups if the app contains important information.

## Update safety

Container updates are safe as long as the `/data` Docker volume is preserved. Do not delete the `multiprodtool-data` volume unless you intentionally want to remove all app data and automatic backups.

## Future recommended improvements

- Full login/session support instead of Basic Auth
- CSRF protection for non-Basic-Auth deployments
- SQLite persistence
- encrypted backups
- conflict handling for simultaneous edits from multiple devices

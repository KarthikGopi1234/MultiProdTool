# Security Audit

Date: 2026-06-29

## Scope

Reviewed the current MultiProdTool self-hosted Docker web app for privacy, external network calls, persistence behaviour, and common self-hosting risks.

Reviewed areas:

- React/Vite frontend source
- Node.js server
- Docker-oriented persistence paths
- dependency audit
- external network call search
- security headers
- request body handling
- static file serving path handling

## Result

No telemetry, analytics, third-party API calls, or intentional outbound data submission were found in the application source.

The frontend persistence layer only calls same-origin endpoints:

```text
GET /api/data
PUT /api/data
```

No uses were found for:

```text
XMLHttpRequest
WebSocket
navigator.sendBeacon
third-party analytics SDKs
remote CDN scripts
external image/font/script loading
```

`npm audit` result:

```json
{
  "info": 0,
  "low": 0,
  "moderate": 0,
  "high": 0,
  "critical": 0,
  "total": 0
}
```

## Server hardening added

The Node server now sends security headers on API and static responses:

```text
Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'
X-Content-Type-Options: nosniff
Referrer-Policy: no-referrer
Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=(), serial=()
```

Request body size is limited by:

```text
MULTIPROD_MAX_BODY_BYTES
```

Default:

```text
10 MB
```

Static file serving now performs safer path containment checks before reading from `dist`.

## Data storage

Primary data file remains:

```text
/data/multiprodtool-data.json
```

Automatic backups remain:

```text
/data/backups
```

The server creates a backup before replacing the primary JSON file and keeps the latest 30 backups.

## Important residual risks

### 1. Authentication is optional

If `MULTIPROD_AUTH_USERNAME` and `MULTIPROD_AUTH_PASSWORD` are not set, anyone who can reach the app can read and write the data.

Recommendation: enable Basic Auth or put the app behind Tailscale, Cloudflare Access, or another trusted access layer.

### 2. No per-user accounts or permissions

MultiProdTool is currently a single-user/private household app. It does not implement multi-user permissions or audit trails.

### 3. Browser extensions and reverse proxies are outside app control

The app itself does not intentionally send data externally, but browser extensions, compromised client devices, or a misconfigured proxy could still observe traffic.

### 4. Resource URLs are user-provided

The Resources module stores and opens URLs provided by the user. Opening a URL navigates to that external site in a new tab. The app does not automatically fetch those URLs server-side.

## Conclusion

For private self-hosted use on a trusted network or behind a secure access layer, the current app has no known dependency vulnerabilities and no intentional external data exfiltration paths in the source code.

Recommended production posture:

1. Enable Basic Auth or private-network access.
2. Keep the Docker volume mapped to `/data`.
3. Keep ZimaOS and Docker updated.
4. Avoid exposing the app directly to the public internet without an access layer.

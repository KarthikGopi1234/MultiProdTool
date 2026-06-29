# Deploy MultiProdTool on ZimaOS from GitHub Container Registry

This is the recommended low-maintenance deployment path for a restrictive ZimaOS server.

GitHub builds the Docker image. ZimaOS only pulls and runs it.

## Image

After GitHub Actions succeeds, the image is usually:

```text
ghcr.io/karthikgopi1234/multiprodtool:latest
```

If your repo/package path differs, copy the image path from GitHub Packages.

## Compose

```yaml
services:
  multiprodtool:
    image: ghcr.io/karthikgopi1234/multiprodtool:latest
    container_name: multiprodtool
    restart: unless-stopped
    ports:
      - "8787:8787"
    volumes:
      - multiprodtool-data:/data
    environment:
      - NODE_ENV=production
      - PORT=8787
      - MULTIPROD_DATA_DIR=/data
      # Optional but recommended beyond a trusted LAN/VPN:
      # - MULTIPROD_AUTH_USERNAME=admin
      # - MULTIPROD_AUTH_PASSWORD=change-this-password

volumes:
  multiprodtool-data:
```

Open:

```text
http://<zimaos-ip>:8787
```

## Safe updates

Use the same compose file every time.

The container can be replaced safely because data is stored in the volume:

```text
multiprodtool-data:/data
```

Safe update flow:

```text
1. Push changes to GitHub.
2. Wait for Actions to pass.
3. In ZimaOS, update/recreate the container.
```

Docker equivalent:

```text
docker compose pull
docker compose up -d
```

Do not delete the `multiprodtool-data` volume unless you want to erase all app data.

## Logo not updating

The app includes `public/icon-512.png`. If the old icon still appears after updating:

1. Pull/recreate the container.
2. Hard refresh the browser.
3. On mobile, remove and re-add the home-screen shortcut if installed as a PWA.

Static app icons are cache-busted in the HTML, but mobile browsers may cache installed PWA icons aggressively.

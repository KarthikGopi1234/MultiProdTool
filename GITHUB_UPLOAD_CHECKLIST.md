# GitHub Upload Checklist

This repository is ready for GitHub + Docker deployment.

## Critical hidden folder

GitHub Actions requires this exact hidden folder path:

```text
.github/workflows/docker-publish.yml
```

Because `.github` starts with a dot, macOS Finder may hide it. If you upload files manually through the GitHub website, make sure hidden files/folders are included.

On macOS Finder, press:

```text
Command + Shift + .
```

to show hidden files before copying/uploading.

## Recommended upload method

The safest method is Git from the project folder:

```text
git init
git add .
git commit -m "Initial self-hosted Docker deployment"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

This preserves `.github/workflows/docker-publish.yml` correctly.

## If using GitHub web upload

Upload the repository contents including:

```text
.github/workflows/docker-publish.yml
Dockerfile
docker-compose.ghcr.yml
server/server.mjs
src/renderer/main.tsx
src/renderer/styles.css
public/icon-512.png
package.json
package-lock.json
```

If the `.github` folder is missing after upload, the Actions tab will not show the Docker workflow.

## After upload

1. Go to the repository on GitHub.
2. Open the **Actions** tab.
3. Select **Publish Docker image**.
4. Click **Run workflow**.
5. After it succeeds, open **Packages** and copy the GHCR image name.

The image will usually be:

```text
ghcr.io/YOUR_USERNAME/YOUR_REPO:latest
```

Use that in ZimaOS.

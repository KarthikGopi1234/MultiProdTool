# MultiProdTool: Multi-device / GitHub-backed Direction

## User request

Explore turning MultiProdTool into an app that lives in a private GitHub repository and can be accessed from phone, laptop, and other devices.

## Recommended architecture

The current Electron app can become a shared codebase with three surfaces:

1. Desktop app: existing Electron shell.
2. Web app: same React UI deployed from the private GitHub repo.
3. Mobile access: responsive web/PWA first, then optional native wrappers later.

## Best path

Convert the project into an offline-first local-first app with sync.

### Option A: GitHub repository as source and deployment only

- Private GitHub repo stores the code.
- GitHub Actions builds the macOS DMG.
- Web version deploys to a private host such as Vercel, Netlify, Cloudflare Pages, or a private server.
- App data syncs through a real backend such as Supabase, Firebase, Appwrite, PocketBase, or a self-hosted database/API.

This is the most practical option for phone + laptop access.

### Option B: GitHub as the data backend

- Notes/tasks/habits/workouts are saved as JSON/Markdown files in a private GitHub repo.
- The app authenticates with GitHub and commits changes.

Pros:
- Data is portable and versioned.
- Private repo remains the source of truth.

Cons:
- GitHub is not designed for high-frequency app sync.
- Mobile auth and conflict resolution are more complex.
- Rate limits and merge conflicts need careful handling.

### Option C: Hybrid local-first with GitHub export

- Store app data locally in IndexedDB/SQLite.
- Sync through Supabase/Firebase/etc.
- Add GitHub export/import for notes and backups.

This is likely the best product experience.

## Suggested next implementation phase

1. Extract the React app from Electron assumptions so it can run as both web and desktop.
2. Add a persistence layer:
   - Desktop: SQLite or IndexedDB.
   - Web/PWA: IndexedDB.
3. Add authentication.
4. Add sync backend.
5. Add GitHub Actions:
   - audit
   - build web app
   - build macOS DMG on macOS runner
6. Add responsive layouts for phone.
7. Add PWA install metadata and offline support.

## Security note

For a private hosted web app, do not store GitHub personal access tokens directly in browser storage unless using a carefully scoped OAuth flow. A small backend/token broker is safer.

## Cross-platform product decision

To become truly cross-platform, MultiProdTool should move toward a shared core plus multiple shells:

- `packages/core`: data model, validation, sync logic, import/export.
- `apps/desktop`: Electron shell for macOS, Windows and Linux.
- `apps/web`: browser/PWA build for laptop and mobile browser access.
- Optional later: `apps/mobile` using React Native or Capacitor.

## Short-term cross-device storage

The desktop app now allows the user to choose a library folder on first launch. Data is saved to:

`<chosen-folder>/multiprodtool-data.json`

Users can choose iCloud Drive, Dropbox, Google Drive, OneDrive, Syncthing, or a Git-backed folder to sync the data file across machines. This gives a simple cross-device bridge while a proper backend sync layer is designed.

## Recommended next cross-platform step

Add a web/PWA target and a cloud sync backend. The selected-library file approach is useful for desktop and personal sync folders, but phone access is best served by either:

1. PWA + Supabase/Firebase/Appwrite/PocketBase sync.
2. PWA + GitHub OAuth + private repo file storage, if versioned plain-file storage is more important than real-time sync.

# Functions - Local Emulator Testing

This document explains how to run the Functions + Firestore + Storage emulators and test the HTTP endpoints locally from `localhost`.

Prerequisites
- Node.js 20 (as configured in `package.json`)
- Firebase CLI (with emulators): `npm install -g firebase-tools`
- `npm install` inside `functions/`

Start the emulators (recommended - builds before starting):

```powershell
cd functions; npm install; npm run emulators:start
```

If you prefer to run the emulator without building TypeScript (use only JS compiled output if present):

```powershell
cd functions; npm run emulators:start:no-build
```

Environment variables
- To allow CORS from your frontend origin during development, you can set `ALLOWED_ORIGINS`. Example:

```powershell
# allow localhost:4200
$env:ALLOWED_ORIGINS = 'http://localhost:4200'
# optionally allow credentials
$env:ALLOW_CREDENTIALS = '1'
npm run emulators:start
```

How to call endpoints
- The Functions emulator for HTTPS functions listens on port `5001` by default (see `firebase.json`).
- Example base URL (project-specific): `http://localhost:5001/<project-id>/europe-west1/v2`

To find your exact base URL, when the emulator starts it prints the functions host and project id. For convenience, the Firebase CLI offers a short alias when using `firebase emulators:start`.

Common example requests (replace `<PROJECT_ID>` and port if different):

Channels list

```powershell
curl "http://localhost:5001/<PROJECT_ID>/europe-west1/v2/channels"
```

Channel by id

```powershell
curl "http://localhost:5001/<PROJECT_ID>/europe-west1/v2/channels/CHANNEL_ID"
```

Programs by date

```powershell
curl "http://localhost:5001/<PROJECT_ID>/europe-west1/v2/programs/date/today?limit=50"
```

Health check

```powershell
curl "http://localhost:5001/<PROJECT_ID>/europe-west1/v2/health"
```

Notes
- The `cors` middleware defaults to allowing non-browser clients (curl/Postman). If you run into CORS errors from the browser, set `ALLOWED_ORIGINS` to include your origin.
- The README adds a small in-memory cache to speed up repeated GET requests in development; this is only enabled in the local code and uses short TTLs.
- `firebase.json` has been adjusted so emulators bind to `0.0.0.0` which allows connection from other devices on the local network; for stricter security revert those fields.

If you'd like, I can also add Postman collections or example Node fetch scripts to hit these endpoints.

Postman collection & Node examples
- Postman collection: `functions/postman_collection.json`. Import it into Postman and set the `projectId` variable to your emulator project id (shown when starting emulators).
- Node examples: `functions/examples/request_examples.js` (requires `axios`). Run:

```powershell
cd functions
npm install axios
node examples/request_examples.js <PROJECT_ID>
```

Postman environment
- There's also `functions/postman_environment.json` you can import as an environment in Postman. Replace `<PROJECT_ID>` with the project id the emulator prints when it starts and set `authToken` if needed.

Dependency upgrade note
- The functions project was upgraded to use `node: 22` in `package.json`. Also consider upgrading `firebase-functions` to the latest version:

```powershell
cd functions
npm install --save firebase-functions@latest
```

Be aware: `firebase-functions` major upgrades can include breaking changes. Review the official changelog before upgrading in production:
https://github.com/firebase/firebase-functions/releases

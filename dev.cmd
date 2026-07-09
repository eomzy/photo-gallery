@echo off
set PATH=%PATH%;C:\Program Files\nodejs
rem Clear any ambient PORT (e.g. injected by the preview harness for its
rem own single-server assumption) so the API server falls back to 3001
rem instead of colliding with the client dev server on 5173.
set PORT=
npm run dev

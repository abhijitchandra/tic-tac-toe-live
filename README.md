# Tic-Tac-Toe LIVE 📝⭕

Real-time, two-player tic-tac-toe you can host **entirely for free**. No backend server, no database — two browsers connect directly to each other over WebRTC.

![CI](https://github.com/abhijitchandra/tic-tac-toe-live/actions/workflows/ci.yml/badge.svg)
![Deploy](https://github.com/abhijitchandra/tic-tac-toe-live/actions/workflows/deploy.yml/badge.svg)
![License](https://img.shields.io/badge/license-MIT-blue.svg)

**Live demo:** `https://abhijitchandra.github.io/tic-tac-toe-live/`

## Features

- Real-time sync between two players via peer-to-peer WebRTC (no server round-trip)
- Hand-drawn, animated board — grid and marks sketch themselves in
- Room codes instead of accounts — one person creates a room, shares a 5-letter code
- Zero infrastructure cost: hosted free on GitHub Pages, connected free via PeerJS's public broker
- Fully tested game logic, linted code, CI on every push, auto-deploy on merge to `main`

## Project structure

```
tic-tac-toe-live/
├── index.html              # entry point
├── src/
│   ├── css/styles.css      # all styling
│   └── js/
│       ├── gameLogic.js    # pure functions — win detection, board state (unit tested)
│       ├── network.js      # PeerJS connection handling
│       └── app.js          # DOM wiring / UI
├── tests/
│   └── gameLogic.test.js   # Vitest unit tests
└── .github/workflows/      # CI + auto-deploy to GitHub Pages
```

## Running locally

```bash
npm install
npm run serve   # opens a local static server
```

Open the printed local URL in two browser tabs (or two devices) to test a match against yourself.

## Testing & linting

```bash
npm test        # run unit tests once
npm run test:watch
npm run lint
npm run format
```

## Deployment

Deployment is automatic: every push to `main` that passes CI (lint + tests) is published to GitHub Pages via `.github/workflows/deploy.yml`. No manual build step, no paid hosting.

To enable it on your own fork:
1. Push this repo to GitHub.
2. Go to **Settings → Pages** and set Source to **GitHub Actions**.
3. Push to `main` — the site deploys automatically within a minute or two.

## How the multiplayer works

There's no game server. The player who clicks **Start a new page** becomes a WebRTC "host" identified by a short room code; PeerJS's free public signaling server helps the second browser find and connect to it. Once connected, moves are sent directly between the two browsers as JSON messages — see `src/js/network.js` and the `send()` / `handleData()` functions in `src/js/app.js`.

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md). Please follow the [Code of Conduct](./CODE_OF_CONDUCT.md).

## Roadmap ideas

- [ ] Spectator mode for a 3rd+ viewer
- [ ] Match history / rematch score tracker
- [ ] Sound effects (respecting reduced-motion / mute preference)
- [ ] Mobile PWA install support

## License

MIT — see [LICENSE](./LICENSE).

// Thin wrapper around PeerJS so app.js doesn't touch the Peer API directly.
const PREFIX = 'tictactoe-live-';

// Free public STUN + TURN servers (Open Relay Project). TURN is required
// as a relay fallback for players on restrictive networks (corporate wifi,
// some mobile carriers, symmetric NAT) where direct P2P can't be established.
const ICE_CONFIG = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:openrelay.metered.ca:80' },
    { urls: 'turn:openrelay.metered.ca:80', username: 'openrelayproject', credential: 'openrelayproject' },
    { urls: 'turn:openrelay.metered.ca:443', username: 'openrelayproject', credential: 'openrelayproject' },
    { urls: 'turn:openrelay.metered.ca:443?transport=tcp', username: 'openrelayproject', credential: 'openrelayproject' },
  ],
};

export function createRoom({ onOpen, onConnection, onError }) {
  function tryCreate(code) {
    const id = PREFIX + code.toLowerCase();
    const peer = new Peer(id, { config: ICE_CONFIG });
    peer.on('open', () => onOpen(peer, code));
    peer.on('connection', (conn) => onConnection(conn));
    peer.on('error', (err) => {
      if (err.type === 'unavailable-id') {
        tryCreate(codeGenerator());
      } else {
        onError(err);
      }
    });
    return peer;
  }
  function codeGenerator() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let s = '';
    for (let i = 0; i < 5; i++) s += chars[Math.floor(Math.random() * chars.length)];
    return s;
  }
  return tryCreate(codeGenerator());
}

export function joinRoom(code, { onConnected, onFail }) {
  const peer = new Peer(undefined, { config: ICE_CONFIG });
  peer.on('open', () => {
    const target = PREFIX + code.toLowerCase();
    const conn = peer.connect(target, { reliable: true });
    let settled = false;
    const timeout = setTimeout(() => {
      if (!settled) {
        onFail('timeout');
        peer.destroy();
      }
    }, 9000);
    conn.on('open', () => {
      settled = true;
      clearTimeout(timeout);
      onConnected(peer, conn);
    });
    conn.on('error', () => {
      settled = true;
      clearTimeout(timeout);
      onFail('conn-error');
    });
  });
  peer.on('error', (err) => onFail(err.type));
  return peer;
}
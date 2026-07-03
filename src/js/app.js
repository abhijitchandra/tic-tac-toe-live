import { CENTER, checkWin, freshState } from './gameLogic.js';
import { createRoom, joinRoom } from './network.js';

const $ = (id) => document.getElementById(id);
const lobby = $('lobby'), game = $('game');
const cellsEl = $('cells'), winLineEl = $('winLine'), confettiEl = $('confetti');
const statusLine = $('statusLine'), roomTagText = $('roomTagText'), youTag = $('youTag');
const syncMsg = $('syncMsg'), liveBadge = $('liveBadge');

let peer = null, conn = null, isHost = false, myMark = null, roomCode = null;
let board = Array(9).fill(null), turn = 'X', winner = null, line = null;
let prevBoard = Array(9).fill(null), winShown = false, opponentConnected = false;

function xPath(anim) { return `<path class="mark-path mark-x ${anim ? 'draw-anim' : ''}" d="M20,20 L80,80 M80,20 L20,80"/>`; }
function oPath(anim) { return `<path class="mark-path mark-o ${anim ? 'draw-anim' : ''}" d="M50,15 a35,35 0 1,1 -0.1,0 z"/>`; }
function ghostSVG() { return `<svg class="ghost" viewBox="0 0 100 100">${xPath(false)}</svg>`; }

function buildCells() {
  cellsEl.innerHTML = '';
  for (let i = 0; i < 9; i++) {
    const c = document.createElement('div');
    c.className = 'cell';
    c.dataset.i = i;
    c.innerHTML = ghostSVG();
    c.addEventListener('click', onCellClick);
    cellsEl.appendChild(c);
  }
}

function renderBoard(animate) {
  const cells = cellsEl.children;
  for (let i = 0; i < 9; i++) {
    const val = board[i], prevVal = prevBoard[i], cellEl = cells[i];
    const changed = animate && val && !prevVal;
    if (val === 'X') cellEl.innerHTML = `<svg viewBox="0 0 100 100">${xPath(changed)}</svg>`;
    else if (val === 'O') cellEl.innerHTML = `<svg viewBox="0 0 100 100">${oPath(changed)}</svg>`;
    else cellEl.innerHTML = ghostSVG();
    cellEl.classList.toggle('disabled', !!val || !!winner || !myMark || !opponentConnected);
  }
  prevBoard = board.slice();
}

function renderWinLine() {
  winLineEl.innerHTML = '';
  if (line) {
    const [a, , c] = line, [x1, y1] = CENTER[a], [x2, y2] = CENTER[c];
    const dx = (x2 - x1) * 0.22, dy = (y2 - y1) * 0.22;
    winLineEl.innerHTML = `<path class="win-stroke" d="M ${x1 - dx} ${y1 - dy} L ${x2 + dx} ${y2 + dy}"/>`;
  }
}

function burstConfetti() {
  const colors = ['#B8892B', '#C4472B', '#1B2A4A', '#3f9142'];
  let html = '';
  for (let i = 0; i < 26; i++) {
    const x = Math.random() * 300, delay = Math.random() * 0.3, dur = 1.1 + Math.random() * 0.6;
    const color = colors[Math.floor(Math.random() * colors.length)];
    html += `<span style="left:${x}px; background:${color}; animation-duration:${dur}s; animation-delay:${delay}s;"></span>`;
  }
  confettiEl.innerHTML = html;
}

function statusHTML(text) { return `<span class="pencil">✎</span> ${text}`; }

function updateStatus() {
  if (!opponentConnected) {
    statusLine.innerHTML = statusHTML(isHost ? 'Waiting for a second player to join…' : 'Connecting to your opponent…');
  } else if (winner === 'draw') {
    statusLine.innerHTML = statusHTML("It's a draw — everyone's out of moves.");
  } else if (winner) {
    const iWon = winner === myMark;
    statusLine.innerHTML = statusHTML(iWon ? 'You win! Nicely drawn.' : `${winner} wins this round.`);
  } else if (turn === myMark) {
    statusLine.innerHTML = statusHTML('Your turn — go ahead.');
  } else {
    statusLine.innerHTML = statusHTML(`Waiting on ${turn}…`);
  }
  youTag.textContent = myMark ? `you are ${myMark}` : '';
}

function applyState(animate) {
  renderBoard(animate);
  updateStatus();
  if (winner && winner !== 'draw' && !winShown) {
    renderWinLine(); burstConfetti(); winShown = true;
  } else if (!winner) {
    winShown = false; winLineEl.innerHTML = ''; confettiEl.innerHTML = '';
  } else if (winner === 'draw') {
    winLineEl.innerHTML = '';
  }
}

function send(msg) { if (conn && conn.open) conn.send(msg); }

function onCellClick(e) {
  const i = Number(e.currentTarget.dataset.i);
  if (!opponentConnected || winner || !myMark || turn !== myMark || board[i]) return;
  board[i] = myMark;
  const result = checkWin(board);
  turn = myMark === 'X' ? 'O' : 'X';
  winner = result ? result.winner : null;
  line = result ? result.line : null;
  applyState(true);
  send({ type: 'move', index: i, mark: myMark, turn, winner, line });
}

function handleData(msg) {
  if (msg.type === 'move') {
    board[msg.index] = msg.mark;
    turn = msg.turn; winner = msg.winner; line = msg.line;
    applyState(true);
  } else if (msg.type === 'sync') {
    board = msg.board.slice(); turn = msg.turn; winner = msg.winner; line = msg.line;
    prevBoard = Array(9).fill(null);
    applyState(false);
  } else if (msg.type === 'reset') {
    board = msg.board.slice(); turn = msg.turn; winner = null; line = null;
    prevBoard = Array(9).fill(null); winShown = false;
    applyState(false);
  }
}

function setupConnection(c) {
  conn = c;
  const handleOpen = () => {
    opponentConnected = true;
    liveBadge.className = 'badge live';
    syncMsg.textContent = 'connected — moves sync instantly';
    if (isHost) send({ type: 'sync', board, turn, winner, line });
    applyState(false);
  };
  // The joiner reaches this function *after* their connection's 'open'
  // event already fired once (that's what triggered showing the game
  // screen in the first place) — so a second 'open' listener would never
  // fire. Handle the already-open case directly instead of re-listening.
  if (conn.open) {
    handleOpen();
  } else {
    conn.on('open', handleOpen);
  }
  conn.on('data', handleData);
  conn.on('close', () => {
    opponentConnected = false;
    liveBadge.className = 'badge err';
    syncMsg.textContent = 'opponent disconnected';
    applyState(false);
  });
  conn.on('error', () => {
    liveBadge.className = 'badge err';
    syncMsg.textContent = 'connection error';
  });
}

function showGame(code) {
  roomCode = code;
  roomTagText.textContent = code;
  lobby.style.display = 'none';
  game.style.display = 'block';
  buildCells();
}

$('createBtn').addEventListener('click', () => {
  $('lobbyMsg').textContent = '';
  createRoom({
    onOpen: (p, code) => {
      peer = p; isHost = true; myMark = 'X';
      showGame(code);
      liveBadge.className = 'badge';
      syncMsg.textContent = 'room ready — share the code';
      applyState(false);
    },
    onConnection: (c) => setupConnection(c),
    onError: (err) => { $('lobbyMsg').textContent = `Could not create a room (${err.type}). Try again.`; },
  });
});

$('joinBtn').addEventListener('click', () => {
  const code = $('joinCode').value.trim().toUpperCase();
  if (!code) { $('lobbyMsg').textContent = 'Type a room code first.'; return; }
  $('lobbyMsg').textContent = 'Connecting…';
  peer = joinRoom(code, {
    onConnected: (p, c) => {
      isHost = false; myMark = 'O';
      showGame(code);
      setupConnection(c);
    },
    onFail: () => {
      const msg = `Couldn't reach room "${code}". Check the code and try again.`;
      if (game.style.display === 'block') {
        liveBadge.className = 'badge err';
        syncMsg.textContent = msg;
      } else {
        $('lobbyMsg').textContent = msg;
      }
    },
  });
});

$('joinCode').addEventListener('keydown', (e) => { if (e.key === 'Enter') $('joinBtn').click(); });

roomTagText.addEventListener('click', () => {
  if (roomCode) {
    navigator.clipboard && navigator.clipboard.writeText(roomCode).catch(() => {});
    syncMsg.textContent = 'room code copied';
  }
});

$('newGameBtn').addEventListener('click', () => {
  if (!opponentConnected) return;
  const s = freshState();
  s.turn = winner && winner !== 'draw' ? (winner === 'X' ? 'O' : 'X') : 'X';
  board = s.board; turn = s.turn; winner = null; line = null;
  prevBoard = Array(9).fill(null); winShown = false;
  applyState(false);
  send({ type: 'reset', board, turn });
});

$('leaveBtn').addEventListener('click', () => {
  if (conn) try { conn.close(); } catch { /* already closed */ }
  if (peer) try { peer.destroy(); } catch { /* already destroyed */ }
  peer = null; conn = null; myMark = null; opponentConnected = false;
  game.style.display = 'none';
  lobby.style.display = 'block';
  $('joinCode').value = ''; $('lobbyMsg').textContent = '';
});
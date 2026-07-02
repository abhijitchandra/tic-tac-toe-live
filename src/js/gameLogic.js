// Pure game logic — no DOM, no networking. Easy to unit test.

export const LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
];

export const CENTER = [
  [50, 50], [150, 50], [250, 50],
  [50, 150], [150, 150], [250, 150],
  [50, 250], [150, 250], [250, 250],
];

export function freshState() {
  return { board: Array(9).fill(null), turn: 'X', winner: null, line: null };
}

/**
 * Checks a board for a winner or draw.
 * @param {(string|null)[]} board - length-9 array of 'X' | 'O' | null
 * @returns {{winner: string, line: number[]|null} | null}
 */
export function checkWin(board) {
  for (const line of LINES) {
    const [a, b, c] = line;
    if (board[a] && board[a] === board[b] && board[b] === board[c]) {
      return { winner: board[a], line };
    }
  }
  if (board.every((v) => v)) return { winner: 'draw', line: null };
  return null;
}

export function randCode(length = 5) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let s = '';
  for (let i = 0; i < length; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

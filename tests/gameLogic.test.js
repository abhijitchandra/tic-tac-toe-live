import { describe, it, expect } from 'vitest';
import { checkWin, freshState, LINES } from '../src/js/gameLogic.js';

describe('checkWin', () => {
  it('returns null on an empty board', () => {
    expect(checkWin(Array(9).fill(null))).toBeNull();
  });

  it('detects a row win', () => {
    const b = ['X', 'X', 'X', null, null, null, null, null, null];
    expect(checkWin(b)).toEqual({ winner: 'X', line: [0, 1, 2] });
  });

  it('detects a column win', () => {
    const b = ['O', null, null, 'O', null, null, 'O', null, null];
    expect(checkWin(b)).toEqual({ winner: 'O', line: [0, 3, 6] });
  });

  it('detects a diagonal win', () => {
    const b = ['X', null, null, null, 'X', null, null, null, 'X'];
    expect(checkWin(b)).toEqual({ winner: 'X', line: [0, 4, 8] });
  });

  it('detects a draw', () => {
    const b = ['X', 'O', 'X', 'X', 'O', 'O', 'O', 'X', 'X'];
    expect(checkWin(b)).toEqual({ winner: 'draw', line: null });
  });

  it('returns null for an unfinished game', () => {
    const b = ['X', 'O', null, null, null, null, null, null, null];
    expect(checkWin(b)).toBeNull();
  });
});

describe('freshState', () => {
  it('returns an empty board with X starting', () => {
    const s = freshState();
    expect(s.board).toEqual(Array(9).fill(null));
    expect(s.turn).toBe('X');
    expect(s.winner).toBeNull();
  });
});

describe('LINES', () => {
  it('has 8 winning combinations', () => {
    expect(LINES.length).toBe(8);
  });
});

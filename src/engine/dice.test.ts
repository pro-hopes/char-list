import { describe, expect, it } from 'vitest';
import { parseRollFormula } from './dice';

describe('parseRollFormula', () => {
  it('один кубик', () => {
    expect(parseRollFormula('2к8')).toEqual({ flat: 0, diceParts: ['2к8'] });
  });

  it('кубики и модификатор с пробелами', () => {
    expect(parseRollFormula('1к8 + 1к6 + 3')).toEqual({ flat: 3, diceParts: ['1к8', '1к6'] });
  });

  it('латинская d и заглавная К приводятся к «к»', () => {
    expect(parseRollFormula('2d8+1')).toEqual({ flat: 1, diceParts: ['2к8'] });
    expect(parseRollFormula('3К6')).toEqual({ flat: 0, diceParts: ['3к6'] });
  });

  it('текст без кубиков не бросается', () => {
    expect(parseRollFormula('половина урона')).toBeNull();
    expect(parseRollFormula('5')).toBeNull();
    expect(parseRollFormula('')).toBeNull();
    expect(parseRollFormula('0к6')).toBeNull();
  });
});

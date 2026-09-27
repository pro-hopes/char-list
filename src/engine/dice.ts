export interface DiceTerm {
  count: number;
  sides: number;
}

const DICE_NOTATION_RE = /^(\d+)к(\d+)$/;

export function isValidDiceNotation(notation: string): boolean {
  return DICE_NOTATION_RE.test(notation.trim());
}

export function parseDiceNotation(notation: string): DiceTerm {
  const match = DICE_NOTATION_RE.exec(notation.trim());
  if (!match) {
    throw new Error(`Некорректная нотация кубика: "${notation}" (ожидается формат "1к4")`);
  }
  const count = Number(match[1]);
  const sides = Number(match[2]);
  if (count <= 0 || sides <= 0) {
    throw new Error(`Некорректная нотация кубика: "${notation}"`);
  }
  return { count, sides };
}

export function rollDiceTerm(term: DiceTerm, rng: () => number = Math.random): number[] {
  const values: number[] = [];
  for (let i = 0; i < term.count; i++) {
    values.push(Math.floor(rng() * term.sides) + 1);
  }
  return values;
}

export interface DiceFormulaRollResult {
  perTerm: Array<{ notation: string; values: number[]; sum: number }>;
  total: number;
}

export function rollDiceFormula(notations: string[], rng: () => number = Math.random): DiceFormulaRollResult {
  const perTerm = notations.map((notation) => {
    const values = rollDiceTerm(parseDiceNotation(notation), rng);
    return { notation, values, sum: values.reduce((a, b) => a + b, 0) };
  });
  const total = perTerm.reduce((sum, term) => sum + term.sum, 0);
  return { perTerm, total };
}

export interface StatFieldRollSummary {
  grandTotal: number;
  summaryText: string;
}

/**
 * Бросок по diceParts посчитанного поля + добавление его flatTotal.
 * Результат — чисто эфемерное представление, не пишется в state.
 */
export function rollStatFieldDice(
  flatTotal: number,
  diceParts: string[],
  rng: () => number = Math.random,
): StatFieldRollSummary {
  if (diceParts.length === 0) {
    return { grandTotal: flatTotal, summaryText: `${flatTotal}` };
  }
  const { perTerm, total } = rollDiceFormula(diceParts, rng);
  const rollsText = perTerm
    .map((term) => `${term.notation} → ${term.values.join('+')}`)
    .join(', ');
  const grandTotal = flatTotal + total;
  const summaryText = `${flatTotal} + (${rollsText}) = ${grandTotal}`;
  return { grandTotal, summaryText };
}

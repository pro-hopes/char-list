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

/** "0к6" и "2к0" проходят регулярку, но бросить их нельзя. */
function isRollableDice(notation: string): boolean {
  if (!isValidDiceNotation(notation)) return false;
  try {
    parseDiceNotation(notation);
    return true;
  } catch {
    return false;
  }
}

/**
 * Разбирает свободно введённую формулу вида "2к8", "1к4 + 3", "1к8+1к6+2".
 * Возвращает null, если формула не распознана — тогда её просто показываем текстом без броска.
 */
export function parseRollFormula(formula: string): { flat: number; diceParts: string[] } | null {
  const terms = formula
    .replace(/\s+/g, '')
    // "2d8" латиницей, "2Д8" и "2К8" — частые варианты записи
    .replace(/[dDдДК]/g, 'к')
    .split('+')
    .filter((term) => term.length > 0);
  if (terms.length === 0) return null;

  let flat = 0;
  const diceParts: string[] = [];
  for (const term of terms) {
    if (/^\d+$/.test(term)) flat += Number(term);
    else if (isRollableDice(term)) diceParts.push(term);
    else return null;
  }
  return diceParts.length > 0 ? { flat, diceParts } : null;
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

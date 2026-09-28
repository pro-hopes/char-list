import type { ChangeEvent } from 'react';

/**
 * Убирает начальные нули из значения number-инпута ("0" + напечатанная "1" даёт "01").
 * React использует нестрогое сравнение (node.value != value) при синхронизации DOM для
 * type="number", поэтому "01" не перерисовывается в "1" сам по себе — правим DOM-значение
 * вручную в момент события, до того как React решит, что перерисовывать не нужно.
 */
export function sanitizeNumberInputEvent(e: ChangeEvent<HTMLInputElement>): string {
  const raw = e.target.value;
  const cleaned = raw.replace(/^(-?)0+(?=\d)/, '$1');
  if (cleaned !== raw) e.target.value = cleaned;
  return cleaned;
}

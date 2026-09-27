import { useCallback, useState } from 'react';
import { rollStatFieldDice } from '../engine/dice';

export function useDiceRoll() {
  const [lastRoll, setLastRoll] = useState<string | null>(null);

  const roll = useCallback((flatTotal: number, diceParts: string[]) => {
    const result = rollStatFieldDice(flatTotal, diceParts);
    setLastRoll(`Бросок: ${result.summaryText}`);
    return result;
  }, []);

  const clear = useCallback(() => setLastRoll(null), []);

  return { lastRoll, roll, clear };
}

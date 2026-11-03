import { createContext, useContext } from 'react';
import type { BeastFormView } from '../../engine/beastForm';

/**
 * Активный облик для read-view секций листа. Окна редактирования рендерятся вне провайдера —
 * там всегда видны и правятся собственные значения персонажа.
 */
export const BeastFormContext = createContext<BeastFormView | null>(null);

export function useIsFromBeastForm(fieldId: string): boolean {
  return useContext(BeastFormContext)?.overriddenFieldIds.has(fieldId) ?? false;
}

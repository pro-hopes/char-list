import type { Character } from './character';

export type PendingImportSource = 'link' | 'clipboard';

export interface PendingImport {
  source: PendingImportSource;
  character: Character;
  /** id существующего персонажа с совпадающим именем, если есть конфликт. */
  conflictId?: string;
}

export interface ToastState {
  id: number;
  message: string;
  tone: 'info' | 'error';
}

export interface UiState {
  asideOpen: boolean;
  collapsedSections: Record<string, boolean>;
  pendingImport: PendingImport | null;
  toast: ToastState | null;
}

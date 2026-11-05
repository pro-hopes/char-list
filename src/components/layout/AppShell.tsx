'use client';

import { useEffect } from 'react';
import { useCharacterStore } from '../../store/characterStore';
import { ImportPreviewModal } from '../common/ImportPreviewModal';
import { ToastHost } from '../common/ToastHost';
import { CharacterListScreen } from './CharacterListScreen';
import { CharacterSheetScreen } from './CharacterSheetScreen';

export function AppShell() {
  const hydrated = useCharacterStore((s) => s.hydrated);
  const loadError = useCharacterStore((s) => s.loadError);
  const hydrate = useCharacterStore((s) => s.hydrate);
  const activeCharacterId = useCharacterStore((s) => s.activeCharacterId);
  const activeCharacter = useCharacterStore((s) => (activeCharacterId ? s.characters[activeCharacterId] : undefined));

  useEffect(() => {
    void hydrate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loadError) {
    return (
      <div style={{ maxWidth: 420, margin: '0 auto', padding: '48px 16px', textAlign: 'center' }}>
        <p style={{ marginBottom: 16, color: 'var(--text-secondary)' }}>{loadError}</p>
        <button type="button" className="accentButton" onClick={() => void hydrate()}>
          Повторить
        </button>
      </div>
    );
  }

  if (!hydrated) return null;

  return (
    <>
      {activeCharacter ? <CharacterSheetScreen character={activeCharacter} /> : <CharacterListScreen />}
      <ImportPreviewModal />
      <ToastHost />
    </>
  );
}

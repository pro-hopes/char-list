import { useEffect } from 'react';
import { useCharacterStore } from '../../store/characterStore';
import { ImportPreviewModal } from '../common/ImportPreviewModal';
import { ToastHost } from '../common/ToastHost';
import { CharacterListScreen } from './CharacterListScreen';
import { CharacterSheetScreen } from './CharacterSheetScreen';

export function AppShell() {
  const hydrated = useCharacterStore((s) => s.hydrated);
  const hydrate = useCharacterStore((s) => s.hydrate);
  const activeCharacterId = useCharacterStore((s) => s.activeCharacterId);
  const activeCharacter = useCharacterStore((s) => (activeCharacterId ? s.characters[activeCharacterId] : undefined));

  useEffect(() => {
    hydrate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!hydrated) return null;

  return (
    <>
      {activeCharacter ? <CharacterSheetScreen character={activeCharacter} /> : <CharacterListScreen />}
      <ImportPreviewModal />
      <ToastHost />
    </>
  );
}

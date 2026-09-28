import { useState } from 'react';
import { FIELD_INFO } from '../../engine/fieldInfo';
import { InfoButton } from './InfoButton';
import { InfoModal } from './InfoModal';

/** Кнопка "i" для заголовка секции — без breakdown, чисто справочный текст. */
export function SectionInfoButton({ infoKey }: { infoKey: string }) {
  const [open, setOpen] = useState(false);
  const info = FIELD_INFO[infoKey];
  if (!info) return null;

  return (
    <>
      <InfoButton onClick={() => setOpen(true)} title={`О разделе «${info.title}»`} />
      {open && (
        <InfoModal
          title={info.title}
          description={info.description}
          affects={info.affects}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}

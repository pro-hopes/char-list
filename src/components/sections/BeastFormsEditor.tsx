import { Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useCharacterStore } from '../../store/characterStore';
import { ABILITY_LABELS, BEAST_ABILITY_KEYS, type BeastForm, type Character } from '../../types/character';
import { IconButton } from '../common/IconButton';
import { IconPickerModal } from '../common/IconPickerModal';
import { NumberInput } from '../common/NumberInput';
import listStyles from './EditableList.module.css';
import styles from './BeastFormsEditor.module.css';

function NumberField({ label, value, min, onChange }: { label: string; value: number; min?: number; onChange: (value: number) => void }) {
  return (
    <label className={styles.numberField}>
      <span>{label}</span>
      <NumberInput min={min} value={value} onChange={onChange} />
    </label>
  );
}

function BeastFormCard({ character, form }: { character: Character; form: BeastForm }) {
  const updateBeastForm = useCharacterStore((s) => s.updateBeastForm);
  const updateBeastFormAbility = useCharacterStore((s) => s.updateBeastFormAbility);
  const removeBeastForm = useCharacterStore((s) => s.removeBeastForm);
  const addBeastFormSkill = useCharacterStore((s) => s.addBeastFormSkill);
  const updateBeastFormSkill = useCharacterStore((s) => s.updateBeastFormSkill);
  const removeBeastFormSkill = useCharacterStore((s) => s.removeBeastFormSkill);
  const addBeastFormAttack = useCharacterStore((s) => s.addBeastFormAttack);
  const updateBeastFormAttack = useCharacterStore((s) => s.updateBeastFormAttack);
  const removeBeastFormAttack = useCharacterStore((s) => s.removeBeastFormAttack);
  const [iconPickerOpen, setIconPickerOpen] = useState(false);

  const update = (patch: Parameters<typeof updateBeastForm>[2]) => updateBeastForm(character.id, form.id, patch);
  const usedSkillIds = new Set(form.skills.map((s) => s.skillId));
  const firstFreeSkill = character.skills.find((s) => !usedSkillIds.has(s.id));

  return (
    <div className={listStyles.item}>
      <div className={listStyles.itemHead}>
        <IconButton icon={form.icon} onClick={() => setIconPickerOpen(true)} />
        <input className={listStyles.nameField} value={form.name} onChange={(e) => update({ name: e.target.value })} />
        <button
          type="button"
          className={listStyles.removeButton}
          onClick={() => removeBeastForm(character.id, form.id)}
          title="Удалить облик"
        >
          <Trash2 size={14} />
        </button>
      </div>

      <div className={styles.statsGrid}>
        {BEAST_ABILITY_KEYS.map((key) => (
          <NumberField
            key={key}
            label={ABILITY_LABELS[key]}
            value={form.abilities[key]}
            onChange={(v) => updateBeastFormAbility(character.id, form.id, key, v)}
          />
        ))}
        <NumberField label="КД" value={form.ac} onChange={(v) => update({ ac: v })} />
        <NumberField label="Скорость" value={form.speed} onChange={(v) => update({ speed: v })} />
        <NumberField label="Хиты (макс.)" value={form.hpMax} min={1} onChange={(v) => update({ hpMax: v })} />
      </div>

      <h5 className={styles.subtitle}>Навыки зверя</h5>
      <p className={styles.hint}>Укажите итоговый бонус из статблока. Если он выше вашего — в облике возьмётся он.</p>
      {form.skills.map((beastSkill) => (
        <div key={beastSkill.skillId} className={styles.row}>
          <select
            value={beastSkill.skillId}
            onChange={(e) => updateBeastFormSkill(character.id, form.id, beastSkill.skillId, { skillId: e.target.value })}
          >
            {character.skills
              .filter((s) => s.id === beastSkill.skillId || !usedSkillIds.has(s.id))
              .map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
          </select>
          <NumberInput
            className={styles.smallInput}
            value={beastSkill.value}
            onChange={(v) => updateBeastFormSkill(character.id, form.id, beastSkill.skillId, { value: v })}
          />
          <button
            type="button"
            className={listStyles.removeButton}
            onClick={() => removeBeastFormSkill(character.id, form.id, beastSkill.skillId)}
            title="Удалить навык"
          >
            <Trash2 size={14} />
          </button>
        </div>
      ))}
      {firstFreeSkill && (
        <button type="button" className={styles.linkButton} onClick={() => addBeastFormSkill(character.id, form.id, firstFreeSkill.id)}>
          + Добавить навык
        </button>
      )}

      <h5 className={styles.subtitle}>Атаки</h5>
      {form.attacks.map((attack) => (
        <div key={attack.id} className={styles.attack}>
          <div className={styles.row}>
            <input
              className={styles.grow}
              placeholder="Название"
              value={attack.name}
              onChange={(e) => updateBeastFormAttack(character.id, form.id, attack.id, { name: e.target.value })}
            />
            <button
              type="button"
              className={listStyles.removeButton}
              onClick={() => removeBeastFormAttack(character.id, form.id, attack.id)}
              title="Удалить атаку"
            >
              <Trash2 size={14} />
            </button>
          </div>
          <div className={styles.row}>
            <NumberField
              label="Попадание"
              value={attack.attackBonus.baseValue}
              onChange={(v) => updateBeastFormAttack(character.id, form.id, attack.id, { attackBonus: v })}
            />
            <label className={styles.numberField}>
              <span>Кубики</span>
              <input
                value={attack.damageDice}
                onChange={(e) => updateBeastFormAttack(character.id, form.id, attack.id, { damageDice: e.target.value })}
              />
            </label>
            <NumberField
              label="+ к урону"
              value={attack.damageBonus.baseValue}
              onChange={(v) => updateBeastFormAttack(character.id, form.id, attack.id, { damageBonus: v })}
            />
            <label className={`${styles.numberField} ${styles.grow}`}>
              <span>Тип урона</span>
              <input
                value={attack.damageType}
                onChange={(e) => updateBeastFormAttack(character.id, form.id, attack.id, { damageType: e.target.value })}
              />
            </label>
          </div>
          <input
            className={styles.fullWidth}
            placeholder="Заметки (напр. «цель должна пройти спасбросок СИЛ Сл 11, иначе сбита с ног»)"
            value={attack.notes ?? ''}
            onChange={(e) => updateBeastFormAttack(character.id, form.id, attack.id, { notes: e.target.value })}
          />
        </div>
      ))}
      <button type="button" className={styles.linkButton} onClick={() => addBeastFormAttack(character.id, form.id)}>
        + Добавить атаку
      </button>

      <h5 className={styles.subtitle}>Заметки</h5>
      <textarea
        className={listStyles.textarea}
        placeholder="Особые чувства, плавание/лазание, особенности зверя…"
        value={form.notes}
        onChange={(e) => update({ notes: e.target.value })}
      />

      {iconPickerOpen && (
        <IconPickerModal currentIcon={form.icon} onClose={() => setIconPickerOpen(false)} onSelect={(icon) => update({ icon })} />
      )}
    </div>
  );
}

export function BeastFormsEditor({ character }: { character: Character }) {
  const addBeastForm = useCharacterStore((s) => s.addBeastForm);
  const setBeastFormResource = useCharacterStore((s) => s.setBeastFormResource);

  return (
    <div className={styles.wrapper}>
      <h4 className={styles.title}>Облики</h4>
      <p className={styles.hint}>
        Дикий облик, превращение и т.п. В облике СИЛ, ЛОВ, ТЕЛ, КД, скорость, хиты и атаки берутся от зверя, остальное —
        от персонажа. Бонусы на заменённые значения в облике не действуют.
      </p>

      {character.beastForms.length > 0 && (
        <label className={styles.resourceRow}>
          <span>При превращении списывать:</span>
          <select
            value={character.beastFormResourceId ?? ''}
            onChange={(e) => setBeastFormResource(character.id, e.target.value || undefined)}
          >
            <option value="">— ничего —</option>
            {character.resources.map((r) => (
              <option key={r.id} value={r.id}>
                {r.label}
              </option>
            ))}
          </select>
        </label>
      )}

      {character.beastForms.map((form) => (
        <BeastFormCard key={form.id} character={character} form={form} />
      ))}

      <button type="button" className="accentButton" onClick={() => addBeastForm(character.id)}>
        Добавить облик
      </button>
    </div>
  );
}

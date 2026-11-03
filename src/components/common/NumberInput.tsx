import { useState, type InputHTMLAttributes } from 'react';
import { sanitizeNumberInputEvent } from '../../utils/numberInput';

interface NumberInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'value' | 'onChange'> {
  value: number;
  onChange: (value: number) => void;
}

/**
 * Числовое поле, которое можно временно стереть целиком.
 * Значение в сторе всегда число, поэтому пустое поле нельзя сохранить — пока поле пустое,
 * ничего не коммитим; новое число сохраняется сразу при вводе, а при уходе из пустого
 * поля в нём снова показывается текущее значение.
 */
export function NumberInput({ value, onChange, onBlur, ...rest }: NumberInputProps) {
  const [empty, setEmpty] = useState(false);

  return (
    <input
      {...rest}
      type="number"
      value={empty ? '' : value}
      onChange={(e) => {
        const raw = sanitizeNumberInputEvent(e);
        if (raw === '') {
          setEmpty(true);
          return;
        }
        const parsed = Number(raw);
        if (Number.isNaN(parsed)) return;
        setEmpty(false);
        onChange(parsed);
      }}
      onBlur={(e) => {
        setEmpty(false);
        onBlur?.(e);
      }}
    />
  );
}

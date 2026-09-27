interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
}

export function ColorPicker({ value, onChange }: ColorPickerProps) {
  return (
    <input
      type="color"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      title="Акцентный цвет карточки"
      style={{ width: 36, height: 36, padding: 0, border: 'none', background: 'none', cursor: 'pointer' }}
    />
  );
}

/** Набор иконок предметов: public/icons/all_icons/icons_atlas_21.webp .. icons_atlas_120.webp */
export const EQUIPMENT_ICON_FILES: string[] = Array.from(
  { length: 100 },
  (_, i) => `icons_atlas_${i + 21}.webp`,
);

export function resolveIconUrl(icon: string): string {
  return `${import.meta.env.BASE_URL}icons/all_icons/${icon}`;
}

# Лист персонажа D&D 5e

Статический SPA для ведения нескольких листов персонажей D&D 5e (с поддержкой хоумбрю-механик). Без бэкенда — всё хранится в `localStorage` браузера. Технические требования и модель данных — см. `docs/ТЗ_лист_персонажа.md`.

## Разработка

```bash
npm install
npm run dev       # dev-сервер
npm run test      # юнит-тесты расчётного движка (vitest)
npm run build     # проверка типов + сборка в dist/
npm run lint      # oxlint
```

## Деплой на GitHub Pages

1. Замените заглушку `base: '/char-list/'` в `vite.config.ts` на `'/<имя-вашего-репозитория>/'`.
2. Запушьте репозиторий на GitHub и включите Pages: **Settings → Pages → Source → GitHub Actions**.
3. Пуш в ветку `main` автоматически соберёт проект и опубликует `dist/` через workflow `.github/workflows/deploy.yml` (использует `actions/upload-pages-artifact` + `actions/deploy-pages`, PAT не требуется).
4. Сайт будет доступен по адресу `https://<username>.github.io/<repo>/`.

## Структура

- `src/types/` — доменные типы (`Character`, `StatField`, `Bonus`, ...)
- `src/engine/` — чистые функции расчёта (без React/стора), покрыты тестами
- `src/store/` — Zustand-стор + синхронизация с `localStorage`
- `src/components/` — UI (layout/common/sections)
- `examples/` — примеры персонажей для ручного тестирования и шеринга

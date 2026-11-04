# Лист персонажа D&D 5e

Приложение на Next.js (App Router) для ведения нескольких листов персонажей D&D 5e (с поддержкой хоумбрю-механик). Пока без бэкенда: всё хранится в `localStorage` браузера (переезд на Supabase запланирован). Технические требования и модель данных — см. `docs/ТЗ_лист_персонажа.md`.

## Разработка

```bash
npm install
npm run dev        # dev-сервер Next.js (http://localhost:3000)
npm run test       # юнит-тесты расчётного движка (vitest)
npm run build      # проверка типов + production-сборка
npm run typecheck  # только проверка типов
npm run lint       # oxlint
```

## Деплой на Vercel

1. Импортируйте репозиторий на [vercel.com/new](https://vercel.com/new): фреймворк Next.js определится автоматически, настройки по умолчанию подходят.
2. Каждый пуш в `main` публикуется в production, пуши в другие ветки и PR — в preview-деплои.
3. GitHub Actions (`.github/workflows/ci.yml`) прогоняет lint, тесты и сборку на каждый пуш и PR.

## Структура

- `src/app/` — маршруты Next.js (layout, страницы)
- `src/types/` — доменные типы (`Character`, `StatField`, `Bonus`, ...)
- `src/engine/` — чистые функции расчёта (без React/стора), покрыты тестами
- `src/store/` — Zustand-стор + синхронизация с `localStorage`
- `src/components/` — UI (layout/common/sections), клиентские компоненты
- `examples/` — примеры персонажей для ручного тестирования и шеринга

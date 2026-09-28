/**
 * Общий стек открытых модалок + один слушатель popstate на всё приложение.
 *
 * Зачем стек, а не pushState/history.back() в каждой модалке независимо: если открыто
 * несколько модалок разом (напр. модалка редактирования + модалка бонуса поверх неё),
 * один физический браузерный "назад" должен закрыть только верхнюю — а слушатели
 * popstate на window получают событие ВСЕ разом, независимо от того, чей именно pushState
 * его вызвал. Поэтому реагирует всегда только вершина стека.
 *
 * suppressNextPopState нужен, чтобы наш собственный history.back() (когда модалку закрыли
 * не кнопкой "назад", а крестиком/оверлеем — и мы сами убираем лишнюю запись из истории)
 * не был по ошибке принят за нажатие "назад" пользователем. Это же попутно защищает от
 * двойного вызова эффекта в React StrictMode в dev-режиме (mount → cleanup → mount).
 */

let suppressNextPopState = false;
let listening = false;
const stack: Array<() => void> = [];

function handlePopState() {
  if (suppressNextPopState) {
    suppressNextPopState = false;
    return;
  }
  const top = stack[stack.length - 1];
  top?.();
}

/** Вызывать при монтировании модалки. Возвращает cleanup — вызвать при размонтировании. */
export function pushModalHistory(onBack: () => void): (closedByPopState: boolean) => void {
  window.history.pushState({ modal: true }, '');
  stack.push(onBack);
  if (!listening) {
    window.addEventListener('popstate', handlePopState);
    listening = true;
  }

  let done = false;
  return (closedByPopState: boolean) => {
    if (done) return;
    done = true;
    const index = stack.lastIndexOf(onBack);
    if (index !== -1) stack.splice(index, 1);
    if (stack.length === 0 && listening) {
      window.removeEventListener('popstate', handlePopState);
      listening = false;
    }
    if (!closedByPopState) {
      suppressNextPopState = true;
      window.history.back();
    }
  };
}

/**
 * Набор слова по буквам в игре «Печатная машинка».
 *
 * Слово здесь собирается из событий ввода, а не из содержимого поля. Причина: телефонная
 * клавиатура не может поставить курсор в поле нулевого размера — он остаётся в начале, и
 * каждая следующая буква встаёт перед предыдущими, отчего набранное «against» показывалось
 * как «tsniaga». Порядок задаём мы сами.
 *
 * Заодно пробел, дефис и апостроф подставляются автоматически: под ними клетка выглядит
 * пустой, и в карточке вроде «you are welcome» человеку негде понять, что от него ждут
 * нажатия пробела.
 */

const AUTO_FILLED_CHARS = new Set([" ", "-", "'", "’", "."]);

export const isAutoFilled = (char) => AUTO_FILLED_CHARS.has(char);

/** Дописать одну набранную букву, подставив разделители до и после неё. */
export function appendGameChar(current, char, target) {
  let next = current;

  while (next.length < target.length && isAutoFilled(target[next.length])) {
    next += target[next.length];
  }

  if (next.length < target.length && !isAutoFilled(char)) {
    next += char;

    while (next.length < target.length && isAutoFilled(target[next.length])) {
      next += target[next.length];
    }
  }

  return next;
}

/** Стереть последнюю букву вместе с разделителями, которые игра подставила за ней. */
export function removeGameChar(current) {
  let next = current.slice(0, -1);

  while (next.length && isAutoFilled(next[next.length - 1])) {
    next = next.slice(0, -1);
  }

  return next;
}

/**
 * Что показать в клетках после очередного события ввода.
 *
 * `inputType` и `data` берутся из события браузера: они говорят, что именно произошло —
 * вставлена буква, нажато удаление или поле переписали целиком (вставка из буфера,
 * подстановка слова клавиатурой). Только в последнем случае приходится верить содержимому
 * поля, и тогда оно обрезается по длине слова.
 */
export function nextTypedText({ current, inputType, data, fieldValue, target }) {
  if (inputType === "insertText" && data) {
    return [...data].reduce((acc, char) => appendGameChar(acc, char, target), current);
  }

  if (typeof inputType === "string" && inputType.startsWith("delete")) {
    return removeGameChar(current);
  }

  return (fieldValue || "").slice(0, target.length);
}

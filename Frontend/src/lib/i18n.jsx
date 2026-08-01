import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { en } from "../locales/en.js";
import { ru } from "../locales/ru.js";
import { tg } from "../locales/tg.js";

const dicts = { en, ru, tg };

export const LANGS = [
  { code: "en", label: "EN", name: "English" },
  { code: "ru", label: "RU", name: "Русский" },
  { code: "tg", label: "TJ", name: "Тоҷикӣ" },
];

const I18nContext = createContext({ lang: "en", setLang: () => {}, t: (key) => key });

function resolve(dict, key) {
  return key.split(".").reduce((obj, part) => (obj == null ? undefined : obj[part]), dict);
}

// Классические правила русского плюрализации: 1 слово / 2 слова / 5 слов.
function pluralRu(n) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return "one";
  if (mod10 >= 2 && mod10 <= 4 && !(mod100 >= 12 && mod100 <= 14)) return "few";
  return "many";
}

// Таджикский не изменяет форму существительного при числительном — всегда одна форма.
function pluralTg() {
  return "other";
}

function pluralEn(n) {
  return n === 1 ? "one" : "other";
}

const PLURAL_RULES = { en: pluralEn, ru: pluralRu, tg: pluralTg };

function readLang() {
  try {
    const saved = localStorage.getItem("glossa-lang");
    if (saved && dicts[saved]) return saved;
  } catch (e) {}
  return "en";
}

function interpolate(str, vars) {
  let result = str;
  for (const name in vars) result = result.replaceAll(`{${name}}`, vars[name]);
  return result;
}

function translate(lang, key, vars) {
  let entry = resolve(dicts[lang], key);
  if (entry === undefined) entry = resolve(dicts.en, key);
  if (entry === undefined) return key;

  if (Array.isArray(entry)) return entry;

  if (entry !== null && typeof entry === "object") {
    const category = PLURAL_RULES[lang](vars?.n ?? 0);
    const str = entry[category] ?? entry.other ?? Object.values(entry)[0];
    return interpolate(str, vars);
  }

  return vars ? interpolate(entry, vars) : entry;
}

export function I18nProvider({ children }) {
  const [lang, setLang] = useState(readLang);

  useEffect(() => {
    document.documentElement.lang = lang;
    try {
      localStorage.setItem("glossa-lang", lang);
    } catch (e) {}
  }, [lang]);

  const t = useCallback((key, vars) => translate(lang, key, vars), [lang]);

  return <I18nContext.Provider value={{ lang, setLang, t }}>{children}</I18nContext.Provider>;
}

export const useI18n = () => useContext(I18nContext);
export const useT = () => useContext(I18nContext).t;

// Для мест вне дерева I18nProvider (например, ErrorBoundary — он выше BrowserRouter).
export function getStaticT() {
  const lang = readLang();
  return (key, vars) => translate(lang, key, vars);
}

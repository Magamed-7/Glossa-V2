import { getStaticT } from "../i18n.jsx";

export function errorText(error) {
  const t = getStaticT();
  const code = error?.code;

  if (code) {
    const key = `errors.${code}`;
    const translated = t(key);
    if (translated !== key) return translated;
  }

  return error?.message || t("errors.generic");
}

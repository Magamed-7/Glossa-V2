export function formatDate(value) {
  if (!value) return "";
  return new Date(value).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

export function formatDateTimeWithSeconds(value) {
  if (!value) return "";
  const date = new Date(value);
  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export function formatRelative(value) {
  if (!value) return "";

  const then = new Date(value).getTime();
  const diffSeconds = Math.round((then - Date.now()) / 1000);
  const divisions = [
    { amount: 60, unit: "second" },
    { amount: 60, unit: "minute" },
    { amount: 24, unit: "hour" },
    { amount: 7, unit: "day" },
    { amount: 4.34524, unit: "week" },
    { amount: 12, unit: "month" },
    { amount: Number.POSITIVE_INFINITY, unit: "year" },
  ];

  const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });
  let duration = diffSeconds;

  for (const division of divisions) {
    if (Math.abs(duration) < division.amount) {
      return rtf.format(Math.round(duration), division.unit);
    }
    duration /= division.amount;
  }

  return "";
}

// Decimal с бэкенда приходит числом/строкой с ограниченной точностью (2 знака для денег) —
// Number() безопасен для отображения в этих пределах, без арифметики поверх результата.
export function formatMoney(value, currency = "TJS") {
  if (value === null || value === undefined) return "—";
  const amount = Number(value);
  return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(amount);
}

export function formatSeconds(value) {
  if (value === null || value === undefined) return "∞";

  const hours = Math.floor(value / 3600);
  const minutes = Math.round((value % 3600) / 60);

  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

export function formatCount(value) {
  if (value === null || value === undefined) return "—";
  return new Intl.NumberFormat().format(value);
}

// null в лимитах тарифа означает безлимит — рисовать ∞, а не 0 (см. API_CONTRACT.md §3.6).
export function formatLimit(value) {
  if (value === null || value === undefined) return "∞";
  return formatCount(value);
}

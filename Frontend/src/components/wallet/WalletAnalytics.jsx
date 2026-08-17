import NeoCard from "../ui/NeoCard.jsx";
import Skeleton from "../ui/Skeleton.jsx";
import Icon from "../ui/Icon.jsx";
import { useApi } from "../../lib/useApi.js";
import { getAnalytics } from "../../lib/api/payments.js";
import { formatMoney } from "../../lib/format.js";
import { useT } from "../../lib/i18n.jsx";

export default function WalletAnalytics() {
  const t = useT();
  const { data: analytics, loading } = useApi(() => getAnalytics(), []);

  if (loading) return <Skeleton className="h-60" />;
  if (!analytics) return null;

  const totalToppedUp = Number(analytics.total_topped_up) || 0;
  const totalSpent = Number(analytics.total_spent) || 0;
  
  // Вычисляем максимум для построения относительных гистограмм
  const maxVal = Math.max(totalToppedUp, totalSpent, 1);
  const topupPercent = (totalToppedUp / maxVal) * 100;
  const spentPercent = (totalSpent / maxVal) * 100;

  // Подготовка сегментов для SVG Doughnut Chart
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  let accumulatedPercent = 0;

  const segments = analytics.by_category.map((cat) => {
    const amount = Number(cat.total_amount) || 0;
    const percent = totalSpent > 0 ? amount / totalSpent : 0;
    
    // Цвета сегментов в стиле нео-ретро
    let color = "var(--color-outline-variant)";
    if (cat.item_type === "subscription") {
      color = "var(--color-secondary)"; // Малиновый акцент
    } else if (cat.item_type === "user_story") {
      color = "#eab308"; // Золотисто-желтый
    } else if (cat.item_type === "lingo_service") {
      color = "var(--color-inverse-surface)"; // Черный/белый инвертированный
    }

    const segmentLength = percent * circumference;
    const offset = -(accumulatedPercent * circumference);
    accumulatedPercent += percent;

    return {
      ...cat,
      amount,
      percent,
      length: segmentLength,
      offset,
      color,
    };
  });

  return (
    <NeoCard className="relative overflow-hidden">
      {/* Декоративный диагональный штамп */}
      <div className="absolute top-4 right-4 text-[10px] font-ledger border-2 border-dashed border-black/20 dark:border-white/10 px-2 py-1 uppercase rotate-12 select-none pointer-events-none opacity-40">
        Glossa Ledger
      </div>

      <h3 className="font-headline text-headline-md mb-6">{t("wallet.analyticsTitle")}</h3>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Левая колонка: сравнение Поступлений и Трат */}
        <div className="lg:col-span-4 space-y-6">
          <div className="space-y-2">
            <div className="flex justify-between items-end">
              <span className="font-label text-label-md uppercase text-on-surface-variant flex items-center gap-1.5">
                <Icon name="arrow_upward" className="text-emerald-600 dark:text-emerald-400 font-bold" />
                {t("wallet.totalTopUps")}
              </span>
              <span className="font-ledger text-lg font-bold text-emerald-600 dark:text-emerald-400">
                {formatMoney(totalToppedUp)}
              </span>
            </div>
            <div className="border-2 border-black dark:border-stone-700 h-6 bg-surface-container-lowest overflow-hidden shadow-[2px_2px_0px_0px_#000000] dark:shadow-[2px_2px_0px_0px_var(--color-tertiary)] relative">
              <div 
                className="h-full bg-emerald-500 border-r border-black transition-all duration-700 ease-out" 
                style={{ width: `${topupPercent}%` }} 
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-end">
              <span className="font-label text-label-md uppercase text-on-surface-variant flex items-center gap-1.5">
                <Icon name="arrow_downward" className="text-secondary font-bold" />
                {t("wallet.totalSpent")}
              </span>
              <span className="font-ledger text-lg font-bold text-secondary">
                {formatMoney(totalSpent)}
              </span>
            </div>
            <div className="border-2 border-black dark:border-stone-700 h-6 bg-surface-container-lowest overflow-hidden shadow-[2px_2px_0px_0px_#000000] dark:shadow-[2px_2px_0px_0px_var(--color-tertiary)] relative">
              <div 
                className="h-full bg-secondary border-r border-black transition-all duration-700 ease-out" 
                style={{ width: `${spentPercent}%` }} 
              />
            </div>
          </div>
        </div>

        {/* Средняя колонка: кастомный SVG Doughnut Chart */}
        <div className="lg:col-span-4 flex flex-col items-center justify-center py-4">
          {totalSpent > 0 ? (
            <div className="relative w-48 h-48">
              <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90 filter drop-shadow-[4px_4px_0px_var(--color-tertiary)]">
                {/* Внешний контур бублика */}
                <circle cx="50" cy="50" r={radius} fill="transparent" stroke="var(--color-tertiary)" strokeWidth="14" />
                <circle cx="50" cy="50" r={radius} fill="var(--color-surface)" />
                
                {/* Отрисовка сегментов */}
                {segments.map((seg, i) => (
                  <circle
                    key={i}
                    cx="50"
                    cy="50"
                    r={radius}
                    fill="transparent"
                    stroke={seg.color}
                    strokeWidth="10"
                    strokeDasharray={`${seg.length} ${circumference}`}
                    strokeDashoffset={seg.offset}
                    className="transition-all duration-700 ease-out origin-center"
                  />
                ))}
                
                {/* Внутренний контур */}
                <circle cx="50" cy="50" r="28" fill="var(--color-surface)" stroke="var(--color-tertiary)" strokeWidth="2" />
              </svg>
              {/* Текст по центру */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                <span className="font-label text-[10px] uppercase text-on-surface-variant tracking-wider leading-none">Spent</span>
                <span className="font-ledger text-base font-black text-on-surface mt-1">{formatMoney(totalSpent)}</span>
              </div>
            </div>
          ) : (
            <div className="w-40 h-40 border-4 border-dashed border-surface-container-highest rounded-full flex items-center justify-center text-center p-4">
              <p className="font-body text-xs text-on-surface-variant uppercase tracking-wider">No spending records</p>
            </div>
          )}
        </div>

        {/* Правая колонка: список трат по категориям */}
        <div className="lg:col-span-4 space-y-4">
          <p className="font-label text-label-md uppercase text-on-surface-variant border-b border-black/25 dark:border-white/10 pb-2">
            {t("wallet.byCategory")}
          </p>
          {segments.length > 0 ? (
            <ul className="space-y-3">
              {segments.map((row) => (
                <li key={row.item_type} className="space-y-1">
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-body font-bold text-on-surface flex items-center gap-2">
                      <span 
                        className="w-3 h-3 border border-black inline-block shadow-[1px_1px_0px_#000]" 
                        style={{ backgroundColor: row.color }} 
                      />
                      {t("wallet.type_" + row.item_type) || row.item_type.replace("_", " ")}
                    </span>
                    <span className="font-ledger font-bold text-on-surface">
                      {formatMoney(row.amount)}
                    </span>
                  </div>
                  {/* Прогресс доли трат */}
                  <div className="border border-black dark:border-stone-700 h-2 bg-surface-container overflow-hidden">
                    <div 
                      className="h-full transition-all duration-500 ease-out" 
                      style={{ 
                        width: `${row.percent * 100}%`,
                        backgroundColor: row.color
                      }} 
                    />
                  </div>
                  <div className="text-[10px] text-right font-ledger text-on-surface-variant">
                    {Math.round(row.percent * 100)}% ({row.count} tx)
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="font-body text-body-md text-on-surface-variant italic">No data available</p>
          )}
        </div>
      </div>
    </NeoCard>
  );
}

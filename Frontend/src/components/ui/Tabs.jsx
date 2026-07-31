import { useId, useRef } from "react";

export default function Tabs({ id, tabs, value, onChange }) {
  const autoId = useId();
  const baseId = id || autoId;
  const tabRefs = useRef([]);

  function onKeyDown(e, index) {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;

    e.preventDefault();
    const delta = e.key === "ArrowRight" ? 1 : -1;
    const nextIndex = (index + delta + tabs.length) % tabs.length;
    onChange(tabs[nextIndex].value);
    tabRefs.current[nextIndex]?.focus();
  }

  return (
    <div className="border-b-2 border-tertiary flex" role="tablist">
      {tabs.map((tab, index) => {
        const active = tab.value === value;

        return (
          <button
            key={tab.value}
            ref={(el) => (tabRefs.current[index] = el)}
            id={`${baseId}-tab-${tab.value}`}
            role="tab"
            aria-selected={active}
            aria-controls={`${baseId}-panel-${tab.value}`}
            tabIndex={active ? 0 : -1}
            className={`font-label text-label-md uppercase px-4 py-3 border-b-2 -mb-0.5 transition-colors ${
              active ? "border-secondary text-secondary" : "border-transparent text-on-surface-variant"
            }`}
            onClick={() => onChange(tab.value)}
            onKeyDown={(e) => onKeyDown(e, index)}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

export function TabPanel({ id, value, activeValue, children }) {
  if (value !== activeValue) return null;

  return (
    <div id={`${id}-panel-${value}`} role="tabpanel" aria-labelledby={`${id}-tab-${value}`}>
      {children}
    </div>
  );
}

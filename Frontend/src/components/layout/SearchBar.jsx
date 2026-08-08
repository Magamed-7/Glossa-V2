import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "../ui/Icon.jsx";
import { useT } from "../../lib/i18n.jsx";

export default function SearchBar() {
  const t = useT();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef(null);

  useEffect(() => {
    function onKeyDown(e) {
      const tag = document.activeElement?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;

      if (e.key === "/") {
        e.preventDefault();
        setOpen(true);
        setTimeout(() => inputRef.current?.focus(), 0);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  function onSubmit(e) {
    e.preventDefault();
    if (!query.trim()) return;
    navigate(`/search?q=${encodeURIComponent(query.trim())}`);
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={t("nav.search")}
        className="flex items-center justify-center w-10 h-10 border-2 border-tertiary hover:bg-surface-container transition-colors shrink-0"
      >
        <Icon name="search" className="text-tertiary" />
      </button>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex items-center gap-2 h-10">
      <input
        ref={inputRef}
        type="search"
        className="h-full bg-surface-container-low border-2 border-tertiary px-3 font-body text-body-md outline-none focus:border-secondary w-40 md:w-56"
        placeholder={t("nav.searchPlaceholder")}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onBlur={() => !query && setOpen(false)}
        autoFocus
      />
      <button
        type="submit"
        aria-label={t("nav.submitSearch")}
        className="flex items-center justify-center w-10 h-10 border-2 border-tertiary hover:bg-surface-container transition-colors shrink-0"
      >
        <Icon name="search" className="text-secondary" />
      </button>
    </form>
  );
}

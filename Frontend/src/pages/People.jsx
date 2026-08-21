import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Icon from "../components/ui/Icon.jsx";
import Avatar from "../components/ui/Avatar.jsx";
import Skeleton from "../components/ui/Skeleton.jsx";
import EmptyState from "../components/ui/EmptyState.jsx";
import { useApi } from "../lib/useApi.js";
import { searchUsers } from "../lib/api/social.js";
import { useT } from "../lib/i18n.jsx";

const SEARCH_DEBOUNCE_MS = 300;

export default function People() {
  const t = useT();
  const [input, setInput] = useState("");
  const [query, setQuery] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setQuery(input.trim()), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [input]);

  const { data: users, loading } = useApi(() => searchUsers({ q: query, limit: 40 }), [query]);

  // Helper local translations
  const lookup = (key, fallback) => {
    const res = t(key);
    return res === key ? fallback : res;
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 py-6">
      <section className="bg-secondary text-white p-6 border-2 border-primary hard-shadow mb-6">
        <h1 className="font-display text-headline-xl uppercase tracking-tight flex items-center gap-3">
          <span className="text-3xl">👥</span>
          {t("people.title")}
        </h1>
        <p className="font-body text-body-lg opacity-90 mt-2">{t("people.subtitle")}</p>
      </section>

      <div className="relative max-w-lg mb-8">
        <Icon name="search" className="absolute left-4 top-1/2 -translate-y-1/2 text-primary font-bold text-xl" />
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t("people.searchPlaceholder")}
          className="w-full pl-12 pr-4 py-3 border-2 border-primary bg-surface dark:bg-stone-900 focus:outline-none focus:bg-surface-variant focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all font-body text-body-md placeholder:text-on-surface-variant text-primary font-semibold"
        />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <Skeleton key={n} className="h-32" />
          ))}
        </div>
      ) : !users || users.length === 0 ? (
        <EmptyState icon="person_search" title={t("people.noResults")} description={t("people.noResultsDesc")} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {users.map((user) => {
            const isPro = user.subscription_tier === "pro";
            const isPremium = user.subscription_tier === "premium";

            let avatarWrapperClass = "relative";
            if (isPro) {
              avatarWrapperClass = "relative rounded-full ring-2 ring-amber-400 p-0.5 bg-amber-400 border-2 border-primary shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]";
            } else if (isPremium) {
              avatarWrapperClass = "relative rounded-full ring-2 ring-secondary p-0.5 bg-secondary border-2 border-primary shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]";
            }

            return (
              <div
                key={user.id}
                className="flex flex-col justify-between border-2 border-primary bg-[#FAF8F5] dark:bg-stone-900 p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all"
              >
                <div className="flex items-start gap-4 mb-4">
                  <div className={avatarWrapperClass}>
                    <Avatar photoUrl={user.photo_url} name={user.username} userId={user.id} size="md" />
                    {isPremium && (
                      <span className="absolute -bottom-1 -right-1 bg-white border border-primary text-[8px] rounded-full w-4 h-4 flex items-center justify-center shadow">
                        👑
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-display text-body-lg font-bold text-primary truncate">
                        {user.username}
                      </span>
                      {isPro && (
                        <span className="bg-amber-400 text-black border border-primary font-label text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded leading-none">
                          ⚡ PRO
                        </span>
                      )}
                      {isPremium && (
                        <span className="bg-secondary text-white border border-primary font-label text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded leading-none">
                          👑 PREMIUM
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Подписка и сообщения живут на странице человека — здесь только вход туда,
                    чтобы решение принималось после того, как его увидели целиком. */}
                <div className="border-t-2 border-dotted border-primary pt-4 mt-auto">
                  <Link
                    to={`/profile/${user.id}`}
                    className="font-label text-xs uppercase font-bold tracking-widest text-secondary hover:underline flex items-center justify-center gap-1 text-center"
                  >
                    <span className="min-w-0 break-words">{lookup("viewProfile", "View Profile")}</span>
                    <Icon name="arrow_forward" className="text-sm font-bold shrink-0" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

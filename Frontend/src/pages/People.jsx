import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Icon from "../components/ui/Icon.jsx";
import Avatar from "../components/ui/Avatar.jsx";
import Skeleton from "../components/ui/Skeleton.jsx";
import EmptyState from "../components/ui/EmptyState.jsx";
import FollowButton from "../components/profile/FollowButton.jsx";
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

  return (
    <div className="space-y-section-gap">
      <section>
        <h1 className="font-display text-headline-lg mb-2">{t("people.title")}</h1>
        <p className="font-body text-body-lg text-on-surface-variant">{t("people.subtitle")}</p>
      </section>

      <div className="relative max-w-md">
        <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t("people.searchPlaceholder")}
          className="w-full pl-10 pr-4 py-3 border-2 border-tertiary bg-surface focus:outline-none focus:border-secondary transition-colors font-body text-body-md placeholder:text-on-surface-variant"
        />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-gutter">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <Skeleton key={n} className="h-20" />
          ))}
        </div>
      ) : !users || users.length === 0 ? (
        <EmptyState icon="person_search" title={t("people.noResults")} description={t("people.noResultsDesc")} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-gutter">
          {users.map((user) => (
            <div key={user.id} className="flex items-center gap-4 border-2 border-tertiary p-4">
              <Link to={`/profile/${user.id}`} className="flex items-center gap-4 flex-1 min-w-0 hover:underline">
                <Avatar photoUrl={user.photo_url} name={user.username} userId={user.id} size="md" />
                <span className="font-body text-body-md font-bold truncate">{user.username}</span>
              </Link>
              <FollowButton userId={user.id} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

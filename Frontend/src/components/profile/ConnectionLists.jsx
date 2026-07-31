import { useState } from "react";
import { Link } from "react-router-dom";
import Tabs from "../ui/Tabs.jsx";
import Avatar from "../ui/Avatar.jsx";
import Badge from "../ui/Badge.jsx";
import EmptyState from "../ui/EmptyState.jsx";
import { useApi } from "../../lib/useApi.js";
import { getFollowers, getFollowing, getFriends } from "../../lib/api/social.js";

const TABS = [
  { value: "followers", label: "Followers" },
  { value: "following", label: "Following" },
  { value: "friends", label: "Friends" },
];

const FETCHERS = { followers: getFollowers, following: getFollowing, friends: getFriends };

export default function ConnectionLists() {
  const [tab, setTab] = useState("followers");
  const { data: users, loading } = useApi(() => FETCHERS[tab](), [tab]);

  return (
    <div>
      <Tabs id="connections" tabs={TABS} value={tab} onChange={setTab} />
      <div className="mt-4">
        {!loading && users && users.length === 0 && <EmptyState icon="group" title={`No ${tab} yet`} />}
        {!loading && users && users.length > 0 && (
          <ul className="divide-y-2 divide-surface-container-highest">
            {users.map((user) => (
              <li key={user.id}>
                <Link to={`/profile/${user.id}`} className="flex items-center gap-3 py-3">
                  <Avatar name={user.username} userId={user.id} size="sm" />
                  <span className="font-body text-body-md">{user.username}</span>
                  {tab === "friends" && <Badge variant="accent">Mutual</Badge>}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

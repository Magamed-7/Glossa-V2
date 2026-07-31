import { Link } from "react-router-dom";
import Icon from "../ui/Icon.jsx";
import Avatar from "../ui/Avatar.jsx";
import Skeleton from "../ui/Skeleton.jsx";
import SearchBar from "./SearchBar.jsx";

export default function TopAppBar({ streak, hasUnread, user }) {
  return (
    <header className="bg-surface border-b-2 border-tertiary flex justify-between items-center w-full px-margin-mobile md:px-margin-desktop py-4 sticky top-0 z-30">
      <div className="md:hidden">
        <h1 className="font-display text-headline-lg text-tertiary italic">Glossa</h1>
      </div>
      <div className="hidden md:flex items-center gap-8">
        <span className="font-label text-label-md text-secondary font-bold">DASHBOARD</span>
        <span className="font-label text-label-md text-on-surface-variant hover:text-secondary transition-colors cursor-pointer">
          INSIGHTS
        </span>
        <span className="font-label text-label-md text-on-surface-variant hover:text-secondary transition-colors cursor-pointer">
          COMMUNITY
        </span>
      </div>
      <div className="flex items-center gap-4">
        <SearchBar />
        <span className="flex items-center gap-1 text-tertiary" aria-label="Current streak">
          <Icon name="local_fire_department" />
          {streak === undefined ? <Skeleton className="w-4 h-4" /> : <span className="font-ledger text-sm">{streak}</span>}
        </span>
        <Link to="/notifications" className="relative text-tertiary" aria-label="Notifications">
          <Icon name="notifications" />
          {hasUnread && (
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-secondary rounded-full" aria-hidden="true" />
          )}
        </Link>
        <Link to="/profile" aria-label="My profile">
          {user === undefined ? (
            <Skeleton className="w-10 h-10 rounded-full" />
          ) : (
            <Avatar photoUrl={user?.photo_url} name={user?.username} size="md" />
          )}
        </Link>
      </div>
    </header>
  );
}

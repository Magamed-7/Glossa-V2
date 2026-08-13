import Modal from "../ui/Modal.jsx";
import Avatar from "../ui/Avatar.jsx";
import Skeleton from "../ui/Skeleton.jsx";
import { useApi } from "../../lib/useApi.js";
import { getFriends } from "../../lib/api/social.js";
import { useT } from "../../lib/i18n.jsx";

export default function NewConversationModal({ open, onClose, onPick }) {
  const t = useT();
  const { data: friends, loading } = useApi(() => (open ? getFriends() : Promise.resolve(null)), [open]);

  return (
    <Modal open={open} onClose={onClose} title={t("messenger.newConversation")}>
      {loading ? (
        <div className="flex flex-col gap-3">
          <Skeleton className="h-12" />
          <Skeleton className="h-12" />
        </div>
      ) : !friends || friends.length === 0 ? (
        <p className="font-body text-body-md text-on-surface-variant">{t("messenger.noFriendsYet")}</p>
      ) : (
        <div className="flex flex-col gap-2 max-h-80 overflow-y-auto">
          {friends.map((friend) => (
            <button
              key={friend.id}
              type="button"
              onClick={() => onPick(friend.id)}
              className="flex items-center gap-3 p-3 border-2 border-tertiary hover:bg-surface-container transition-colors text-left"
            >
              <Avatar name={friend.username} userId={friend.id} size="md" />
              <span className="font-body text-body-md font-bold">{friend.username}</span>
            </button>
          ))}
        </div>
      )}
    </Modal>
  );
}

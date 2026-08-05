import { useRef, useState } from "react";
import Avatar from "../ui/Avatar.jsx";
import Icon from "../ui/Icon.jsx";
import { uploadPhoto } from "../../lib/api/profile.js";
import { errorText } from "../../lib/api/errorText.js";
import { useToast } from "../../lib/toast.jsx";
import { useT } from "../../lib/i18n.jsx";

const MAX_SIZE = 5 * 1024 * 1024;

export default function PhotoUpload({ photoUrl, name, onUploaded }) {
  const t = useT();
  const toast = useToast();
  const inputRef = useRef(null);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);

  async function onFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error(t("profile.chooseImageFile"));
      return;
    }
    if (file.size > MAX_SIZE) {
      toast.error(t("profile.imageTooLarge"));
      return;
    }

    setPreview(URL.createObjectURL(file));
    setUploading(true);

    try {
      const updated = await uploadPhoto(file);
      onUploaded(updated);
    } catch (err) {
      toast.error(errorText(err));
      setPreview(null);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="relative w-24 h-24 shrink-0">
      {preview ? (
        <div className="w-24 h-24 border-2 border-tertiary rounded-full overflow-hidden">
          <img src={preview} alt="" className="w-full h-full object-cover" loading="eager" width={96} height={96} />
        </div>
      ) : (
        <Avatar photoUrl={photoUrl} name={name} size="xl" />
      )}
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={onFileChange} />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        aria-label={t("profile.changePhoto")}
        title={t("profile.changePhoto")}
        className="absolute -bottom-1 -right-1 w-9 h-9 rounded-full bg-secondary text-on-secondary border-2 border-tertiary flex items-center justify-center hard-shadow disabled:opacity-50 transition-transform hover:scale-105"
      >
        <Icon name={uploading ? "hourglass_empty" : "photo_camera"} className="text-lg" />
      </button>
    </div>
  );
}

import { useRef, useState } from "react";
import Avatar from "../ui/Avatar.jsx";
import NeoButton from "../ui/NeoButton.jsx";
import { uploadPhoto } from "../../lib/api/profile.js";
import { errorText } from "../../lib/api/errorText.js";
import { useToast } from "../../lib/toast.jsx";

const MAX_SIZE = 5 * 1024 * 1024;

export default function PhotoUpload({ photoUrl, name, onUploaded }) {
  const toast = useToast();
  const inputRef = useRef(null);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);

  async function onFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file.");
      return;
    }
    if (file.size > MAX_SIZE) {
      toast.error("Image must be under 5 MB.");
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
    <div className="flex items-center gap-4">
      {preview ? (
        <div className="w-24 h-24 border-2 border-tertiary rounded-full overflow-hidden">
          <img src={preview} alt="" className="w-full h-full object-cover" />
        </div>
      ) : (
        <Avatar photoUrl={photoUrl} name={name} size="xl" />
      )}
      <div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={onFileChange}
        />
        <NeoButton variant="ghost" size="md" loading={uploading} onClick={() => inputRef.current?.click()}>
          Change Photo
        </NeoButton>
      </div>
    </div>
  );
}

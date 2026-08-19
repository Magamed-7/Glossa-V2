// Marketplace providers are fictional demo accounts, so every portrait here is a
// generated image shipped with the app. Nothing references a real person, and the
// fallback stays local instead of calling an outside photo service.
const PHOTO_MAP = {
  "ji-yoon k.": "/img/ji_yoon.png",
  "ji-yoon": "/img/ji_yoon.png",
  "carlos s.": "/img/carlos_m.png",
  "carlos m.": "/img/carlos_m.png",
  "carlos": "/img/carlos_m.png",
  "marc dubois": "/img/jean_luc.png",
  "jean-luc": "/img/jean_luc.png",
  "jean luc": "/img/jean_luc.png",
  "elena rossi": "/img/yuki_tanaka.png",
  "bahriddin a.": "/img/avatars/scholar-hornrim.webp",
  "global tech inc.": "/img/avatars/archivist-suit.webp",
};

const FALLBACK_POOL = [
  "/img/avatars/academic-curious.webp",
  "/img/avatars/academic-silver.webp",
  "/img/avatars/archivist-glasses.webp",
  "/img/avatars/archivist-monocle.webp",
  "/img/avatars/creative-glasses.webp",
  "/img/avatars/learner-confident.webp",
  "/img/avatars/scholar-coat.webp",
  "/img/avatars/scholar-lamp.webp",
  "/img/avatars/scholar-turtleneck.webp",
  "/img/avatars/student-studio.webp",
];

export function providerAvatarUrl(service) {
  if (!service) return "/img/avatars/user-default.webp";
  if (service.provider_photo_url) return service.provider_photo_url;

  const name = (service.provider_name || "").toLowerCase().trim();

  if (PHOTO_MAP[name]) return PHOTO_MAP[name];

  for (const [key, url] of Object.entries(PHOTO_MAP)) {
    if (name && (name.includes(key) || key.includes(name))) return url;
  }

  return FALLBACK_POOL[(service.provider_id || 0) % FALLBACK_POOL.length];
}

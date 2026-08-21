// A provider's own photo when they have uploaded one, otherwise a generated portrait
// bundled with the app, picked so the same provider always gets the same face. Nothing
// here reaches an outside photo service or depicts a real person.
const FALLBACK_POOL = [
  "/img/avatars/academic-curious.webp",
  "/img/avatars/academic-silver.webp",
  "/img/avatars/archivist-glasses.webp",
  "/img/avatars/archivist-monocle.webp",
  "/img/avatars/archivist-suit.webp",
  "/img/avatars/creative-glasses.webp",
  "/img/avatars/learner-confident.webp",
  "/img/avatars/scholar-coat.webp",
  "/img/avatars/scholar-hornrim.webp",
  "/img/avatars/scholar-lamp.webp",
  "/img/avatars/scholar-turtleneck.webp",
  "/img/avatars/student-studio.webp",
];

export function providerAvatarUrl(service) {
  if (!service) return "/img/avatars/user-default.webp";
  if (service.provider_photo_url) return service.provider_photo_url;

  return FALLBACK_POOL[(service.provider_id || 0) % FALLBACK_POOL.length];
}

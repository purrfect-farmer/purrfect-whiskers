export const MAX_CONCURRENT_BACKUPS = Math.max(
  navigator.hardwareConcurrency || 1,
  3,
);

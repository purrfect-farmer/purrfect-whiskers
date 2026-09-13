/** Optional GitHub token  */
const GITHUB_TOKEN = import.meta.env.VITE_GITHUB_TOKEN || "";

/** Whether a token was supplied at build time */
export const hasGithubToken = () => Boolean(GITHUB_TOKEN);

/** Headers for a GitHub request */
export function getGithubHeaders(accept = "application/vnd.github+json") {
  return {
    Accept: accept,
    ...(GITHUB_TOKEN ? { Authorization: `Bearer ${GITHUB_TOKEN}` } : {}),
  };
}

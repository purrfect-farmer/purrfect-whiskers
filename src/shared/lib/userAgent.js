/** The User-Agent naming `fullVersion` as its Chrome version, unchanged without one */
export function withChromeVersion(userAgent, fullVersion) {
  if (!userAgent || !fullVersion) return userAgent;

  return userAgent.replace(/Chrome\/[\d.]+/, `Chrome/${fullVersion}`);
}

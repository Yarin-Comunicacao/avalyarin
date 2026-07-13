export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

// Generate login URL at runtime - redirects to our backend which handles Google OAuth
export const getLoginUrl = (returnPath?: string) => {
  const origin = window.location.origin;
  return `${origin}/api/auth/login?origin=${encodeURIComponent(origin)}`;
};

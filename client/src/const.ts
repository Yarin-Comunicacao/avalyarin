export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

// Detect auth mode: if VITE_OAUTH_PORTAL_URL is set, use Manus OAuth portal
// Otherwise, redirect to our backend which handles Google OAuth
const MANUS_PORTAL_URL = import.meta.env.VITE_OAUTH_PORTAL_URL as string | undefined;
const APP_ID = import.meta.env.VITE_APP_ID as string | undefined;

export const getLoginUrl = (returnPath?: string) => {
  const origin = window.location.origin;

  // If Manus OAuth portal is configured, use it directly
  if (MANUS_PORTAL_URL && APP_ID) {
    const state = btoa(JSON.stringify({ origin, returnPath: returnPath || "/" }));
    return `${MANUS_PORTAL_URL}/login?app_id=${APP_ID}&state=${state}&redirect_uri=${encodeURIComponent(origin + "/api/oauth/callback")}`;
  }

  // Otherwise, redirect to our backend which handles Google OAuth
  return `${origin}/api/auth/login?origin=${encodeURIComponent(origin)}`;
};

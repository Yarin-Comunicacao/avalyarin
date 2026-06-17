export const COOKIE_NAME = "app_session_id";
export const ONE_YEAR_MS = 1000 * 60 * 60 * 24 * 365;
export const AXIOS_TIMEOUT_MS = 30_000;
export const UNAUTHED_ERR_MSG = 'Please login (10001)';
export const NOT_ADMIN_ERR_MSG = 'You do not have required permission (10002)';

// Connect Yarin integration
export const CONNECT_YARIN_BASE_URL = 'https://yarinconn-4cnl6xuq.manus.space';
export const getConnectYarinUrl = (username: string) => `${CONNECT_YARIN_BASE_URL}/${username}`;

export const ENV = {
  // App
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "",
  isProduction: process.env.NODE_ENV === "production",

  // Database (TiDB)
  databaseUrl: process.env.DATABASE_URL ?? "",

  // Supabase Auth
  supabaseUrl: process.env.SUPABASE_URL ?? "",
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY ?? "",
  supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",

  // Google OAuth
  googleClientId: process.env.GOOGLE_CLIENT_ID ?? "",
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",

  // Facebook OAuth
  facebookClientId: process.env.FACEBOOK_CLIENT_ID ?? "",
  facebookClientSecret: process.env.FACEBOOK_CLIENT_SECRET ?? "",

  // Cloudflare R2 Storage
  r2AccountId: process.env.R2_ACCOUNT_ID ?? "",
  r2AccessKeyId: process.env.R2_ACCESS_KEY_ID ?? "",
  r2SecretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? "",
  r2BucketName: process.env.R2_BUCKET_NAME ?? "avalyarin-assets",
  r2PublicUrl: process.env.R2_PUBLIC_URL ?? "",
  r2Endpoint: process.env.R2_ENDPOINT ?? "",

  // LLM (OpenAI-compatible or Gemini)
  llmApiKey: process.env.LLM_API_KEY ?? "",
  llmApiUrl: process.env.LLM_API_URL ?? "https://generativelanguage.googleapis.com/v1beta/openai",
  llmModel: process.env.LLM_MODEL ?? "gemini-2.5-flash",

  // Owner info
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",

  // Legacy Forge (kept for backward compat during migration)
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
};

export const DevEnvironment = {
  db_uri: process.env.MONGODB_URI ?? '',
  port: Number(process.env.PORT ?? 3000),
  // Placeholder for local learning only — override with JWT_SECRET in .env
  jwt_secret: process.env.JWT_SECRET ?? 'dev-only-change-me-jwt-secret',
};

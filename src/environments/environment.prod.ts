export const ProdEnvironment = {
  db_uri: process.env.MONGODB_URI ?? '',
  port: Number(process.env.PORT ?? 3000),
  // Prod must set JWT_SECRET in the environment — empty string fails closed in jwt.ts
  jwt_secret: process.env.JWT_SECRET ?? '',
};

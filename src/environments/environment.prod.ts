export const ProdEnvironment = {
  db_uri: process.env.MONGODB_URI ?? '',
  port: Number(process.env.PORT ?? 3000),
};

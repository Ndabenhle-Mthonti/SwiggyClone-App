import { DevEnvironment } from './environment.dev';
import { ProdEnvironment } from './environment.prod';

export interface AppEnvironment {
  db_uri: string;
  port: number;
  /** HMAC secret for signing/verifying JWTs — never expose to clients. */
  jwt_secret: string;
}

export function getEnvironmentVariables(): AppEnvironment {
  if (process.env.NODE_ENV === 'production') {
    return ProdEnvironment;
  }
  return DevEnvironment;
}

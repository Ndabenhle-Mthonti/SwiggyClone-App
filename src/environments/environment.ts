import { DevEnvironment } from './environment.dev';
import { ProdEnvironment } from './environment.prod';

export interface AppEnvironment {
  db_uri: string;
  port: number;
}

export function getEnvironmentVariables(): AppEnvironment {
  if (process.env.NODE_ENV === 'production') {
    return ProdEnvironment;
  }
  return DevEnvironment;
}

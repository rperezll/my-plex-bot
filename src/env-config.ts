import { Logger } from './logger';

interface EnvConfig {
  BOT_TOKEN: string;
  PLEX_ON_TIME: string;
  PLEX_OFF_TIME: string;
  TAUTULLI_URL: string;
  TAUTULLI_TOKEN: string;
  LOG_ENABLED: boolean;
}

let cachedEnv: EnvConfig | null = null;

export function getEnvs(): EnvConfig {
  if (cachedEnv) return cachedEnv;

  const requiredVars = [
    'BOT_TOKEN',
    'PLEX_ON_TIME',
    'PLEX_OFF_TIME',
    'TAUTULLI_URL',
    'TAUTULLI_TOKEN',
  ];

  const missing = requiredVars.filter((v) => !process.env[v]);

  if (missing.length) {
    Logger.system(
      `ERROR: Faltan variables de entorno obligatorias: ${missing.join(', ')}.`
    );
    process.exit(1);
  }

  cachedEnv = {
    BOT_TOKEN: process.env.BOT_TOKEN!,
    PLEX_ON_TIME: process.env.PLEX_ON_TIME!,
    PLEX_OFF_TIME: process.env.PLEX_OFF_TIME!,
    TAUTULLI_URL: process.env.TAUTULLI_URL!,
    TAUTULLI_TOKEN: process.env.TAUTULLI_TOKEN!,
    LOG_ENABLED: process.env.LOG_ENABLED === 'true',
  };

  return cachedEnv;
}

type EnvRecord = Record<string, unknown>;

const requiredVariables = [
  'DATABASE_URL',
  'JWT_ACCESS_SECRET',
  'JWT_ACCESS_EXPIRES_IN',
  'JWT_REFRESH_SECRET',
  'JWT_REFRESH_EXPIRES_IN',
  'FRONTEND_ORIGINS',
  'PORT',
] as const;

export function validateEnv(config: EnvRecord): EnvRecord {
  for (const variable of requiredVariables) {
    const value = config[variable];

    if (typeof value !== 'string' || value.trim().length === 0) {
      throw new Error(`Environment variable ${variable} is required.`);
    }
  }

  const parsedPort = Number.parseInt(String(config.PORT), 10);

  if (Number.isNaN(parsedPort) || parsedPort <= 0) {
    throw new Error(
      'Environment variable PORT must be a valid positive number.',
    );
  }

  return config;
}

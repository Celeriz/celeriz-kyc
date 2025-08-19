export interface EnvironmentVariables {
  port: number;
  frontendUrl?: string;
  database: {
    url: string;
  };
  auth: {
    jwtSecret: string;
    jwtExpirationTime: string;
  };
  onramp: {
    ONRAMP_API_KEY: string;
    ONRAMP_API_SECRET: string;
    ONRAMP_API_BASE_URL: string;
  };
}

export default (): EnvironmentVariables => {
  const requiredEnvVars = [
    'DATABASE_URL',
    'JWT_SECRET',
    'ONRAMP_API_KEY',
    'ONRAMP_API_SECRET',
    'ONRAMP_API_BASE_URL',
  ];

  const missingVars = requiredEnvVars.filter((key) => !process.env[key]);

  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingVars.join(', ')}`,
    );
  }

  return {
    port: parseInt(process.env.PORT ?? '8000', 10) || 8000,
    frontendUrl: process.env.FRONTEND_URL,
    database: {
      url: process.env.DATABASE_URL!,
    },
    auth: {
      jwtSecret: process.env.JWT_SECRET!,
      jwtExpirationTime: process.env.JWT_EXPIRATION_TIME || '1d',
    },
    onramp: {
      ONRAMP_API_KEY: process.env.ONRAMP_API_KEY!,
      ONRAMP_API_SECRET: process.env.ONRAMP_API_SECRET!,
      ONRAMP_API_BASE_URL: process.env.ONRAMP_API_BASE_URL!,
    },
  };
};

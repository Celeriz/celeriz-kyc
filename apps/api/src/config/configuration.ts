export interface EnvironmentVariables {
  port: number;
  enviornment?: 'development' | 'production' | 'sandbox';
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
    'ENVIORNMENT',
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

  if (
    !['development', 'production', 'sandbox'].includes(process.env.ENVIORNMENT)
  ) {
    throw new Error(
      `Invalid ENVIORNMENT value: ${process.env.ENVIORNMENT}. Allowed values are 'development', 'production', or 'sandbox'.`,
    );
  }

  if (process.env.ENVIORNMENT === 'sandbox') {
    console.warn(
      'Running in sandbox mode. Ensure this is intended for testing purposes only.',
    );

    if (process.env.ONRAMP_API_BASE_URL !== 'https://api-test.onramp.money') {
      console.warn(
        'ONRAMP_API_BASE_URL is not set to sandbox URL. Ensure this is intended for sandbox testing.',
      );
    }
  }

  return {
    port: parseInt(process.env.PORT ?? '8000', 10) || 8000,
    enviornment: process.env.ENVIORNMENT as
      | 'development'
      | 'production'
      | 'sandbox',
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

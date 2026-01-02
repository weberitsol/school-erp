export const jwtConfig = {
  secret: process.env.JWT_SECRET || 'your-secret-key',
  expiresIn: (process.env.JWT_EXPIRES_IN || '1d') as string,
  refreshSecret: process.env.JWT_REFRESH_SECRET || 'your-refresh-secret',
  refreshExpiresIn: (process.env.JWT_REFRESH_EXPIRES_IN || '7d') as string,
} as const;

export const passwordConfig = {
  saltRounds: 10,
  minLength: 8,
};

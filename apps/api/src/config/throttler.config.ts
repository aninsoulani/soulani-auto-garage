export const getThrottlerConfig = () => {
  const isDev = process.env.NODE_ENV !== 'production';
  const multiplier = isDev ? 100 : 1; // 100x limit in dev mode to prevent lockouts

  return {
    global: { ttl: 60000, limit: 100 * multiplier },
    auth: { ttl: 300000, limit: 5 * multiplier },
    mutate: { ttl: 60000, limit: 20 * multiplier },
  };
};

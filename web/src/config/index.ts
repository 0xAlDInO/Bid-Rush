/**
 * Global Configuration for Bid-Rush Web
 * Centralizes all environment variables, database connection parameters,
 * Solana RPC URLs, and Privy App settings.
 */

// Database Configuration
const DB_USER = process.env.DB_USER || 'postgres';
const DB_PASSWORD = process.env.DB_PASSWORD || 'postgres';
const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_PORT = process.env.DB_PORT || '5432';
const DB_NAME = process.env.DB_NAME || 'bidrush_db';

export const config = {
  // Database settings
  db: {
    user: DB_USER,
    password: DB_PASSWORD,
    host: DB_HOST,
    port: parseInt(DB_PORT, 10),
    name: DB_NAME,
    url:
      process.env.DATABASE_URL ||
      `postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}?schema=public`,
  },

  // Privy Web3 Auth settings
  privy: {
    appId: process.env.NEXT_PUBLIC_PRIVY_APP_ID || '',
    isDummyAppId:
      !process.env.NEXT_PUBLIC_PRIVY_APP_ID ||
      process.env.NEXT_PUBLIC_PRIVY_APP_ID === 'your-privy-app-id',
  },

  // Solana Network & RPC settings
  solana: {
    cluster: process.env.NEXT_PUBLIC_SOLANA_CLUSTER || 'devnet',
    rpcUrl: process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.devnet.solana.com',
  },
} as const;

export default config;

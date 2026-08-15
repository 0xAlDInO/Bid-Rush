-- Schema PostgreSQL pour la base de données Bid-Rush
-- Table des utilisateurs (données nominales)

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    privy_did VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255),
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    wallet_address VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_privy_did ON users(privy_did);
CREATE INDEX IF NOT EXISTS idx_users_wallet_address ON users(wallet_address);

-- Schema PostgreSQL pour la base de données Bid-Rush
-- Assurance des permissions sur le schéma public (PostgreSQL 15+)
CREATE SCHEMA IF NOT EXISTS public;
GRANT ALL ON SCHEMA public TO CURRENT_USER;
GRANT ALL ON SCHEMA public TO PUBLIC;

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

-- Table des retraits (historique des fonds retirés)
CREATE TABLE IF NOT EXISTS withdrawals (
    id SERIAL PRIMARY KEY,
    privy_did VARCHAR(255) NOT NULL,
    recipient_address VARCHAR(255) NOT NULL,
    amount_sol NUMERIC(18, 9) NOT NULL,
    tx_signature VARCHAR(255),
    status VARCHAR(50) DEFAULT 'completed',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_withdrawals_users FOREIGN KEY (privy_did) REFERENCES users(privy_did) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_withdrawals_privy_did ON withdrawals(privy_did);
CREATE INDEX IF NOT EXISTS idx_withdrawals_created_at ON withdrawals(created_at);

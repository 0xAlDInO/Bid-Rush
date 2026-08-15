# Bid-Rush — Web Application

Application web pour la plateforme **Bid-Rush**, construite avec **Next.js** (App Router), **TypeScript**, **Tailwind CSS**, et le gestionnaire de paquets **Bun**.

Cette application intègre la gestion de portefeuilles **Solana (Devnet)** via **Privy** et l'enregistrement des données utilisateurs nominales dans une base de données **PostgreSQL**.

---

## 🛠️ Stack Technique

- **Framework Web :** [Next.js 16](https://nextjs.org/) (App Router `src/app`)
- **Langage :** [TypeScript](https://www.typescriptlang.org/)
- **Gestionnaire de paquets :** [Bun](https://bun.sh/)
- **Styling :** [Tailwind CSS v4](https://tailwindcss.com/)
- **Authentification & Web3 :** [@privy-io/react-auth](https://docs.privy.io/) (Portefeuilles Solana Embedded)
- **Blockchain :** [Solana Web3.js](https://solana-labs.github.io/solana-web3.js/) (Réseau **Devnet**)
- **Base de données :** [PostgreSQL](https://www.postgresql.org/) (Pilote `pg`)
- **Configuration Globale :** `web/src/config/index.ts`

---

## ⚙️ Variables d'Environnement (`.env.local`)

Pour faire fonctionner l'application, créez un fichier `.env.local` à la racine du dossier `web/` (vous pouvez copier `.env.example`) :

```bash
cp .env.example .env.local
```

### Configuration des variables :

```ini
# Privy Configuration
NEXT_PUBLIC_PRIVY_APP_ID=your-privy-app-id

# Database Configuration (PostgreSQL)
DB_USER=postgres
DB_PASSWORD=postgres
DB_HOST=localhost
DB_PORT=5432
DB_NAME=bidrush_db
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/bidrush_db?schema=public

# Solana Network Configuration
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.devnet.solana.com
NEXT_PUBLIC_SOLANA_CLUSTER=devnet
```

---

## 🌐 Fichier de Configuration Global (`web/src/config/index.ts`)

Toutes les variables d'environnement, URLs de RPC et paramètres de base de données sont centralisés et exportés dans le module global `web/src/config/index.ts` :

```typescript
import { config } from '@/config';

// Exemples d'utilisation :
config.db.url         // URL de connexion PostgreSQL
config.privy.appId    // App ID Privy
config.solana.rpcUrl  // URL du RPC Solana Devnet
```

---

## 🗄️ Base de Données (PostgreSQL)

L'application enregistre les identités nominales des utilisateurs associés à leur identifiant unique Privy et à leur portefeuille Solana.

### Schéma de la table `users`

Le script SQL d'initialisation se trouve sous `database/schema.sql` :

```sql
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
```

---

## 🚀 Installation & Démarrage

### 1. Installer les dépendances avec Bun

```bash
cd web
bun install
```

### 2. Configurer la base de données PostgreSQL

Exécutez le schéma SQL d'initialisation :

```bash
psql -U postgres -d bidrush_db -f ../database/schema.sql
```

### 3. Lancer le serveur de développement

```bash
bun run dev
```

L'application sera accessible sur [http://localhost:3000](http://localhost:3000).

### 4. Compiler pour la production

```bash
bun run build
bun run start
```

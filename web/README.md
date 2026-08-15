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

---

## ⚙️ Variables d'Environnement (`.env.local`)

Pour faire fonctionner l'application en local ou en production, créez un fichier `.env.local` à la racine du dossier `web/` (vous pouvez copier `.env.example`) :

```bash
cp .env.example .env.local
```

### Variables requises :

| Variable | Description | Exemple / Valeur par défaut |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_PRIVY_APP_ID` | Clé d'application publique obtenue sur le [Dashboard Privy](https://dashboard.privy.io/) | `clp0000000000000000000000` |
| `DATABASE_URL` | Chaîne de connexion à votre base de données PostgreSQL | `postgresql://postgres:postgres@localhost:5432/bidrush_db?schema=public` |

---

## 🗄️ Base de Données (PostgreSQL)

L'application enregistre les identités nominales des utilisateurs associés à leur identifiant unique Privy et à leur portefeuille Solana.

### Schéma de la table `users`

Le script d'initialisation SQL se trouve dans le dossier principal du projet sous `database/schema.sql` :

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

À la racine du dossier `web/` :

```bash
bun install
```

### 2. Configurer la base de données PostgreSQL

Assurez-vous d'avoir une instance PostgreSQL en cours d'exécution et exécutez le schéma :

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

---

## 🔑 Fonctionnalités Principales

1. **Connexion Multi-méthode (Privy) :** Connexion via Email, Google, Twitter, Discord, Apple, SMS ou portefeuilles Solana externes (Phantom, Solflare).
2. **Embedded Wallet Solana :** Génération automatique d'un portefeuille sécurisé Solana sans gestion manuelle de seed phrase.
3. **Affichage des Fonds Devnet :** Interrogation en temps réel du solde en SOL de l'utilisateur sur le réseau **Solana Devnet**.
4. **Gestion de Profil Nominal :** Enregistrement et mise à jour des données utilisateur (Prénom, Nom, Email, Wallet) via l'API Next.js `/api/user` reliée à PostgreSQL.

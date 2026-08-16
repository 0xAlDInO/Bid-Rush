# Bid-Rush — Smart Contract Solana (Anchor)

Ce dossier contient le contrat intelligent (Smart Contract) Solana de la plateforme **Bid-Rush**, développé avec le framework **Anchor** en **Rust**.

---

## 🛠️ Structure du Projet

```
contract/
├── Anchor.toml               # Configuration Anchor (Cluster Devnet/Localnet)
├── Cargo.toml                # Configuration du workspace Rust
├── package.json              # Script de tests TypeScript
├── programs/
│   └── bid_rush/
│       ├── Cargo.toml        # Dépendances du programme Rust (anchor-lang)
│       └── src/
│           └── lib.rs        # Code source du Smart Contract Rust Anchor
└── tests/
    └── bid_rush.ts           # Tests d'intégration Anchor en TypeScript
```

---

## 🚀 Compilation & Déploiement

### 1. Compiler le programme Rust
```bash
anchor build
```

### 2. Lancer les tests TypeScript
```bash
bun install
anchor test
```

### 3. Déployer sur Solana Devnet
```bash
solana config set --url devnet
anchor deploy
```

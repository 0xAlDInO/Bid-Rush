# Bid-Rush — Smart Contract Solana (Anchor)

Ce dossier contient le contrat intelligent (Smart Contract) Solana de la plateforme **Bid-Rush**, développé avec le framework **Anchor** en **Rust**.

---

## 🛠️ Structure du Projet

```
contract/
├── Anchor.toml               # Configuration Anchor (Cluster Devnet/Localnet)
├── Cargo.toml                # Configuration du workspace Rust
├── .gitignore                # Fichiers ignorés (target, Cargo.lock, node_modules)
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

## ⚙️ Prérequis

Pour compiler et déployer le contrat Anchor sur Solana :

1. **Rust :** [https://rustup.rs/](https://rustup.rs/) (`rustc 1.79.0`)
2. **Solana CLI :** [https://docs.solana.com/cli/install-solana-cli-tools](https://docs.solana.com/cli/install-solana-cli-tools) (`solana-cli 1.18.x`)
3. **Anchor CLI :** [https://www.anchor-lang.com/docs/installation](https://www.anchor-lang.com/docs/installation) (`anchor-cli 0.30.1`)

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

---

## 💡 Résolution des Problèmes Courants (Dépannage)

### 1. Erreur : `feature edition2024 is required` / `failed to download zeroize_derive v1.5.0` ou `block-buffer v0.12.1`
Cette erreur se produit lorsque Cargo télécharge automatiquement les toutes dernières versions de sous-dépendances (`zeroize_derive v1.5.0` ou `block-buffer v0.12.1`) qui ont migré vers l'édition Rust 2024 (non encore stabilisée dans le compilateur Rust/SBF 1.79).

**Solution :**
Exécutez la commande suivante dans le dossier `contract/` pour forcer Cargo à bloquer ces dépendances sur les versions v1.4.2 et v0.10.5 compatibles avec l'édition Rust 2021 :

```bash
cd contract
cargo update -p zeroize_derive --precise 1.4.2
cargo update -p block-buffer --precise 0.10.5
anchor build
```

---

### 2. Erreur : `error: failed to parse lock file at: Cargo.lock` (lock file version 4 requires `-Znext-lockfile-bump`)
Si vous obtenez cette erreur lors d'un `anchor build`, c'est parce qu'un fichier `Cargo.lock` a été généré par une version plus récente de Rust (`rustc 1.84+` ou `1.97+`) qui utilise le format v4 non supporté par le compilateur Solana SBF.

**Solution :**
Supprimez le fichier `Cargo.lock` temporaire avant de lancer la compilation Anchor :
```bash
rm -f Cargo.lock
anchor build
```
*(Le fichier `.gitignore` du dossier `contract/` ignore déjà `Cargo.lock` pour éviter de versionner un lockfile incompatible).*

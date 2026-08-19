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

1. **Rust :** [https://rustup.rs/](https://rustup.rs/) (`rustc 1.79.0` recommandé pour Solana 1.18.x)
2. **Solana CLI :** [https://docs.solana.com/cli/install-solana-cli-tools](https://docs.solana.com/cli/install-solana-cli-tools) (`solana-cli 1.18.x`)
3. **Anchor CLI :** [https://www.anchor-lang.com/docs/installation](https://www.anchor-lang.com/docs/installation) (`anchor-cli 0.30.1`)

---

## 🚀 Compilation & Déploiement

### 1. Ajuster les versions de dépendances (si vous êtes sur Rust 1.79)
```bash
cd contract
cargo update -p block-buffer --precise 0.10.5
cargo update -p zeroize_derive --precise 1.4.2
```

### 2. Compiler le programme Rust
```bash
anchor build
```

### 3. Lancer les tests TypeScript
```bash
bun install
anchor test
```

### 4. Déployer sur Solana Devnet
```bash
solana config set --url devnet
anchor deploy
```

---

## 💡 Résolution des Problèmes Courants (Dépannage)

### 1. Erreur : `feature edition2024 is required` / `failed to download zeroize_derive v1.5.0` ou `block-buffer v0.12.1`
Cette erreur se produit lorsque Cargo télécharge les toutes dernières versions de sous-dépendances (`zeroize_derive v1.5.0` ou `block-buffer v0.12.1`) qui ont migré vers l'édition Rust 2024.

**Solution :**
Exécutez ces deux commandes dans le dossier `contract/` pour verrouiller ces packages sur leurs versions v2021 :
```bash
cd contract
cargo update -p block-buffer --precise 0.10.5
cargo update -p zeroize_derive --precise 1.4.2
anchor build
```

---

### 2. Erreur : `error: failed to parse lock file at: Cargo.lock` (lock file version 4 requires `-Znext-lockfile-bump`)
Si un fichier `Cargo.lock` a été généré par une version de Rust plus récente (`rustc 1.84+`), supprimez-le simplement avant de compiler avec Anchor :
```bash
rm -f Cargo.lock
anchor build
```
*(Le fichier `.gitignore` du dossier `contract/` ignore déjà `Cargo.lock` pour éviter de versionner un lockfile incompatible).*

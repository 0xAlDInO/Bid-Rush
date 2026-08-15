'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { usePrivy, useWallets, useCreateWallet } from '@privy-io/react-auth';
import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { config } from '@/config';

function Dashboard() {
  const { authenticated, user, logout } = usePrivy();
  const { wallets } = useWallets();
  const { createWallet } = useCreateWallet();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [savedUser, setSavedUser] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [solBalance, setSolBalance] = useState<number | null>(null);
  const [loadingBalance, setLoadingBalance] = useState(false);
  const [creating, setCreating] = useState(false);

  // Strictly identify Solana wallet (base58 format, non 0x address)
  const isSolanaAddress = (addr: string | undefined): boolean => {
    if (!addr) return false;
    return !addr.startsWith('0x') && addr.length >= 32 && addr.length <= 44;
  };

  const solanaWallet = wallets?.find(
    (w) => (w.walletClientType === 'solana' || (w as any).chainType === 'solana') && isSolanaAddress(w.address)
  ) || (user?.wallet && isSolanaAddress(user.wallet.address) ? user.wallet : null);

  const walletAddress = solanaWallet?.address;

  // Explicit Solana Wallet Creation
  const handleCreateSolanaWallet = async () => {
    setCreating(true);
    try {
      await createWallet();
    } catch (err) {
      console.error('Erreur création wallet Solana:', err);
    } finally {
      setCreating(false);
    }
  };

  // Fetch Solana Devnet Balance using global RPC URL
  const fetchBalance = useCallback(async (address: string) => {
    if (!isSolanaAddress(address)) return;
    setLoadingBalance(true);
    try {
      const connection = new Connection(config.solana.rpcUrl, 'confirmed');
      const pubKey = new PublicKey(address);
      const balanceLamports = await connection.getBalance(pubKey);
      setSolBalance(balanceLamports / LAMPORTS_PER_SOL);
    } catch (err) {
      console.error('Erreur récupération solde Solana:', err);
      setSolBalance(0);
    } finally {
      setLoadingBalance(false);
    }
  }, []);

  // Sync profile & DB
  useEffect(() => {
    if (authenticated && user) {
      if (user.email?.address) {
        setEmail(user.email.address);
      }

      // Fetch user info from database
      fetch(`/api/user?privyDid=${encodeURIComponent(user.id)}`)
        .then((res) => res.json())
        .then((data) => {
          if (data?.user) {
            setSavedUser(data.user);
            setFirstName(data.user.first_name || '');
            setLastName(data.user.last_name || '');
          }
        })
        .catch(console.error);
    }
  }, [authenticated, user]);

  useEffect(() => {
    if (walletAddress) {
      fetchBalance(walletAddress);
    }
  }, [walletAddress, fetchBalance]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    try {
      const res = await fetch('/api/user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          privyDid: user.id,
          email: email || user.email?.address,
          firstName,
          lastName,
          walletAddress: walletAddress || null,
        }),
      });
      const data = await res.json();
      if (data.user) {
        setSavedUser(data.user);
      }
      alert('Profil enregistré dans la base de données !');
    } catch (err) {
      console.error(err);
      alert("Erreur lors de l'enregistrement.");
    } finally {
      setSaving(false);
    }
  };

  if (!authenticated || !user) {
    return null;
  }

  return (
    <div className="grid md:grid-cols-2 gap-8">
      {/* Carte Portefeuille & Solde */}
      <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-slate-100">Portefeuille Solana</h2>
            <span className="px-2.5 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-semibold uppercase rounded-full">
              Solana {config.solana.cluster}
            </span>
          </div>

          {walletAddress ? (
            <div className="space-y-4">
              <div>
                <label className="text-xs uppercase tracking-wider text-slate-500 font-semibold">
                  Adresse du Wallet Solana (Base58)
                </label>
                <div className="mt-1 p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-indigo-300 break-all">
                  {walletAddress}
                </div>
              </div>

              <div className="p-4 bg-gradient-to-br from-indigo-950/40 to-slate-950 border border-indigo-900/40 rounded-xl">
                <label className="text-xs uppercase tracking-wider text-slate-400 font-semibold">
                  Solde disponible
                </label>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-white">
                    {loadingBalance ? '...' : solBalance !== null ? solBalance.toFixed(4) : '0.0000'}
                  </span>
                  <span className="text-indigo-400 font-bold">SOL</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-slate-400 text-sm mb-4">
                Aucun portefeuille Solana associé pour le moment.
              </p>
              <button
                onClick={handleCreateSolanaWallet}
                disabled={creating}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition disabled:opacity-50"
              >
                {creating ? 'Génération...' : 'Générer mon Portefeuille Solana'}
              </button>
            </div>
          )}
        </div>

        {walletAddress && (
          <div className="mt-6 pt-4 border-t border-slate-800 flex justify-between items-center text-xs">
            <button
              onClick={() => fetchBalance(walletAddress)}
              className="text-indigo-400 hover:underline font-medium"
            >
              🔄 Rafraîchir le solde
            </button>
            <a
              href={`https://explorer.solana.com/address/${walletAddress}?cluster=${config.solana.cluster}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-400 hover:text-slate-200 underline"
            >
              Voir sur Solana Explorer ↗
            </a>
          </div>
        )}
      </section>

      {/* Formulaire de Données Nominales */}
      <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <h2 className="text-xl font-bold mb-1 text-slate-100">Base de données Nominale</h2>
        <p className="text-xs text-slate-400 mb-6">
          Enregistrez vos informations personnelles liées à votre identité Privy et votre portefeuille dans la base PostgreSQL.
        </p>

        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">
              ID Unique Privy (DID)
            </label>
            <input
              type="text"
              disabled
              value={user.id}
              className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-slate-400 cursor-not-allowed"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                Prénom
              </label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Jean"
                className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                Nom
              </label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Dupont"
                className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">
              Adresse Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="jean.dupont@example.com"
              className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg transition disabled:opacity-50"
          >
            {saving ? 'Enregistrement...' : 'Sauvegarder dans la DB Nominale'}
          </button>
        </form>

        {savedUser && (
          <div className="mt-6 p-3 bg-emerald-950/30 border border-emerald-900/50 rounded-lg text-xs text-emerald-400">
            ✓ Profil sauvegardé dans la table <code>users</code> !
          </div>
        )}
      </section>
    </div>
  );
}

export default function Home() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl font-medium animate-pulse text-indigo-400">
          Chargement...
        </div>
      </div>
    );
  }

  if (config.privy.isDummyAppId) {
    return (
      <main className="max-w-4xl mx-auto px-4 py-12">
        <header className="flex justify-between items-center mb-12 pb-6 border-b border-slate-800">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
              Bid-Rush Web3
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Gestion de portefeuille Solana avec Privy & Postgres
            </p>
          </div>
        </header>

        <section className="bg-slate-900/60 border border-slate-800 rounded-2xl p-8 text-center backdrop-blur-sm">
          <div className="inline-flex p-3 bg-amber-500/10 text-amber-400 rounded-full mb-4">
            ⚠️ Configuration Privy Requise
          </div>
          <h2 className="text-2xl font-bold mb-4">Privy App ID non configuré</h2>
          <p className="text-slate-400 max-w-lg mx-auto mb-6">
            Pour activer la connexion et la génération de portefeuilles Solana, veuillez renseigner votre <code className="text-indigo-300">NEXT_PUBLIC_PRIVY_APP_ID</code> dans le fichier <code className="text-indigo-300">web/.env.local</code>.
          </p>
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-slate-300 max-w-md mx-auto text-left">
            NEXT_PUBLIC_PRIVY_APP_ID=votre_app_id_privy
          </div>
        </section>
      </main>
    );
  }

  return <HomeContent />;
}

function HomeContent() {
  const { ready, authenticated, login, logout } = usePrivy();

  if (!ready) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl font-medium animate-pulse text-indigo-400">
          Chargement de Privy...
        </div>
      </div>
    );
  }

  return (
    <main className="max-w-4xl mx-auto px-4 py-12">
      <header className="flex justify-between items-center mb-12 pb-6 border-b border-slate-800">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
            Bid-Rush Web3
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Gestion de portefeuille Solana avec Privy & Postgres
          </p>
        </div>
        {authenticated ? (
          <button
            onClick={logout}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium rounded-lg transition"
          >
            Se déconnecter
          </button>
        ) : (
          <button
            onClick={login}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg shadow-lg shadow-indigo-500/20 transition"
          >
            Se connecter / S'inscrire
          </button>
        )}
      </header>

      {!authenticated ? (
        <section className="bg-slate-900/60 border border-slate-800 rounded-2xl p-8 text-center backdrop-blur-sm">
          <h2 className="text-2xl font-bold mb-4">Bienvenue sur Bid-Rush</h2>
          <p className="text-slate-400 max-w-lg mx-auto mb-8">
            Connectez-vous pour générer votre portefeuille Solana sécurisé via Privy (email, Google, Twitter, SMS ou Wallet) et accéder à vos fonds sur le réseau Solana {config.solana.cluster}.
          </p>
          <button
            onClick={login}
            className="px-8 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold rounded-xl shadow-xl transition transform hover:-translate-y-0.5"
          >
            Créer / Connecter mon portefeuille
          </button>
        </section>
      ) : (
        <Dashboard />
      )}
    </main>
  );
}

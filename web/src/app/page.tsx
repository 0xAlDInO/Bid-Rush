'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { usePrivy, useWallets as useEvmWallets, useCreateWallet } from '@privy-io/react-auth';
import { useWallets as useSolanaWallets, useSignTransaction } from '@privy-io/react-auth/solana';
import {
  Connection,
  PublicKey,
  LAMPORTS_PER_SOL,
  Transaction,
  SystemProgram,
} from '@solana/web3.js';
import { config } from '@/config';

interface Withdrawal {
  id: number;
  recipient_address: string;
  amount_sol: string | number;
  tx_signature: string | null;
  created_at: string;
}

function Dashboard() {
  const { authenticated, user } = usePrivy();
  const { wallets: evmWallets } = useEvmWallets();
  const { wallets: solanaWallets } = useSolanaWallets();
  const { createWallet } = useCreateWallet();
  const { signTransaction } = useSignTransaction();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [userIdInDb, setUserIdInDb] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');

  const [solBalance, setSolBalance] = useState<number | null>(null);
  const [loadingBalance, setLoadingBalance] = useState(false);
  const [creating, setCreating] = useState(false);
  const [requestingAirdrop, setRequestingAirdrop] = useState(false);
  const [airdropMsg, setAirdropMsg] = useState<string | null>(null);

  // Withdrawal form states
  const [recipientAddress, setRecipientAddress] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawing, setWithdrawing] = useState(false);
  const [withdrawMessage, setWithdrawMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [withdrawalsList, setWithdrawalsList] = useState<Withdrawal[]>([]);

  // Strictly identify Solana wallet (base58 format, non 0x address)
  const isSolanaAddress = (addr: string | undefined): boolean => {
    if (!addr) return false;
    return !addr.startsWith('0x') && addr.length >= 32 && addr.length <= 44;
  };

  const activeSolanaWallet =
    solanaWallets?.find((w) => isSolanaAddress(w.address)) ||
    evmWallets?.find(
      (w) =>
        (w.walletClientType === 'solana' || (w as any).chainType === 'solana') &&
        isSolanaAddress(w.address)
    ) || (user?.wallet && isSolanaAddress(user.wallet.address) ? user.wallet : null);

  const walletAddress = activeSolanaWallet?.address;

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

  // Request Devnet SOL Airdrop
  const handleRequestAirdrop = async () => {
    if (!walletAddress) return;
    setRequestingAirdrop(true);
    setAirdropMsg(null);
    try {
      const connection = new Connection(config.solana.rpcUrl, 'confirmed');
      const pubKey = new PublicKey(walletAddress);
      const signature = await connection.requestAirdrop(pubKey, 1 * LAMPORTS_PER_SOL);

      // Poll for transaction confirmation over HTTP (bypassing WebSocket failures)
      let confirmed = false;
      for (let i = 0; i < 30; i++) {
        await new Promise((r) => setTimeout(r, 1000));
        const status = await connection.getSignatureStatus(signature);
        if (status?.value?.confirmationStatus === 'confirmed' || status?.value?.confirmationStatus === 'finalized') {
          confirmed = true;
          break;
        }
      }

      if (confirmed) {
        setAirdropMsg('✓ 1 SOL gratuit a été crédité sur votre portefeuille Devnet !');
      } else {
        setAirdropMsg('✓ Airdrop envoyé ! Mise à jour du solde en cours...');
      }
      fetchBalance(walletAddress);
    } catch (err: any) {
      console.error('Airdrop error:', err);
      setAirdropMsg('⚠️ Limite d\'airdrop atteinte ou réseau occupé. Veuillez réessayer dans quelques instants.');
    } finally {
      setRequestingAirdrop(false);
    }
  };

  // Fetch Withdrawals History
  const fetchWithdrawalsHistory = useCallback(async (privyDid: string) => {
    try {
      const res = await fetch(`/api/withdraw?privyDid=${encodeURIComponent(privyDid)}`);
      const data = await res.json();
      if (data?.withdrawals) {
        setWithdrawalsList(data.withdrawals);
      }
    } catch (err) {
      console.error('Erreur historique retraits:', err);
    }
  }, []);

  // 1. Auto-register user in DB immediately upon login & Sync user data
  useEffect(() => {
    if (authenticated && user) {
      // Extract user email from Privy user or linked accounts
      const autoEmail =
        user.email?.address ||
        (user as any).google?.email ||
        (user as any).apple?.email ||
        (user.linkedAccounts?.find((acc: any) => acc.type === 'email' && acc.address) as any)?.address ||
        (user.linkedAccounts?.find((acc: any) => acc.email) as any)?.email ||
        '';

      if (autoEmail) {
        setEmail(autoEmail);
      }

      // Auto-save or fetch user in DB
      fetch('/api/user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          privyDid: user.id,
          email: autoEmail || null,
          firstName: null,
          lastName: null,
          walletAddress: walletAddress || null,
        }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data?.user) {
            setUserIdInDb(data.user.id);
            if (data.user.first_name) setFirstName(data.user.first_name);
            if (data.user.last_name) setLastName(data.user.last_name);
            if (data.user.email) setEmail(data.user.email);
          }
        })
        .catch(console.error);

      // Fetch withdrawal history
      fetchWithdrawalsHistory(user.id);
    }
  }, [authenticated, user, walletAddress, fetchWithdrawalsHistory]);

  useEffect(() => {
    if (walletAddress) {
      fetchBalance(walletAddress);
    }
  }, [walletAddress, fetchBalance]);

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

  // Save/Update user profile
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    setSaveSuccessMsg('');
    try {
      const autoEmail =
        email ||
        user.email?.address ||
        (user as any).google?.email ||
        (user.linkedAccounts?.find((acc: any) => acc.email) as any)?.email;

      const res = await fetch('/api/user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          privyDid: user.id,
          email: autoEmail || null,
          firstName,
          lastName,
          walletAddress: walletAddress || null,
        }),
      });
      const data = await res.json();
      if (data?.user) {
        setUserIdInDb(data.user.id);
        setSaveSuccessMsg('Profil mis à jour avec succès !');
        setTimeout(() => setSaveSuccessMsg(''), 4000);
      }
    } catch (err) {
      console.error(err);
      alert('Erreur lors de la mise à jour du profil.');
    } finally {
      setSaving(false);
    }
  };

  // Process SOL Withdrawal via HTTP broadcast to prevent WebSocket connection errors
  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    setWithdrawMessage(null);

    if (!activeSolanaWallet || !walletAddress) {
      setWithdrawMessage({ type: 'error', text: 'Aucun portefeuille Solana disponible pour le retrait.' });
      return;
    }

    // Address validation
    const recipientTrimmed = recipientAddress.trim();
    if (!recipientTrimmed || !isSolanaAddress(recipientTrimmed)) {
      setWithdrawMessage({ type: 'error', text: 'Veuillez saisir une adresse Solana destinataire valide.' });
      return;
    }

    // Amount validation
    const amountNum = parseFloat(withdrawAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setWithdrawMessage({ type: 'error', text: 'Veuillez saisir un montant supérieur à 0.' });
      return;
    }

    if (solBalance !== null && amountNum > solBalance) {
      setWithdrawMessage({ type: 'error', text: 'Solde insuffisant pour effectuer ce retrait.' });
      return;
    }

    setWithdrawing(true);

    try {
      const connection = new Connection(config.solana.rpcUrl, 'confirmed');
      const fromPubKey = new PublicKey(walletAddress);
      const toPubKey = new PublicKey(recipientTrimmed);

      const lamports = Math.floor(amountNum * LAMPORTS_PER_SOL);

      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: fromPubKey,
          toPubkey: toPubKey,
          lamports,
        })
      );

      const { blockhash } = await connection.getLatestBlockhash('confirmed');
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = fromPubKey;

      let txSig = '';
      const targetChain = config.solana.cluster === 'devnet' ? 'solana:devnet' : 'solana:mainnet';

      // 1. Sign transaction using Privy
      let signedBytes: Uint8Array | null = null;

      if (solanaWallets && solanaWallets.length > 0) {
        const serialized = transaction.serialize({ requireAllSignatures: false, verifySignatures: false });
        const solWallet = solanaWallets.find((w) => w.address === walletAddress) || solanaWallets[0];
        const res = await signTransaction({
          transaction: serialized,
          wallet: solWallet,
          chain: targetChain,
        });
        signedBytes = res.signedTransaction;
      } else if ('sendTransaction' in activeSolanaWallet && typeof (activeSolanaWallet as any).sendTransaction === 'function') {
        const result = await (activeSolanaWallet as any).sendTransaction(transaction, connection);
        txSig = typeof result === 'string' ? result : result?.signature || '';
      }

      // 2. Broadcast via HTTP RPC if signed bytes are available
      if (signedBytes && !txSig) {
        txSig = await connection.sendRawTransaction(signedBytes, {
          skipPreflight: false,
          preflightCommitment: 'confirmed',
        });
      }

      // 3. Poll for transaction confirmation using HTTP (avoids WebSocket CORS/WSS errors)
      if (txSig) {
        for (let i = 0; i < 20; i++) {
          await new Promise((r) => setTimeout(r, 1000));
          const status = await connection.getSignatureStatus(txSig);
          if (status?.value?.confirmationStatus === 'confirmed' || status?.value?.confirmationStatus === 'finalized') {
            break;
          }
        }
      }

      // Save transaction to DB
      await fetch('/api/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          privyDid: user?.id,
          recipientAddress: recipientTrimmed,
          amountSol: amountNum,
          txSignature: txSig || null,
        }),
      });

      setWithdrawMessage({
        type: 'success',
        text: `Retrait de ${amountNum} SOL effectué avec succès !`,
      });

      // Reset form
      setWithdrawAmount('');
      setRecipientAddress('');

      // Refresh balance and history
      fetchBalance(walletAddress);
      if (user) fetchWithdrawalsHistory(user.id);
    } catch (err: any) {
      console.error('Erreur lors du retrait:', err);
      const errStr = String(err?.message || err);
      if (errStr.includes('Attempt to debit an account') || errStr.includes('no record of a prior credit')) {
        setWithdrawMessage({
          type: 'error',
          text: 'Votre portefeuille a un solde de 0 SOL sur Devnet. Cliquez sur "Obtenir 1 SOL (Devnet)" ci-dessus pour le créditer gratuitement avant de tester le retrait.',
        });
      } else {
        setWithdrawMessage({
          type: 'error',
          text: err?.message || 'Le retrait a échoué. Veuillez vérifier les détails et réessayer.',
        });
      }
    } finally {
      setWithdrawing(false);
    }
  };

  if (!authenticated || !user) {
    return null;
  }

  return (
    <div className="space-y-8">
      {/* Ligne Haut: Portefeuille & Profil DB */}
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
                  <div className="flex justify-between items-baseline">
                    <label className="text-xs uppercase tracking-wider text-slate-400 font-semibold">
                      Solde disponible
                    </label>
                    <button
                      onClick={handleRequestAirdrop}
                      disabled={requestingAirdrop}
                      className="text-xs bg-indigo-600/80 hover:bg-indigo-500 text-white font-medium px-2.5 py-1 rounded-lg transition disabled:opacity-50"
                    >
                      {requestingAirdrop ? 'Crédit...' : 'Obtenir 1 SOL (Devnet)'}
                    </button>
                  </div>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-3xl font-extrabold text-white">
                      {loadingBalance ? '...' : solBalance !== null ? solBalance.toFixed(4) : '0.0000'}
                    </span>
                    <span className="text-indigo-400 font-bold">SOL</span>
                  </div>
                  {airdropMsg && (
                    <p className="mt-2 text-xs text-indigo-300 bg-indigo-950/50 p-2 rounded-lg">
                      {airdropMsg}
                    </p>
                  )}
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
            </div>
          )}
        </section>

        {/* Formulaire de Profil Utilisateur (Enregistrement immédiat dans la DB) */}
        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <div className="flex justify-between items-start mb-2">
            <div>
              <h2 className="text-xl font-bold text-slate-100">Profil Utilisateur</h2>
              <p className="text-xs text-slate-400">
                Vos données sont enregistrées automatiquement en base de données dès la connexion.
              </p>
            </div>
            {userIdInDb && (
              <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-mono font-semibold rounded-full">
                ID DB: #{userIdInDb}
              </span>
            )}
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-4 mt-4">
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
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg transition disabled:opacity-50 text-sm"
            >
              {saving ? 'Mise à jour...' : 'Mettre à jour mes informations'}
            </button>
          </form>

          {saveSuccessMsg && (
            <div className="mt-4 p-3 bg-emerald-950/30 border border-emerald-900/50 rounded-lg text-xs text-emerald-400">
              ✓ {saveSuccessMsg}
            </div>
          )}
        </section>
      </div>

      {/* Ligne Bas: Module de Retrait de Fonds */}
      <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <h2 className="text-xl font-bold text-slate-100 mb-1">Retirer des Fonds (SOL)</h2>
        <p className="text-xs text-slate-400 mb-6">
          Transférez vos jetons SOL vers une autre adresse Solana de votre choix en toute simplicité.
        </p>

        <form onSubmit={handleWithdraw} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">
              Adresse à créditer (Adresse Solana destinataire)
            </label>
            <input
              type="text"
              value={recipientAddress}
              onChange={(e) => setRecipientAddress(e.target.value)}
              placeholder="Ex: 7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU"
              className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-sm font-mono text-slate-100 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">
              Montant à retirer (SOL)
            </label>
            <div className="relative">
              <input
                type="number"
                step="any"
                min="0"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                placeholder="0.1"
                className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-sm font-mono text-slate-100 focus:outline-none focus:border-indigo-500"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-indigo-400">
                SOL
              </span>
            </div>
          </div>

          <button
            type="submit"
            disabled={withdrawing || !walletAddress}
            className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold rounded-xl shadow-lg transition disabled:opacity-50"
          >
            {withdrawing ? 'Transfert en cours...' : 'Retirer'}
          </button>
        </form>

        {withdrawMessage && (
          <div
            className={`mt-4 p-4 rounded-xl border text-sm font-medium ${
              withdrawMessage.type === 'success'
                ? 'bg-emerald-950/40 border-emerald-800 text-emerald-300'
                : 'bg-rose-950/40 border-rose-800 text-rose-300'
            }`}
          >
            {withdrawMessage.text}
          </div>
        )}

        {/* Historique des Retraits */}
        {withdrawalsList.length > 0 && (
          <div className="mt-8 pt-6 border-t border-slate-800">
            <h3 className="text-sm font-bold text-slate-300 mb-3">Historique Récent des Retraits</h3>
            <div className="space-y-2">
              {withdrawalsList.map((w) => (
                <div
                  key={w.id}
                  className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex justify-between items-center text-xs"
                >
                  <div>
                    <span className="font-semibold text-slate-200">
                      -{w.amount_sol} SOL
                    </span>
                    <span className="text-slate-500 ml-2">→ {w.recipient_address.slice(0, 8)}...{w.recipient_address.slice(-6)}</span>
                  </div>
                  <span className="text-slate-500">
                    {new Date(w.created_at).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
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

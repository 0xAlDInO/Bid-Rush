'use client';

import React from 'react';
import { PrivyProvider } from '@privy-io/react-auth';
import { toSolanaWalletConnectors, defaultSolanaRpcsPlugin } from '@privy-io/react-auth/solana';
import { config } from '@/config';

const solanaConnectors = toSolanaWalletConnectors({
  shouldAutoConnect: true,
});

export default function Providers({ children }: { children: React.ReactNode }) {
  if (config.privy.isDummyAppId) {
    return <div key="dummy-providers-wrapper">{children}</div>;
  }

  return (
    <PrivyProvider
      appId={config.privy.appId}
      config={{
        appearance: {
          theme: 'dark',
          accentColor: '#676FFF',
          showWalletLoginFirst: true,
          walletList: ['phantom', 'solflare', 'backpack'],
          walletChainType: 'solana-only',
        },
        plugins: [defaultSolanaRpcsPlugin()],
        loginMethods: ['email', 'wallet', 'google', 'twitter', 'discord', 'apple', 'sms'],
        embeddedWallets: {
          ethereum: {
            createOnLogin: 'off',
          },
          solana: {
            createOnLogin: 'users-without-wallets',
          },
        },
        externalWallets: {
          solana: {
            connectors: solanaConnectors,
          },
        },
      }}
    >
      <div key="privy-providers-wrapper">{children}</div>
    </PrivyProvider>
  );
}

import Providers from '@/components/Providers';
import './globals.css';

export const metadata = {
  title: 'Bid-Rush Web',
  description: 'Bid-Rush Platform with Privy Solana Embedded Wallets',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body className="bg-slate-950 text-slate-100 min-h-screen antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

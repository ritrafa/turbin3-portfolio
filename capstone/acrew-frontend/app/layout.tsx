import { WalletProviderWrapper } from './components/WalletProviderWrapper'
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './globals.css'

export const metadata = {
  title: 'ACREW - Decentralized Savings',
  description: 'ACREW is a decentralized savings plan platform built on Solana.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <WalletProviderWrapper>
          {children}
        </WalletProviderWrapper>
        <ToastContainer position="bottom-right" autoClose={5000} />
      </body>
    </html>
  )
}
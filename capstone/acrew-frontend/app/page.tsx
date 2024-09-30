import React from 'react';
import Layout from './components/Layout';

export default function Home() {
  return (
    <Layout>
      <h1>Welcome to ACREW</h1>
      <p>ACREW is a decentralized savings plan platform built on Solana.</p>
      <ul>
        <li>Create custom savings plans</li>
        <li>Deposit funds securely</li>
        <li>Earn rewards for completing your savings goals</li>
        <li>Withdraw funds when your plan matures</li>
      </ul>
      <p>Connect your wallet to get started!</p>
    </Layout>
  );
}
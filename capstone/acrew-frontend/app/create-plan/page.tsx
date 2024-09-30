'use client';

import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { createSavingsPlan } from '../utils/solana';
import Layout from '../components/Layout';
import { toast } from 'react-toastify';

export default function CreatePlan() {
  const { publicKey, wallet, connected } = useWallet();
  const [name, setName] = useState('');
  const [duration, setDuration] = useState('');
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!connected) {
      toast.error('Please connect your wallet to create a savings plan.');
    }
  }, [connected]);

  const handleSubmit = async (e: React.FormEvent) => {

    e.preventDefault();
    if (!connected || !publicKey || !wallet) {
      toast.error('Please connect your wallet first.');
      return;
    }

    setIsLoading(true);

    try {
      const durationInSeconds = parseFloat(duration) * 24 * 60 * 60; // Convert days to seconds
      const amountInSOL = parseFloat(amount);
      const startTime = Math.floor(Date.now() / 1000) + 60; // Start 1 minute from now

      const tx = await createSavingsPlan(
        wallet,
        publicKey,
        name,
        startTime,
        durationInSeconds,
        amountInSOL
      );

      toast.success(`Savings plan created successfully! Transaction signature: ${tx}`);
      // Reset form
      setName('');
      setDuration('');
      setAmount('');
    } catch (err: unknown) {
        if (err instanceof Error) {
          toast.error(`Failed to create savings plan: ${err.message}`);
        } else {
          toast.error('Failed to create savings plan: An unknown error occurred');
        }
        console.error('Error creating savings plan:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      <h1 className="text-3xl font-bold mb-6">Create a Savings Plan</h1>

      <form onSubmit={handleSubmit} className="max-w-md mt-6">
      <div className="mb-4">
          <label htmlFor="name" className="block mb-2">Plan Name:</label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full p-2 border rounded"
            disabled={!publicKey || isLoading}
          />
        </div>
        <div className="mb-4">
          <label htmlFor="duration" className="block mb-2">Duration (in days):</label>
          <input
            type="number"
            id="duration"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            required
            min="0.01"
            step="0.01"
            className="w-full p-2 border rounded"
            disabled={!publicKey || isLoading}
          />
        </div>
        <div className="mb-4">
          <label htmlFor="amount" className="block mb-2">Target Amount (in SOL):</label>
          <input
            type="number"
            id="amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
            min="0.001"
            step="0.001"
            className="w-full p-2 border rounded"
            disabled={!publicKey || isLoading}
          />
        </div>
        <button 
          type="submit" 
          className="btn w-full"
          disabled={!connected || isLoading}
        >
          {isLoading ? 'Creating Plan...' : 'Create Plan'}
        </button>
      </form>
    </Layout>
  );
}
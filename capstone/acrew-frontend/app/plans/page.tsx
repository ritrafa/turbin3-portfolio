'use client';

import React, { useEffect, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { fetchAllSavingsPlans, deposit, withdraw, SavingsPlan, isSavingsPlan } from '../utils/solana';
import Layout from '../components/Layout';
import dynamic from 'next/dynamic';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';
import { BN } from '@coral-xyz/anchor';
import { toast } from 'react-toastify';

const WalletConnector = dynamic(() => import('../components/WalletConnector'), { ssr: false });

const PlanCard: React.FC<{ 
    plan: SavingsPlan; 
    onDeposit: () => void;
    onWithdraw: () => void;
  }> = ({ plan, onDeposit, onWithdraw }) => {
    const currentTime = Math.floor(Date.now() / 1000);
    const isActive = currentTime < plan.account.start.toNumber() + plan.account.duration.toNumber();
    const canWithdraw = plan.userParticipating && plan.vaultBalance > 0;
  
    if (plan.isInactiveNonWithdrawable) {
      return (
        <div className="bg-gray-100 shadow-md rounded-lg overflow-hidden border-l-4 border-gray-300">
          <div className="p-5">
            <h3 className="text-xl font-bold mb-2">{plan.account.name}</h3>
            <p className="text-gray-600 mb-1">Status: Inactive</p>
          </div>
        </div>
      );
    }
  
    return (
      <div className={`bg-white shadow-md rounded-lg overflow-hidden ${isActive ? 'border-l-4 border-blue-500' : canWithdraw ? 'border-l-4 border-green-500' : 'border-l-4 border-gray-300'}`}>
        <div className="p-5">
          <h3 className="text-xl font-bold mb-2">{plan.account.name}</h3>
          <p className="text-gray-600 mb-1">Duration: {(plan.account.duration.toNumber() / (24 * 60 * 60)).toFixed(2)} days</p>
          <p className="text-gray-600 mb-1">Amount: {(plan.account.amount.toNumber() / LAMPORTS_PER_SOL).toFixed(2)} SOL</p>
          <p className="text-gray-600 mb-1">Participants: {plan.account.participants.toNumber()}</p>
          <p className={`font-semibold mb-1 ${isActive ? 'text-blue-600' : canWithdraw ? 'text-green-600' : 'text-red-600'}`}>
            Status: {isActive ? 'Active' : canWithdraw ? 'Successfully Completed' : 'Inactive'}
          </p>
          {(isActive || canWithdraw) && (
            <>
              <p className="text-gray-600 mb-1">Vault Balance: {plan.vaultBalance.toFixed(5)} SOL</p>
              {plan.userParticipating && (
                <p className="text-gray-600 mb-1">Your Share: {(plan.account.amount.toNumber() / LAMPORTS_PER_SOL + plan.userShare).toFixed(5)} SOL</p>
              )}
            </>
          )}
          {canWithdraw ? 
          isActive ?
          (
            <button 
            onClick={onWithdraw} 
            className="w-full py-2 px-4 bg-red-500 hover:bg-red-600 text-white rounded mb-2"
          >
            Withdraw (Penalty)
          </button>
          
          ) : (
            <button 
              onClick={onWithdraw} 
              className="w-full py-2 px-4 bg-green-500 hover:bg-green-600 text-white rounded mb-2"
            >
              Withdraw
            </button>
          ) : plan.userParticipating ? (
            <p className="text-gray-600 mb-2">No funds to withdraw</p>
          ) : (
            <button 
              onClick={onDeposit} 
              className={`w-full py-2 px-4 rounded ${isActive 
                ? 'bg-blue-500 hover:bg-blue-600 text-white' 
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
              disabled={!isActive}
            >
              Deposit
            </button>
          )}
        </div>
      </div>
    );
  };
  
  export default function Plans() {
    const { publicKey, wallet, connected } = useWallet();
    const [plans, setPlans] = useState<SavingsPlan[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
  
    useEffect(() => {
      if (connected) {
        fetchPlans();
      }
    }, [connected]);
  
    const fetchPlans = async () => {
      setLoading(true);
      setError(null);
      if(!publicKey){
        toast.error("Wallet connection required")
        return
      }
      try {
        const fetchedPlans = await fetchAllSavingsPlans(wallet, publicKey);
        const validPlans = fetchedPlans.filter(isSavingsPlan);
        const sortedPlans = sortPlans(validPlans);
        setPlans(sortedPlans);
      } catch (err) {
        console.error("Error fetching plans:", err);
        setError("Failed to fetch savings plans. Please try again.");
      } finally {
        setLoading(false);
      }
    };
  
    const sortPlans = (plans: SavingsPlan[]): SavingsPlan[] => {
        const currentTime = Math.floor(Date.now() / 1000);
        return plans.sort((a, b) => {
          const aEndTime = a.account.start.toNumber() + a.account.duration.toNumber();
          const bEndTime = b.account.start.toNumber() + b.account.duration.toNumber();
          const aIsActive = currentTime < aEndTime;
          const bIsActive = currentTime < bEndTime;
    
          if (aIsActive && !bIsActive) return -1;
          if (!aIsActive && bIsActive) return 1;
          if (aIsActive && bIsActive) {
            return bEndTime - aEndTime; // Longer remaining time first
          }
          return aEndTime - bEndTime; // For inactive plans, earlier end time first
        });
      };
  
      const handleDeposit = async (plan: SavingsPlan) => {
        if (!publicKey) {
          toast.error("Please connect your wallet first.");
          return;
        }
        try {
          const depositAmount = new BN(0.1 * LAMPORTS_PER_SOL);
          console.log('Attempting deposit...');
          console.log('Plan public key:', plan.publicKey.toBase58());
          const tx = await deposit(wallet, publicKey, plan.publicKey, depositAmount);
          console.log("Deposit successful! Transaction signature:", tx);
          toast.success("Deposit successful!");
          fetchPlans(); // Refresh the plans after deposit
        } catch (err) {
          console.error("Error depositing:", err);
          if (err instanceof Error) {
            toast.error(`Failed to deposit: ${err.message}`);
          } else {
            toast.error("Failed to deposit. An unknown error occurred.");
          }
        }
      };

      const handleWithdraw = async (plan: SavingsPlan) => {
        if (!publicKey) {
          toast.error("Please connect your wallet first.");
          return;
        }
        try {
          console.log('Attempting withdrawal...');
          console.log('Plan public key:', plan.publicKey.toBase58());
          const { tx, isEarlyWithdrawal } = await withdraw(wallet, publicKey, plan.publicKey);
          console.log(`${isEarlyWithdrawal ? 'Early' : 'Regular'} withdrawal successful! Transaction signature:`, tx);
          toast.success(`${isEarlyWithdrawal ? 'Early' : 'Regular'} withdrawal successful!${isEarlyWithdrawal ? ' Note: An early withdrawal fee may have been applied.' : ''}`);
          fetchPlans(); // Refresh the plans after withdrawal
        } catch (err) {
          console.error("Error withdrawing:", err);
          if (err instanceof Error) {
            toast.error(`Failed to withdraw: ${err.message}`);
          } else {
            toast.error("Failed to withdraw. An unknown error occurred.");
          }
        }
      };

      const renderPlanSection = (title: string, plansList: SavingsPlan[]) => (
        <>
          <h2 className="text-2xl font-semibold mb-4">{title}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {plansList.map((plan) => (
              <PlanCard 
                key={plan.publicKey.toString()} 
                plan={plan} 
                onDeposit={() => handleDeposit(plan)}
                onWithdraw={() => handleWithdraw(plan)}
              />
            ))}
          </div>
        </>
      );
    
      const currentTime = Math.floor(Date.now() / 1000);
      const userActivePlans = plans.filter(plan => 
        plan.userParticipating && (
          currentTime < plan.account.start.toNumber() + plan.account.duration.toNumber() ||
          plan.vaultBalance > 0
        )
      );
      const otherActivePlans = plans.filter(plan => 
        !plan.userParticipating && 
        currentTime < plan.account.start.toNumber() + plan.account.duration.toNumber()
      );
      const inactivePlans = plans.filter(plan => 
        !plan.isInactiveNonWithdrawable &&
        currentTime >= plan.account.start.toNumber() + plan.account.duration.toNumber() &&
        (!plan.userParticipating || plan.vaultBalance === 0)
      );
    
      return (
        <Layout>          
          {error && (
            <div className="my-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}
    
          {loading ? (
            <p>Loading plans...</p>
          ) : (
            <div>
              {userActivePlans.length > 0 && renderPlanSection("Your Active Plans", userActivePlans)}
              {otherActivePlans.length > 0 && renderPlanSection("Other Active Plans", otherActivePlans)}
              {inactivePlans.length > 0 && renderPlanSection("Inactive Plans", inactivePlans)}
            </div>
          )}
        </Layout>
      );
    }
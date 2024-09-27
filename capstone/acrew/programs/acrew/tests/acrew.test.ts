import * as anchor from "@coral-xyz/anchor";
import { Program, AnchorProvider, web3 } from "@coral-xyz/anchor";
import { Acrew } from "../target/types/acrew";
import {
  PublicKey,
  Keypair,
  LAMPORTS_PER_SOL,
  Transaction,
  SystemProgram,
  Connection,
  clusterApiUrl,
} from "@solana/web3.js";
import assert from "assert";

function busyWait(ms: number): Promise<void> {
  return new Promise((resolve) => {
    const start = Date.now();
    while (Date.now() - start < ms) {
      // Busy loop
    }
    resolve();
  });
}

describe("acrew", () => {
  // Set up the provider to use Solana devnet
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.Acrew as Program<Acrew>;
  const admin = Keypair.generate();
  const user = Keypair.generate();
  let savingsPlanPda: PublicKey;
  let savingsPlanVaultPda: PublicKey;
  let userVaultPda: PublicKey;

  // The wallet with signer rights
  const signerWallet = new PublicKey(
    "BHvKfNUBG5LkomT17E2Gxkni9L9xWne4uVUen68j1zED"
  );

  before(async () => {
    // Function to transfer SOL
    async function transferSol(to: PublicKey, amount: number) {
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: signerWallet,
          toPubkey: to,
          lamports: amount * LAMPORTS_PER_SOL,
        })
      );

      // You need to sign this transaction with the private key corresponding to signerWallet
      // For security reasons, you should use a wallet adapter or similar method to sign
      // This is just a placeholder - replace with actual signing method
      // const signedTx = await wallet.signTransaction(transaction);

      const signature = await provider.sendAndConfirm(transaction, []);
      console.log(
        `Transferred ${amount} SOL to ${to.toBase58()}. Signature: ${signature}`
      );
    }

    // Transfer 0.3 SOL to admin and 0.3 SOL to user
    await transferSol(admin.publicKey, 0.3);
    await transferSol(user.publicKey, 0.3);
  });

  it("Creates a savings plan", async () => {
    const planName = "Test Plan";
    const startTime = Math.floor(Date.now() / 1000) + 60; // Start 1 minute from now
    //const duration = 7 * 24 * 60 * 60; // 7 days
    const duration = 30; // 30 seconds
    const amount = new anchor.BN(0.1 * LAMPORTS_PER_SOL); // 0.1 SOL

    [savingsPlanPda] = await PublicKey.findProgramAddress(
      [
        Buffer.from("savings_plan"),
        admin.publicKey.toBuffer(),
        Buffer.from(planName),
      ],
      program.programId
    );

    [savingsPlanVaultPda] = await PublicKey.findProgramAddress(
      [Buffer.from("savings_plan_vault"), savingsPlanPda.toBuffer()],
      program.programId
    );

    const tx = await program.methods
      .createSavingsPlan(
        planName,
        new anchor.BN(startTime),
        new anchor.BN(duration),
        amount
      )
      .accounts({
        admin: admin.publicKey,
        savingsPlan: savingsPlanPda,
        savingsPlanVault: savingsPlanVaultPda,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([admin])
      .rpc();

    console.log("Transaction signature:", tx);

    // Wait for confirmation
    await provider.connection.confirmTransaction(tx);

    // Fetch the account with retries
    let retries = 5;
    let savingsPlan;
    while (retries > 0) {
      try {
        savingsPlan = await program.account.savingsPlan.fetch(savingsPlanPda);
        break;
      } catch (error) {
        console.log(
          `Retry ${6 - retries}: Failed to fetch account. Error:`,
          error
        );
        retries--;
      }
    }

    if (!savingsPlan) {
      throw new Error(
        "Failed to fetch savings plan account after multiple retries"
      );
    }

    assert.strictEqual(savingsPlan.name, planName);
    assert.strictEqual(savingsPlan.start.toNumber(), startTime);
    assert.strictEqual(savingsPlan.duration.toNumber(), duration);
    assert.strictEqual(savingsPlan.amount.toNumber(), amount.toNumber());
    assert.strictEqual(savingsPlan.participants.toNumber(), 0);
  });

  it("Deposits into a savings plan", async () => {
    [userVaultPda] = await PublicKey.findProgramAddress(
      [
        Buffer.from("user_vault"),
        savingsPlanPda.toBuffer(),
        user.publicKey.toBuffer(),
      ],
      program.programId
    );

    const depositAmount = new anchor.BN(0.1 * LAMPORTS_PER_SOL);

    let tx = await program.methods
      .deposit(savingsPlanPda, depositAmount)
      .accounts({
        user: user.publicKey,
        savingsPlan: savingsPlanPda,
        userVault: userVaultPda,
        systemProgram: anchor.web3.SystemProgram.programId,
        tokenProgram: anchor.utils.token.TOKEN_PROGRAM_ID,
      })
      .signers([user])
      .rpc();

    console.log("Transaction signature:", tx);

    // Wait for confirmation
    await provider.connection.confirmTransaction(tx);

    // Fetch the account with retries
    let retries = 5;
    let userVault;
    while (retries > 0) {
      try {
        userVault = await program.account.userVault.fetch(userVaultPda);
        break;
      } catch (error) {
        console.log(
          `Retry ${6 - retries}: Failed to fetch account. Error:`,
          error
        );
        retries--;
      }
    }

    if (!userVault) {
      throw new Error(
        "Failed to fetch userVault account after multiple retries"
      );
    }
    assert.strictEqual(userVault.active, true);
    assert.strictEqual(userVault.user.toString(), user.publicKey.toString());
    assert.strictEqual(
      userVault.savingsPlan.toString(),
      savingsPlanPda.toString()
    );

    const savingsPlan = await program.account.savingsPlan.fetch(savingsPlanPda);
    assert.strictEqual(savingsPlan.participants.toNumber(), 1);
  });

  it("Performs early withdrawal", async () => {
    const userInitialBalance = await provider.connection.getBalance(
      user.publicKey
    );
    const vaultInitialBalance = await provider.connection.getBalance(
      savingsPlanVaultPda
    );
    const depositAmount = new anchor.BN(0.1 * LAMPORTS_PER_SOL);
    const penaltyAmount = depositAmount.div(new anchor.BN(10)); // 10% penalty

    const tx = await program.methods
      .earlyWithdraw(savingsPlanPda)
      .accounts({
        user: user.publicKey,
        savingsPlan: savingsPlanPda,
        savingsPlanVault: savingsPlanVaultPda,
        userVault: userVaultPda,
        systemProgram: SystemProgram.programId,
      })
      .signers([user])
      .rpc();

    await provider.connection.confirmTransaction(tx);

    const userFinalBalance = await provider.connection.getBalance(
      user.publicKey
    );
    const vaultFinalBalance = await provider.connection.getBalance(
      savingsPlanVaultPda
    );

    // Check user balance
    const userBalanceDifference = userFinalBalance - userInitialBalance;
    assert(
      Math.abs(userBalanceDifference - 0.09 * LAMPORTS_PER_SOL) <
        0.01 * LAMPORTS_PER_SOL,
      "User should receive 90% of their deposit back"
    );

    // Check savings plan vault balance
    const vaultBalanceDifference = vaultFinalBalance - vaultInitialBalance;
    assert(
      Math.abs(vaultBalanceDifference - penaltyAmount.toNumber()) <
        0.01 * LAMPORTS_PER_SOL,
      "Savings plan vault should receive the penalty amount"
    );

    // Check that the user vault account no longer exists
    const userVaultInfo = await provider.connection.getAccountInfo(
      userVaultPda
    );
    assert.strictEqual(
      userVaultInfo,
      null,
      "User vault account should no longer exist"
    );

    // Fetch the savings plan with retries
    let retries = 5;
    let savingsPlan;
    while (retries > 0) {
      try {
        savingsPlan = await program.account.savingsPlan.fetch(savingsPlanPda);
        break;
      } catch (error) {
        console.log(
          `Retry ${6 - retries}: Failed to fetch savings plan. Error:`,
          error
        );
        retries--;
      }
    }

    if (!savingsPlan) {
      throw new Error(
        "Failed to fetch savings plan account after multiple retries"
      );
    }
    assert.strictEqual(
      savingsPlan.participants.toNumber(),
      0,
      "Savings plan should have 0 participants after withdrawal"
    );
  });

  it("Performs regular withdrawal after plan ends", async () => {
    const planName = "Test Plan 2";
    const startTime = Math.floor(Date.now() / 1000) + 5; // Start 5 seconds from now
    const duration = 10; // 10 second duration for testing purposes
    const amount = new anchor.BN(0.1 * LAMPORTS_PER_SOL); // 0.1 SOL

    [savingsPlanPda] = await PublicKey.findProgramAddress(
      [
        Buffer.from("savings_plan"),
        admin.publicKey.toBuffer(),
        Buffer.from(planName),
      ],
      program.programId
    );

    [savingsPlanVaultPda] = await PublicKey.findProgramAddress(
      [Buffer.from("savings_plan_vault"), savingsPlanPda.toBuffer()],
      program.programId
    );

    [userVaultPda] = await PublicKey.findProgramAddress(
      [
        Buffer.from("user_vault"),
        savingsPlanPda.toBuffer(),
        user.publicKey.toBuffer(),
      ],
      program.programId
    );

    // Create savings plan
    await program.methods
      .createSavingsPlan(
        planName,
        new anchor.BN(startTime),
        new anchor.BN(duration),
        amount
      )
      .accounts({
        admin: admin.publicKey,
        savingsPlan: savingsPlanPda,
        savingsPlanVault: savingsPlanVaultPda,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([admin])
      .rpc();

    // Wait for the plan to start
    await busyWait(6000); // Wait 6 seconds to ensure the plan has started

    // Deposit
    await program.methods
      .deposit(savingsPlanPda, amount)
      .accounts({
        user: user.publicKey,
        savingsPlan: savingsPlanPda,
        userVault: userVaultPda,
        systemProgram: anchor.web3.SystemProgram.programId,
        tokenProgram: anchor.utils.token.TOKEN_PROGRAM_ID,
      })
      .signers([user])
      .rpc();

    // Wait for the plan to end
    await busyWait(11000); // Wait 11 seconds to ensure the plan has ended

    const userInitialBalance = await provider.connection.getBalance(
      user.publicKey
    );

    // Perform withdrawal
    await program.methods
      .withdraw(savingsPlanPda)
      .accounts({
        user: user.publicKey,
        savingsPlan: savingsPlanPda,
        savingsPlanVault: savingsPlanVaultPda,
        userVault: userVaultPda,
        systemProgram: anchor.web3.SystemProgram.programId,
        tokenProgram: anchor.utils.token.TOKEN_PROGRAM_ID,
      })
      .signers([user])
      .rpc();

    const userFinalBalance = await provider.connection.getBalance(
      user.publicKey
    );
    const balanceDifference = userFinalBalance - userInitialBalance;

    // User should receive their full deposit back
    assert(
      Math.abs(balanceDifference - 0.1 * LAMPORTS_PER_SOL) <
        0.01 * LAMPORTS_PER_SOL
    );

    // User vault should be closed
    const userVaultAccount = await provider.connection.getAccountInfo(
      userVaultPda
    );
    assert.strictEqual(userVaultAccount, null);

    const savingsPlan = await program.account.savingsPlan.fetch(savingsPlanPda);
    assert.strictEqual(savingsPlan.participants.toNumber(), 0);
  });

  after(async () => {
    const connection = provider.connection;

    async function transferRemainingFunds(from: Keypair, to: PublicKey) {
      const balance = await connection.getBalance(from.publicKey);
      const minimumRent = await connection.getMinimumBalanceForRentExemption(0);
      const transferAmount = balance - minimumRent - 5000; // Leave some for transaction fee

      if (transferAmount > 0) {
        const transaction = new Transaction().add(
          SystemProgram.transfer({
            fromPubkey: from.publicKey,
            toPubkey: to,
            lamports: transferAmount,
          })
        );

        const signature = await provider.sendAndConfirm(transaction, [from]);
        console.log(
          `Transferred ${
            transferAmount / LAMPORTS_PER_SOL
          } SOL back to initiating account. Signature: ${signature}`
        );
      } else {
        console.log(`No funds to transfer from ${from.publicKey.toBase58()}`);
      }
    }

    // Transfer remaining funds from admin and user accounts
    await transferRemainingFunds(admin, signerWallet);
    await transferRemainingFunds(user, signerWallet);

    console.log(
      "Cleanup completed. Remaining funds transferred back to initiating account."
    );
  });
});

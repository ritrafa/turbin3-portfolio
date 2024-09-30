import {
  Connection,
  PublicKey,
  Transaction,
  SystemProgram,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { Program, AnchorProvider, web3, utils, BN } from "@coral-xyz/anchor";
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
} from "@solana/wallet-adapter-wallets";
//import { TipLinkWalletAdapter } from '@tiplink/api'; inc.
import { IDL } from "./acrew_idl";

export const PROGRAM_ID = new PublicKey(
  "2DSqE2VWrX33g3CWCQiwDsx3Y5DubKnPMojdsEKZTytb"
);

export interface SavingsPlan {
  publicKey: PublicKey;
  account: {
    admin: PublicKey;
    name: string;
    start: BN;
    duration: BN;
    amount: BN;
    participants: BN;
    bump: number;
  };
  userParticipating: boolean;
  vaultBalance: number;
  userShare: number;
  isInactiveNonWithdrawable?: boolean; // New field
}

export const getConnection = () => {
  const rpcEndpoint =
    process.env.NEXT_PUBLIC_RPC_API_KEY || web3.clusterApiUrl("devnet");
  return new Connection(rpcEndpoint);
};

export const getSupportedWallets = () => [
  new PhantomWalletAdapter(),
  new SolflareWalletAdapter(),
  //new TipLinkWalletAdapter(),
];

export const getProgram = (wallet: any) => {
  const connection = getConnection();
  const provider = new AnchorProvider(
    connection,
    wallet,
    AnchorProvider.defaultOptions()
  );
  return new Program(IDL, PROGRAM_ID, provider);
};

export const createSavingsPlan = async (
  wallet: any,
  publicKey: any,
  name: string,
  start: number,
  duration: number,
  amount: number
) => {
  console.log("Wallet:", wallet.adapter);
  console.log("Public Key:", publicKey?.toString());

  if (!publicKey) {
    throw new Error(
      "Wallet public key is undefined. Please connect your wallet."
    );
  }

  const connection = getConnection();
  const provider = new AnchorProvider(
    connection,
    wallet.adapter,
    AnchorProvider.defaultOptions()
  );
  const program = new Program(IDL, PROGRAM_ID, provider);

  const [savingsPlanPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("savings_plan"), publicKey.toBuffer(), Buffer.from(name)],
    program.programId
  );

  const [savingsPlanVaultPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("savings_plan_vault"), savingsPlanPda.toBuffer()],
    program.programId
  );

  try {
    const tx = await program.methods
      .createSavingsPlan(
        name,
        new BN(start),
        new BN(duration),
        new BN(amount * LAMPORTS_PER_SOL)
      )
      .accounts({
        admin: publicKey,
        savingsPlan: savingsPlanPda,
        savingsPlanVault: savingsPlanVaultPda,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    console.log("Savings plan created. Transaction signature:", tx);
    return tx;
  } catch (error) {
    console.error("Error in createSavingsPlan:", error);
    if (error instanceof Error) {
      throw new Error(`Failed to create savings plan: ${error.message}`);
    } else {
      throw new Error(
        "Failed to create savings plan: An unknown error occurred"
      );
    }
  }
};

export const fetchAllSavingsPlans = async (
  wallet: any,
  publicKey: PublicKey
): Promise<SavingsPlan[]> => {
  const connection = getConnection();
  const provider = new AnchorProvider(
    connection,
    wallet.adapter,
    AnchorProvider.defaultOptions()
  );
  const program = new Program(IDL, PROGRAM_ID, provider);

  try {
    const allPlans = await program.account.savingsPlan.all();
    const currentTime = Math.floor(Date.now() / 1000);

    const planDetails = await Promise.all(
      allPlans.map(async (plan) => {
        const [savingsPlanVaultPda] = PublicKey.findProgramAddressSync(
          [Buffer.from("savings_plan_vault"), plan.publicKey.toBuffer()],
          program.programId
        );
        const [userVaultPda] = PublicKey.findProgramAddressSync(
          [
            Buffer.from("user_vault"),
            plan.publicKey.toBuffer(),
            publicKey.toBuffer(),
          ],
          program.programId
        );

        const endTime =
          (plan.account.start as BN).toNumber() +
          (plan.account.duration as BN).toNumber();
        const isInactive = currentTime >= endTime;

        let userParticipating = false;
        let vaultBalance = 0;
        let userShare = 0;

        if (!isInactive || (plan.account.participants as BN).toNumber() > 0) {
          vaultBalance = await connection.getBalance(savingsPlanVaultPda);
          try {
            const userVault = await program.account.userVault.fetch(
              userVaultPda
            );
            userParticipating = userVault.active as boolean;
          } catch {
            // User is not participating if userVault doesn't exist
          }

          const participants = (plan.account.participants as BN).toNumber();
          userShare = participants > 0 ? vaultBalance / participants : 0;
        }

        const isInactiveNonWithdrawable =
          isInactive && !userParticipating && vaultBalance === 0;

        return {
          publicKey: plan.publicKey,
          account: plan.account as SavingsPlan["account"],
          userParticipating,
          vaultBalance: vaultBalance / LAMPORTS_PER_SOL,
          userShare: userShare / LAMPORTS_PER_SOL,
          isInactiveNonWithdrawable,
        };
      })
    );

    return planDetails;
  } catch (error) {
    console.error("Error fetching savings plans:", error);
    throw error;
  }
};

export function isSavingsPlan(plan: any): plan is SavingsPlan {
  return (
    plan &&
    plan.publicKey instanceof PublicKey &&
    plan.account &&
    plan.account.admin instanceof PublicKey &&
    typeof plan.account.name === "string" &&
    plan.account.start instanceof BN &&
    plan.account.duration instanceof BN &&
    plan.account.amount instanceof BN &&
    plan.account.participants instanceof BN &&
    typeof plan.account.bump === "number"
  );
}

export const deposit = async (
  wallet: any,
  userPublicKey: PublicKey,
  savingsPlanPda: PublicKey,
  amount: BN
) => {
  const connection = getConnection();
  const provider = new AnchorProvider(
    connection,
    wallet.adapter,
    AnchorProvider.defaultOptions()
  );
  const program = new Program(IDL, PROGRAM_ID, provider);

  const [userVaultPda] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("user_vault"),
      savingsPlanPda.toBuffer(),
      userPublicKey.toBuffer(),
    ],
    program.programId
  );

  try {
    console.log("Deposit amount:", amount.toString());
    console.log("User public key:", userPublicKey.toBase58());
    console.log("Savings plan PDA:", savingsPlanPda.toBase58());
    console.log("User vault PDA:", userVaultPda.toBase58());

    const tx = await program.methods
      .deposit(savingsPlanPda, amount)
      .accounts({
        user: userPublicKey,
        savingsPlan: savingsPlanPda,
        userVault: userVaultPda,
        systemProgram: SystemProgram.programId,
        tokenProgram: utils.token.TOKEN_PROGRAM_ID,
      })
      .rpc();

    console.log("Deposit successful. Transaction signature:", tx);
    return tx;
  } catch (error) {
    console.error("Error in deposit:", error);
    if (error instanceof Error) {
      throw new Error(`Deposit failed: ${error.message}`);
    } else {
      throw new Error("Deposit failed: An unknown error occurred");
    }
  }
};

/*
export const earlyWithdraw = async (wallet: any, savingsPlanPda: PublicKey) => {
  const program = getProgram(wallet);
  const [savingsPlanVaultPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("savings_plan_vault"), savingsPlanPda.toBuffer()],
    program.programId
  );
  const [userVaultPda] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("user_vault"),
      savingsPlanPda.toBuffer(),
      wallet.publicKey.toBuffer(),
    ],
    program.programId
  );

  try {
    const tx = await program.methods
      .earlyWithdraw(savingsPlanPda)
      .accounts({
        user: wallet.publicKey,
        savingsPlan: savingsPlanPda,
        savingsPlanVault: savingsPlanVaultPda,
        userVault: userVaultPda,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    console.log("Early withdrawal successful. Transaction signature:", tx);
    return tx;
  } catch (error) {
    console.error("Error performing early withdrawal:", error);
    throw error;
  }
};

export const withdraw = async (wallet: any, savingsPlanPda: PublicKey) => {
  const program = getProgram(wallet);
  const [savingsPlanVaultPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("savings_plan_vault"), savingsPlanPda.toBuffer()],
    program.programId
  );
  const [userVaultPda] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("user_vault"),
      savingsPlanPda.toBuffer(),
      wallet.publicKey.toBuffer(),
    ],
    program.programId
  );

  try {
    const tx = await program.methods
      .withdraw(savingsPlanPda)
      .accounts({
        user: wallet.publicKey,
        savingsPlan: savingsPlanPda,
        savingsPlanVault: savingsPlanVaultPda,
        userVault: userVaultPda,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    console.log("Withdrawal successful. Transaction signature:", tx);
    return tx;
  } catch (error) {
    console.error("Error performing withdrawal:", error);
    throw error;
  }
};
*/

export const withdraw = async (
  wallet: any,
  userPublicKey: PublicKey,
  savingsPlanPda: PublicKey
) => {
  const connection = getConnection();
  const provider = new AnchorProvider(
    connection,
    wallet.adapter,
    AnchorProvider.defaultOptions()
  );
  const program = new Program(IDL, PROGRAM_ID, provider);

  const [savingsPlanVaultPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("savings_plan_vault"), savingsPlanPda.toBuffer()],
    program.programId
  );

  const [userVaultPda] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("user_vault"),
      savingsPlanPda.toBuffer(),
      userPublicKey.toBuffer(),
    ],
    program.programId
  );

  try {
    console.log("Attempting withdrawal...");
    console.log("User public key:", userPublicKey.toBase58());
    console.log("Savings plan PDA:", savingsPlanPda.toBase58());

    // Fetch the savings plan to check its status
    const savingsPlan = (await program.account.savingsPlan.fetch(
      savingsPlanPda
    )) as SavingsPlan["account"];
    const currentTime = Math.floor(Date.now() / 1000);
    const planEndTime =
      savingsPlan.start.toNumber() + savingsPlan.duration.toNumber();
    const isEarlyWithdrawal = currentTime < planEndTime;

    let tx;
    if (isEarlyWithdrawal) {
      console.log("Performing early withdrawal...");
      tx = await program.methods
        .earlyWithdraw(savingsPlanPda)
        .accounts({
          user: userPublicKey,
          savingsPlan: savingsPlanPda,
          savingsPlanVault: savingsPlanVaultPda,
          userVault: userVaultPda,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
    } else {
      console.log("Performing regular withdrawal...");
      tx = await program.methods
        .withdraw(savingsPlanPda)
        .accounts({
          user: userPublicKey,
          savingsPlan: savingsPlanPda,
          savingsPlanVault: savingsPlanVaultPda,
          userVault: userVaultPda,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
    }

    console.log(
      `${
        isEarlyWithdrawal ? "Early" : "Regular"
      } withdrawal successful. Transaction signature:`,
      tx
    );
    return { tx, isEarlyWithdrawal };
  } catch (error) {
    console.error("Error in withdrawal:", error);
    if (error instanceof Error) {
      throw new Error(`Withdrawal failed: ${error.message}`);
    } else {
      throw new Error("Withdrawal failed: An unknown error occurred");
    }
  }
};

export const fetchSavingsPlan = async (
  wallet: any,
  savingsPlanPda: PublicKey
) => {
  const program = getProgram(wallet);

  try {
    const savingsPlan = await program.account.savingsPlan.fetch(savingsPlanPda);
    return savingsPlan;
  } catch (error) {
    console.error("Error fetching savings plan:", error);
    throw error;
  }
};

export const fetchUserVault = async (
  wallet: any,
  savingsPlanPda: PublicKey
) => {
  const program = getProgram(wallet);
  const [userVaultPda] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("user_vault"),
      savingsPlanPda.toBuffer(),
      wallet.publicKey.toBuffer(),
    ],
    program.programId
  );

  try {
    const userVault = await program.account.userVault.fetch(userVaultPda);
    return userVault;
  } catch (error) {
    console.error("Error fetching user vault:", error);
    throw error;
  }
};

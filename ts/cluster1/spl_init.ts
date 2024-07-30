import { Keypair, Connection, Commitment } from "@solana/web3.js";
import { createMint } from "@solana/spl-token";
import wallet from "../../wba-wallet.json"; // Import rafa's wallet

// Load keypair from the imported wallet
const keypair = Keypair.fromSecretKey(new Uint8Array(wallet));

// Connect to Solana devnet
// Commitment level is set to "confirmed" to ensure that the mint is finalized
// mainnet url is "https://api.mainnet-beta.solana.com"
// devnet url is "https://api.devnet.solana.com"
// testnet url is "https://api.testnet.solana.com"
const commitment: Commitment = "confirmed";
const connection = new Connection("https://api.devnet.solana.com", commitment);

(async () => {
  try {
    const mint = await createMint(
      connection,
      keypair, // payer
      keypair.publicKey, // authority to mint new tokens
      keypair.publicKey, // authority to freeze tokens
      9 // decimals, currently matching SOL
    );

    console.log(`Mint address: ${mint.toBase58()}`);
    console.log(
      `View on Explorer: https://explorer.solana.com/address/${mint.toBase58()}?cluster=devnet`
    );
  } catch (error) {
    console.log(`Oops, something went wrong: ${error}`);
  }
})();

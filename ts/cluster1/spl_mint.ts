import { Keypair, PublicKey, Connection, Commitment } from "@solana/web3.js";
import { getOrCreateAssociatedTokenAccount, mintTo } from "@solana/spl-token";
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

const token_decimals = 1_000_000_000n;

// Mint address
const mint = new PublicKey("EpmT5jUpegMnyLeLMarFaKMkLCMBeCgyr27XiqoUNKm6");

(async () => {
  try {
    const ata = await getOrCreateAssociatedTokenAccount(
      connection,
      keypair, // payer
      mint, // mint address
      keypair.publicKey // owner address
    );

    const mintTx = await mintTo(
      connection,
      keypair, // payer
      mint, // mint address
      ata.address, // destination address (newly created ata)
      keypair.publicKey, // mint authority
      1_000n * token_decimals // amount, this will mint 1000 new tokens
    );

    console.log(`Your mint txid: ${mintTx}`);
    console.log(
      `Transaction: https://explorer.solana.com/tx/${mintTx}?cluster=devnet`
    );
  } catch (error) {
    console.log(`Oops, something went wrong: ${error}`);
  }
})();

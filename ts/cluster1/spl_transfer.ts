import {
  Commitment,
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
} from "@solana/web3.js";
import wallet from "../../wba-wallet.json";
import { getOrCreateAssociatedTokenAccount, transfer } from "@solana/spl-token";

// We're going to import our keypair from the wallet file
const keypair = Keypair.fromSecretKey(new Uint8Array(wallet));

//Create a Solana devnet connection
const commitment: Commitment = "confirmed";
const connection = new Connection("https://api.devnet.solana.com", commitment);

// Mint address
const mint = new PublicKey("EpmT5jUpegMnyLeLMarFaKMkLCMBeCgyr27XiqoUNKm6");

// Recipient address
//const to = new PublicKey("5TuH2kN4b2TM8jqJhvHVNybPQb47cKJKPC5EjiTNsyzQ");
const to = new PublicKey("fsPQvgoXVkc9dvY68pCvTjvBW7jHeFzHYN6nn7EhESp");

(async () => {
  try {
    // Get the token account of the fromWallet address, and if it does not exist, create it
    // Get the token account of the toWallet address, and if it does not exist, create it
    // Transfer the new token to the "toTokenAccount" we just created
    const ataFrom = await getOrCreateAssociatedTokenAccount(
      connection,
      keypair,
      mint,
      keypair.publicKey
    );

    const ataTo = await getOrCreateAssociatedTokenAccount(
      connection,
      keypair,
      mint,
      to
    );

    const transferTx = await transfer(
      connection,
      keypair,
      ataFrom.address,
      ataTo.address,
      keypair.publicKey,
      10 * 1_000_000_000
    );

    console.log(`Your Transfer txid: ${transferTx}`);
    console.log(
      `Transaction: https://explorer.solana.com/tx/${transferTx}?cluster=devnet`
    );
  } catch (e) {
    console.error(`Oops, something went wrong: ${e}`);
  }
})();

// Cohort member Julian - juliandevmy helped create this file, I made it get all registrations

import { Connection, PublicKey } from "@solana/web3.js";
import { BorshInstructionCoder } from "@coral-xyz/anchor";
import { IDL } from "./programs/wba_prereq";

const connection = new Connection("https://api.devnet.solana.com");
const programId = new PublicKey("WBAQSygkwMox2VuWKU133NxFrpDZUBdvSBeaBEue2Jq");

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchTransactions() {
  const signatures = await connection.getConfirmedSignaturesForAddress2(
    programId
  );
  console.log(signatures);
  const transactions = [];
  for (const signature of signatures) {
    const tx = await connection.getTransaction(signature.signature);
    if (tx) {
      tx.transaction.message.programIds().forEach((id) => {});

      const ixs = tx.transaction.message.instructions;
      const coder = new BorshInstructionCoder(IDL);

      ixs.forEach((ix) => {
        const msg = coder.decode(ix.data, "base58");

        const ixData = msg?.data;
        // Extract GitHub username
        if (ixData) {
          // @ts-ignore
          const githubBuffer = ixData?.github as Buffer;
          console.log(
            "GitHub username: ",
            githubBuffer.toString("utf8"),
            " ✅"
          );
        }
      });
    }
    transactions.push(tx);
    // Pause to avoid rate limiting
    await sleep(500); // Adjust the delay as needed
  }
  return transactions;
}

fetchTransactions()
  .then((transactions) => {})
  .catch(console.error);

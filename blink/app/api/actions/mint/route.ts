import {
  ActionGetResponse,
  ACTIONS_CORS_HEADERS,
  ActionPostRequest,
  createPostResponse,
  ActionPostResponse,
} from "@solana/actions";
import {
  clusterApiUrl,
  Connection,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import {
  createSignerFromKeypair,
  signerIdentity,
  publicKey,
} from "@metaplex-foundation/umi";
import { fromWeb3JsPublicKey } from "@metaplex-foundation/umi-web3js-adapters";
import { fetchCollection } from "@metaplex-foundation/mpl-core";
import { transferV1 } from "@metaplex-foundation/mpl-core";

import { Pool } from "pg";

export const maxDuration = 60; // This function can run for a maximum of 60 seconds

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
});

const rugAddresses = [
  "9WftyHRuJh8ByVRumrCisgpPwfhiSyqSRb2Q9hKtd1dF", // 0
  "2fC3F36ggcgUKdzEwqBntmwRM3mBrn3U8EoYYjr2jehF",
  "5NcT7zs1Re9XJgPg8Dfoi4miJP7HL8X1Hs16g2VvZVT3",
  "9aKVQRSR9zwMEa6ngcfwnHUEsKjvQdMMEBAKscmQnUQ1",
  "7Ho4ffX2EuMAtU1HaTA5tETPj635fTb18PkMjPxQLYoi",
  "G1NGgjJTrM3Dozf5vayjtupzS7929N53LACEfHKYkhox", // 5
  "CRbMfsTvwC6SsX2L9pDuCoWYmhQo9N4jCGZdakX1bDNN",
  "7F4L8cESGuT7gPwXRuPzNMZxc1aUrEzW5zQosfJdvSGs",
  "4S1CfMNf1oZd2H2WgjzJsKCQfwVhuE3ouECHbrPmjY53",
  "5fVwWNM3UxGQ1htnJ6LX4dY4H4zbnY1gcyk2TXw7YRvT",
  "FT69yfPXp7go6aPbcPaDTiCk7fTWGVGMUVwX3JAvAeK4", // 10
  "BxT8neX8WPngseB8Y52FTStGCyPMKPUxy5BCKMSiFV2S",
  "5S1QVhXihidBNX6ZFHou5gacBSFDNbqv3QifiAfnacSC",
  "5RP3N6hJiA3xZG9uQmPf2jfALU9pACyepbZnY1K8avGA",
  "36tVBVUp2sxu5YEVELtRTxidCZL1BkNM3PCcxofartZA",
  "HK4CK9RMgBzkTsqxzYogcjoAyQMhUwSdBH5TPJtD9hXU", // 15
  "EGqKga5r4LuL9VEaJ21BMg9E8wpKzkSJKUdZK5DvXhHx",
  "27BZEZD8TDQefxBcvd9B1bafb3Yx9wDkCwEcr2m8my4i",
  "9gZf5VMoNqWEo3QEL9zLS9q9hEgZJFRSZGe3fnFp9gk3",
  "ErEqdfYtPU9NRT8pMct3SCrwyd2CHgu7pBi8HT1izy5b",
  "AM4nfGe8qEeGEeg7oFWw9Pid6DV2m3rKQZAan9BZULgR",
  "5S1YgTYyhMU25wqgqdfyPTodWvAdG8MYihVnf27jDxkr", // 20
  "8bc9ajE28WpTkhPGb7KuPCANty6SEGLvsB3XngsW2rGc",
  "J3CUghB2tmGgoJTio1J88X3QDsqB4L6BreQV6tSvGcPC",
  "2jfVuGovSsBQiPLxALD3oxnBfhkWQcDi64JarzZ9JXjD", // 24
];

export const GET = async (req: Request) => {
  const payload: ActionGetResponse = {
    icon: "https://turbin3-portfolio.vercel.app/rug_combine.gif",
    label: "Mint",
    description:
      "Mint a rare rug, for just the cNFT cost, if you guess a previously unused number.",
    title: "Rit Rafa's Rare Rug Emporium",
    links: {
      actions: [
        {
          href: "/api/actions/mint?number={number}",
          label: "Guess",
          parameters: [
            {
              name: "number",
              label: "Enter a number between 1 and 25",
            },
          ],
        },
      ],
    },
  };

  return Response.json(payload, {
    headers: ACTIONS_CORS_HEADERS,
  });
};

export const OPTIONS = GET;

export const POST = async (req: Request) => {
  try {
    const url = new URL(req.url);
    const body: ActionPostRequest = await req.json();

    let account: PublicKey;
    try {
      account = new PublicKey(body.account);
    } catch (err) {
      throw "Invalid wallet account provided.";
    }

    if (!url.searchParams.has("number")) {
      throw "Please enter a guess";
    }

    let number: number = parseFloat(url.searchParams.get("number") || "0");

    if (number < 1 || number > 25 || !Number.isInteger(number)) {
      throw "Your guess should be an integer between 1 and 25";
    }

    // Check if the user has submitted in the last minute
    try {
      const timeCheckQuery = `
          SELECT address, submitted
          FROM blink
          WHERE address = $1
          AND submitted > NOW() - INTERVAL '1 minute'
        `;
      const timeCheckValues = [account];
      const { rows: timeCheckRows } = await pool.query(
        timeCheckQuery,
        timeCheckValues
      );

      if (timeCheckRows.length > 0) {
        throw "Please wait 1 minute before submitting another guess";
      }
    } catch (err) {
      let message =
        "Unable to store guess, ensure you waited at least 60 seconds from your last guess";
      if (typeof err == "string") message = err;
      console.log(message);
      throw message;
    }

    // Check if the number is already guessed
    try {
      const guessCheckQuery = `
          SELECT guess
          FROM blink
          WHERE guess = $1
        `;
      const guessCheckValues = [number];
      const { rows: guessCheckRows } = await pool.query(
        guessCheckQuery,
        guessCheckValues
      );

      if (guessCheckRows.length > 0) {
        const insertQuery = `
        INSERT INTO blink (address, guess, submitted)
        VALUES ($1, $2, $3)
        RETURNING address
      `;
        const insertValues = [account, number, new Date()];
        const { rows: insertRows } = await pool.query(
          insertQuery,
          insertValues
        );
        throw "That number is taken, please wait 1 minute and try again!";
      }
    } catch (err) {
      let message = "Unable to retrieve guess list";
      if (typeof err == "string") message = err;
      console.log(message);
      throw message;
    }

    // Attempt to send the rug
    if (!process.env.RPC_URL) {
      throw "No RPC found";
    }
    const umi = createUmi(process.env.RPC_URL);
    const collectionAddress = "DYj1cLGroq2CHj66tDkeV4F6zPL9JLgwbkDGM4HcCgiA";
    if (!process.env.RRE_WALLET) {
      throw "No wallet secret key found";
    }
    let keypair = umi.eddsa.createKeypairFromSecretKey(
      new Uint8Array(JSON.parse(process.env.RRE_WALLET))
    );
    const signer = createSignerFromKeypair(umi, keypair);
    umi.use(signerIdentity(signer));
    const collection = await fetchCollection(umi, collectionAddress);

    await transferV1(umi, {
      asset: publicKey(rugAddresses[number - 1]),
      newOwner: fromWeb3JsPublicKey(account),
      collection: collection.publicKey,
    }).sendAndConfirm(umi);

    // Insert the new guess
    try {
      const insertQuery = `
          INSERT INTO blink (address, guess, submitted)
          VALUES ($1, $2, $3)
          RETURNING address
        `;
      const insertValues = [account, number, new Date()];
      const { rows: insertRows } = await pool.query(insertQuery, insertValues);
    } catch (err) {
      let message = "Unable to store guess";
      if (typeof err == "string") message = err;
      throw message;
    }

    const connection = new Connection(
      clusterApiUrl("mainnet-beta"),
      "confirmed"
    );
    const TO_PUBKEY = new PublicKey(
      "RRE6wbynBR2AfsrZSR3bbW8VdkSmEFzVeCFpAqd26Gf"
    );

    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: account,
        lamports: 0.0035 * LAMPORTS_PER_SOL,
        toPubkey: TO_PUBKEY,
      })
    );
    transaction.feePayer = account;
    transaction.recentBlockhash = (
      await connection.getLatestBlockhash()
    ).blockhash;

    const payload: ActionPostResponse = await createPostResponse({
      fields: {
        transaction,
        message: `Congrats! See your rug at https://explorer.solana.com/address/${
          rugAddresses[number - 1]
        }`,
      },
    });

    return Response.json(payload, {
      headers: ACTIONS_CORS_HEADERS,
    });
  } catch (err) {
    let message = "An unknown error occurred";
    if (typeof err == "string") message = err;
    console.log(message);

    return Response.json(
      { message: message },
      {
        status: 400,
        headers: ACTIONS_CORS_HEADERS,
      }
    );
  }
};

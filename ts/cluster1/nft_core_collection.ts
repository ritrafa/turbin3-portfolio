import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import {
  createSignerFromKeypair,
  signerIdentity,
  generateSigner,
  TransactionBuilderSendAndConfirmOptions,
} from "@metaplex-foundation/umi";
import { createCollection, ruleSet } from "@metaplex-foundation/mpl-core";

import wallet from "../../rre-wallet.json";

const RPC_ENDPOINT = "https://api.mainnet-beta.solana.com";
const umi = createUmi(RPC_ENDPOINT);

let keypair = umi.eddsa.createKeypairFromSecretKey(new Uint8Array(wallet));
const myKeypairSigner = createSignerFromKeypair(umi, keypair);
umi.use(signerIdentity(myKeypairSigner));

const txConfig: TransactionBuilderSendAndConfirmOptions = {
  send: { skipPreflight: true },
  confirm: { commitment: "processed" },
};

async function main() {
  const collectionAddress = generateSigner(umi);

  const tx = await createCollection(umi, {
    collection: collectionAddress,
    updateAuthority: myKeypairSigner.publicKey,
    name: "Rare Rug Emporium",
    uri: "https://white-magnetic-mockingbird-979.mypinata.cloud/ipfs/QmcytCC5NZhvw33KS7DdA4aspgWE2f2fdPFqowEzQuQ4zP",
    plugins: [
      {
        type: "Royalties",
        basisPoints: 700,
        creators: [
          {
            address: myKeypairSigner.publicKey,
            percentage: 100,
          },
        ],
        ruleSet: ruleSet("None"),
      },
    ],
  }).sendAndConfirm(umi);

  console.log(`Collection created: ${tx.signature}`);
}

main().catch(console.error);

import wallet from "../../wba-wallet.json";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import {
  createMetadataAccountV3,
  CreateMetadataAccountV3InstructionAccounts,
  CreateMetadataAccountV3InstructionArgs,
  DataV2Args,
  updateMetadataAccountV2,
  UpdateMetadataAccountV2InstructionAccounts,
  UpdateMetadataAccountV2InstructionDataArgs,
} from "@metaplex-foundation/mpl-token-metadata";
import {
  createSignerFromKeypair,
  signerIdentity,
  publicKey,
} from "@metaplex-foundation/umi";
import bs58 from "bs58";

// Define our Mint address
const mint = publicKey("EpmT5jUpegMnyLeLMarFaKMkLCMBeCgyr27XiqoUNKm6");

// Create a UMI connection
const umi = createUmi("https://api.devnet.solana.com");
const keypair = umi.eddsa.createKeypairFromSecretKey(new Uint8Array(wallet));
const signer = createSignerFromKeypair(umi, keypair);
umi.use(signerIdentity(createSignerFromKeypair(umi, keypair)));

(async () => {
  try {
    let accounts: UpdateMetadataAccountV2InstructionAccounts = {
      metadata: publicKey("Be9VFpGsE7CZeckD1CVwGdtXLg6odtV1Ta6Z1kWLDepS"),
      updateAuthority: signer,
    };

    let data: DataV2Args = {
      name: "Rafa Medals",
      symbol: "RFM",
      uri: "https://white-magnetic-mockingbird-979.mypinata.cloud/ipfs/QmPUtTnXoJLLFCfMvgs3Zwr7XsCAYChCgJ4m7SEjpiSZHF",
      sellerFeeBasisPoints: 500,
      creators: [{ address: keypair.publicKey, verified: true, share: 100 }],
      collection: null,
      uses: null,
    };

    let args: UpdateMetadataAccountV2InstructionDataArgs = {
      data: data,
    };

    let tx = updateMetadataAccountV2(umi, {
      ...accounts,
      ...args,
    });

    let result = await tx.sendAndConfirm(umi);

    console.log(bs58.encode(result.signature));
  } catch (e) {
    console.error(`Oops, something went wrong: ${e}`);
  }
})();

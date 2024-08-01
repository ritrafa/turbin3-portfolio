import wallet from "../../wba-wallet.json";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import {
  createGenericFile,
  createSignerFromKeypair,
  signerIdentity,
} from "@metaplex-foundation/umi";
import { irysUploader } from "@metaplex-foundation/umi-uploader-irys";

// Create a devnet connection
const umi = createUmi("https://api.devnet.solana.com");

let keypair = umi.eddsa.createKeypairFromSecretKey(new Uint8Array(wallet));
const signer = createSignerFromKeypair(umi, keypair);

umi.use(irysUploader());
umi.use(signerIdentity(signer));

(async () => {
  try {
    // Follow this JSON structure
    // https://docs.metaplex.com/programs/token-metadata/changelog/v1.0#json-structure

    const image =
      "https://arweave.net/juAAVrkLqdnyBwL1nbcDj_o1B6EH6JarqaVbd6WFwGg";
    const metadata = {
      name: "Rafa Rug Doctor",
      symbol: "RRD",
      description: "BUt HoW dId It StArT MoViNg?!",
      image,
      animation_url:
        "https://arweave.net/CSA5LK2O78Jx-mb5qkXqKtVGNM2j_WRmREDQQovswL4",
      attributes: [
        { trait_type: "wen", value: "now" },
        { trait_type: "lost_funds", value: "all" },
        { trait_type: "suspicious", value: "yes" },
        { trait_type: "animated", value: "true" },
      ],
      properties: {
        files: [
          {
            type: "image/gif",
            uri: image,
          },
        ],
      },
    };
    const myUri = await umi.uploader.uploadJson(metadata);
    console.log("Your image URI: ", myUri);
  } catch (error) {
    console.log("Oops.. Something went wrong", error);
  }
})();

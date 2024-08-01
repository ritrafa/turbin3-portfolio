import wallet from "../../wba-wallet.json";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import {
  createGenericFile,
  createSignerFromKeypair,
  signerIdentity,
} from "@metaplex-foundation/umi";
import { irysUploader } from "@metaplex-foundation/umi-uploader-irys";
import { readFile } from "fs/promises";

// Create a devnet connection
const umi = createUmi("https://api.devnet.solana.com");

let keypair = umi.eddsa.createKeypairFromSecretKey(new Uint8Array(wallet));
const signer = createSignerFromKeypair(umi, keypair);

umi.use(irysUploader());
umi.use(signerIdentity(signer));

(async () => {
  try {
    // Load the image from the stored file
    const image = await readFile("../img/rug.gif");

    // Create a generic file with the image content
    const genericFile = createGenericFile(image, "rug", {
      contentType: "image/gif",
    });

    // Upload the image via the umi Irys uploader
    const [myUri] = await umi.uploader.upload([genericFile]);
    console.log("Your image URI: ", myUri);

    // Initial run created file at https://arweave.net/K5pqpgD4VygqbKkQ9rDIirneImVueJKSb5T0zvvQOGo
  } catch (error) {
    console.log("Oops.. Something went wrong", error);
  }
})();

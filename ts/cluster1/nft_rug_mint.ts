import wallet from "../../rre-wallet.json";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import {
  createGenericFile,
  createSignerFromKeypair,
  signerIdentity,
  generateSigner,
  percentAmount,
} from "@metaplex-foundation/umi";
import {
  createNft,
  mplTokenMetadata,
} from "@metaplex-foundation/mpl-token-metadata";
import {
  fetchCollection,
  create,
  ruleSet,
} from "@metaplex-foundation/mpl-core";
import base58 from "bs58";
import { irysUploader } from "@metaplex-foundation/umi-uploader-irys";
import { readFile } from "fs/promises";

// Collection
const collectionAddress = "DYj1cLGroq2CHj66tDkeV4F6zPL9JLgwbkDGM4HcCgiA"; // mainnet collection

// Create a solana connection
if (!process.env.RPC_URL) {
  throw new Error("RPC_URL is not defined");
}
const umi = createUmi(process.env.RPC_URL);

let keypair = umi.eddsa.createKeypairFromSecretKey(new Uint8Array(wallet));
const signer = createSignerFromKeypair(umi, keypair);

umi.use(irysUploader());
umi.use(mplTokenMetadata());
umi.use(signerIdentity(signer));

(async () => {
  let array = [];

  for (let i = 12; i < 13; i++) {
    try {
      const imgnum = i;
      const detailsArray = [
        {
          imgnum: 0,
          guess: "1",
          icon: "sol",
          direction: "outward",
          color_scheme: "green",
        },
        {
          imgnum: 1,
          guess: "2",
          icon: "heart",
          direction: "inward",
          color_scheme: "orange",
        },
        {
          imgnum: 2,
          guess: "3",
          icon: "x",
          direction: "outward",
          color_scheme: "two-tone",
        },
        {
          imgnum: 3,
          guess: "4",
          icon: "x",
          direction: "outward",
          color_scheme: "green",
        },
        {
          imgnum: 4,
          guess: "5",
          icon: "heart",
          direction: "outward",
          color_scheme: "yellow",
        },
        {
          imgnum: 5,
          guess: "6",
          icon: "x",
          direction: "outward",
          color_scheme: "blue",
        },
        {
          imgnum: 6,
          guess: "7",
          icon: "heart",
          direction: "outward",
          color_scheme: "yellow",
        },
        {
          imgnum: 7,
          guess: "8",
          icon: "x",
          direction: "outward",
          color_scheme: "blue",
        },
        {
          imgnum: 8,
          guess: "9",
          icon: "none",
          direction: "inward",
          color_scheme: "purple",
        },
        {
          imgnum: 9,
          guess: "10",
          icon: "none",
          direction: "outward",
          color_scheme: "yellow",
        },
        {
          imgnum: 10,
          guess: "11",
          icon: "sol",
          direction: "outward",
          color_scheme: "green",
        },
        {
          imgnum: 11,
          guess: "12",
          icon: "wink",
          direction: "inward",
          color_scheme: "red",
        },
        {
          imgnum: 12,
          guess: "13",
          icon: "heart",
          direction: "outward",
          color_scheme: "yellow",
        },
        {
          imgnum: 13,
          guess: "14",
          icon: "x",
          direction: "outward",
          color_scheme: "two-tone",
        },
        {
          imgnum: 14,
          guess: "15",
          icon: "x",
          direction: "outward",
          color_scheme: "two-tone",
        },
        {
          imgnum: 15,
          guess: "16",
          icon: "x",
          direction: "outward",
          color_scheme: "two-tone",
        },
        {
          imgnum: 16,
          guess: "17",
          icon: "wink",
          direction: "inward",
          color_scheme: "red",
        },
        {
          imgnum: 17,
          guess: "18",
          icon: "x",
          direction: "outward",
          color_scheme: "two-tone",
        },
        {
          imgnum: 18,
          guess: "19",
          icon: "sol",
          direction: "outward",
          color_scheme: "two-tone",
        },
        {
          imgnum: 19,
          guess: "20",
          icon: "sol",
          direction: "outward",
          color_scheme: "blue",
        },
        {
          imgnum: 20,
          guess: "21",
          icon: "heart",
          direction: "inward",
          color_scheme: "red",
        },
        {
          imgnum: 21,
          guess: "22",
          icon: "sol",
          direction: "outward",
          color_scheme: "two-tone",
        },
        {
          imgnum: 22,
          guess: "23",
          icon: "none",
          direction: "inward",
          color_scheme: "blue",
        },
        {
          imgnum: 23,
          guess: "24",
          icon: "wink",
          direction: "inward",
          color_scheme: "two-tone",
        },
        {
          imgnum: 24,
          guess: "25",
          icon: "wink",
          direction: "inward",
          color_scheme: "two-tone",
        },
      ];
      const details = detailsArray[imgnum];

      // Load the image from the stored file
      const image = await readFile(`../img/${details.imgnum}.gif`);

      // Create a generic file with the image content
      const genericFile = createGenericFile(image, "rug", {
        contentType: "image/gif",
      });

      // Upload the image via the umi Irys uploader
      const [myUri] = await umi.uploader.upload([genericFile]);
      console.log("Your image URI: ", myUri);

      try {
        const image = myUri;
        const metadata = {
          name: `Rare Rug Emporium`,
          symbol: "RRE",
          description:
            "A rare rug won by being the first to guess a unique number.",
          image,
          animation_url: myUri,
          attributes: [
            { trait_type: "guess", value: details.guess },
            { trait_type: "icon", value: details.icon },
            { trait_type: "direction", value: details.direction },
            { trait_type: "color_scheme", value: details.color_scheme },
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
        const jsonUri = await umi.uploader.uploadJson(metadata);
        console.log("Your json URI: ", jsonUri);

        const mint = generateSigner(umi);
        const collection = await fetchCollection(umi, collectionAddress);

        try {
          const result = await create(umi, {
            asset: mint,
            collection: collection,
            name: `Rare Rug Emporium`,
            uri: jsonUri,
            plugins: [
              {
                type: "Royalties",
                basisPoints: 700,
                creators: [
                  {
                    address: signer.publicKey,
                    percentage: 100,
                  },
                ],
                ruleSet: ruleSet("None"), // Compatibility rule set
              },
              {
                type: "Attributes",
                attributeList: [
                  { key: "guess", value: details.guess },
                  { key: "icon", value: details.icon },
                  { key: "direction", value: details.direction },
                  { key: "color_scheme", value: details.color_scheme },
                ],
              },
            ],
          }).sendAndConfirm(umi);

          const signature = base58.encode(result.signature);

          console.log(
            `Succesfully Minted! Check out your TX here:\nhttps://explorer.solana.com/tx/${signature}?cluster=devnet`
          );
          console.log("Mint Number: ", i);
          console.log("Mint Address: ", mint.publicKey);
          array.push(mint.publicKey);
        } catch (error) {
          console.log("Oops.. Something went wrong", error);
        }
      } catch (error) {
        console.log("Oops.. Something went wrong", error);
      }
    } catch (error) {
      console.log("Oops.. Something went wrong", error);
    }
  }

  console.log("Mint Addresses: ", array);
})();

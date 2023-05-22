import { Connection } from "@solana/web3.js"
import { keypair } from "./wallet"
import { Metaplex, keypairIdentity, bundlrStorage, toMetaplexFile } from "@metaplex-foundation/js"
import { readFile } from "fs/promises"

// Create a devnet connection
const connection = new Connection("https://api.devnet.solana.com", 'finalized');

const metaplex = Metaplex.make(connection).use(keypairIdentity(keypair)).use(bundlrStorage({
    address: 'https://devnet.bundlr.network',
    providerUrl: "https://api.devnet.solana.com",
    timeout: 60000,
}));

(async () => {
    try {
        const image = await readFile("./images/generug.png");
 
        const metaplex_image = toMetaplexFile(image, "generug.png");

        const uri = await metaplex.storage().upload(metaplex_image);
        console.log(uri);
    }
    catch(error) {
        console.log("Oops.. Something went wrong", error);
    }
})();
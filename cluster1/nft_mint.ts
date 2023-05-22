import { Commitment, Connection, Keypair } from "@solana/web3.js"
import { keypair } from "./wallet"
import { Metaplex, keypairIdentity, bundlrStorage } from "@metaplex-foundation/js"

// Create a devnet connection
const connection = new Connection("https://api.devnet.solana.com", 'confirmed');

const metaplex = Metaplex.make(connection).use(keypairIdentity(keypair)).use(bundlrStorage({
    address: 'https://devnet.bundlr.network',
    providerUrl: 'https://api.devnet.solana.com',
    timeout: 60000,
}));

(async () => {
    try {
        const mint = await metaplex.nfts().create({
            uri: "https://arweave.net/8AIEGXpsyleGr2lRWg5_-No7pPitdKcGglJIj92t82w",
            name: "Supa Rug",
            symbol: "rug",
            creators: [
                {
                    address: keypair.publicKey,
                    share: 100,
                }
            ],
            sellerFeeBasisPoints: 100,
            isMutable: true,
        });

        console.log(mint.nft.address);

    }
    catch(error) {
        console.log("Oops.. Something went wrong", error);
    }
})();
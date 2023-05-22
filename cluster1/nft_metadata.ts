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
        const { uri } = await metaplex.nfts().uploadMetadata({
            name: "Supa Rug",
            symbol: "rug",
            description: "What a rug!",
            image: "https://arweave.net/3Kylk7xvCZyEpGLF-fsZQg3_GBfYNebv1rUm2T4Q9yM",
            attributes: [
                {trait_type: 'Feature', value: 'Cenas'},
                {trait_type: 'Style', value: 'Cenas'},
                {trait_type: 'Background', value: 'Cenas'},
            ],
            properties: {
                files: [
                    {
                        type: "image/png",
                        uri: "https://arweave.net/3Kylk7xvCZyEpGLF-fsZQg3_GBfYNebv1rUm2T4Q9yM"
                    }
                ]
            },
            creators: [
                {
                    address: keypair.publicKey.toBase58(),
                    share: 100,
                }
            ]
        })
        console.log(uri);
    }
    catch(error) {
        console.log("Oops.. Something went wrong", error);
    }
})();
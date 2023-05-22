import { Commitment, Connection, Keypair, PublicKey, Transaction, sendAndConfirmTransaction } from "@solana/web3.js"
import {keypair} from "./wallet";
import { createCreateMetadataAccountV2Instruction, createCreateMetadataAccountV3Instruction } from "@metaplex-foundation/mpl-token-metadata";

//Create a Solana devnet connection
const commitment: Commitment = "confirmed";
const connection = new Connection("https://api.devnet.solana.com", commitment);

// Define our Mint address
const mint = new PublicKey("EoiL2ir7L7RaKd55yhqG84UYE92ugsVW5JYsKHqEf8s1") //5tfr6ZxbRsWhTPeS4nSV8qAjA2BSb3V71oQSKi6aA773

// Add the Token Metadata Program
const token_metadata_program_id = new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s')

// Create PDA for token metadata
const metadata_seeds = [
    Buffer.from('metadata'),
    token_metadata_program_id.toBuffer(),
    mint.toBuffer(),
];
const [metadata_pda, _bump] = PublicKey.findProgramAddressSync(metadata_seeds, token_metadata_program_id);

(async () => {
    try {
        // Start here
        let tx = new Transaction().add(
            createCreateMetadataAccountV3Instruction({
                metadata: metadata_pda,
                mint: mint,
                mintAuthority: keypair.publicKey,
                payer: keypair.publicKey,
                updateAuthority: keypair.publicKey,
            },
            {
                createMetadataAccountArgsV3: {
                    data: {
                        name: "Vinci World Mega Token",
                        symbol: "VINCI",
                        uri: "",
                        sellerFeeBasisPoints: 100,
                        creators: [
                            {address: keypair.publicKey, verified: false, share: 100}
                        ],
                        collection: null,
                        uses: null,
                    
                    },
                    isMutable: true,
                    collectionDetails: null,
                }
            })
        );

        //Sign the transaction
        let txhash = await sendAndConfirmTransaction(connection, tx, [keypair]);
        console.log("Fungible Token Minted - Transaction ID: ", txhash)
    } catch(e) {
        console.error(`Oops, something went wrong: ${e}`)
    }
})();
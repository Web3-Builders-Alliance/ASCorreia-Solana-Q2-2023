import { Connection, Keypair, SystemProgram, PublicKey } from "@solana/web3.js"
import * as anchor from "@project-serum/anchor";
import { WbaPrereq, IDL } from "./programs/wba_prereq";
import * as bs58 from "bs58";

// Convert private key string to a Uint8Array
const b = bs58.decode('privatekey');
const j = new Uint8Array(b.buffer, b.byteOffset, b.byteLength / Uint8Array.BYTES_PER_ELEMENT);
const keypair = anchor.web3.Keypair.fromSecretKey(j);

// Create a devnet connection
const connection = new Connection("https://api.devnet.solana.com");

// Github account
const github = Buffer.from("ASCorreia", "utf8");

// Create our anchor provider
const provider = new anchor.AnchorProvider(connection, new anchor.Wallet(keypair), { commitment: "confirmed"});

// Create our program
const program = new anchor.Program<WbaPrereq>(IDL, "HC2oqz2p6DEWfrahenqdq2moUcga9c9biqRBcdK3XKU1" as anchor.Address, provider);

// Create the PDA for our enrollment account
const enrollment_seeds = [Buffer.from("prereq"), keypair.publicKey.toBuffer()];
const [enrollment_key, _bump] = PublicKey.findProgramAddressSync(enrollment_seeds, program.programId);

// Execute our enrollment transaction
(async () => {
    try {
        const txhash = await program.methods
        .complete(github)
        .accounts({
            signer: keypair.publicKey,
            prereq: enrollment_key,
            systemProgram: SystemProgram.programId,
        })
        .signers([
            keypair
        ]).rpc();
        console.log(`Success! Check out your TX here: 
        https://explorer.solana.com/tx/${txhash}?cluster=devnet`);
    } catch(e) {
        console.error(`Oops, something went wrong: ${e}`)
    }
})();
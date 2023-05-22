import { Connection, SystemProgram, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js"
import * as anchor from "@project-serum/anchor";
import { WbaVault, IDL } from "./programs/wba_vault";
import {keypair} from "./wallet";
import { BN } from "@project-serum/anchor";

// Create a devnet connection
const connection = new Connection("https://api.devnet.solana.com");

// Create our anchor provider
const provider = new anchor.AnchorProvider(connection, new anchor.Wallet(keypair), { commitment: "confirmed"});

// Create our program
const program = new anchor.Program<WbaVault>(IDL, "D51uEDHLbWAxNfodfQDv7qkp8WZtxrhi3uganGbNos7o" as anchor.Address, provider);

// Create a new keypair
const vaultState = new PublicKey("8WaBu7CoaFRshsbmNueh5QvUJFmbG3sZkMYLPworMXD7");

// Create the PDA for our vault auth
const vaultAuth_seeds = [Buffer.from("auth"), vaultState.toBuffer()];
const [vaultAuth_key, _bump] = PublicKey.findProgramAddressSync(vaultAuth_seeds, program.programId);

// Create the PDA for our vault
const vault_seeds = [Buffer.from("vault"), vaultAuth_key.toBuffer()];
const [vault_key, _anotherBump] = PublicKey.findProgramAddressSync(vault_seeds, program.programId);

// Execute our enrollment transaction
(async () => {
    try {
        const txhash = await program.methods
        .deposit(new BN(0.1 * LAMPORTS_PER_SOL))
        .accounts({
            owner: keypair.publicKey,
            vaultState: vaultState,
            vaultAuth: vaultAuth_key,
            vault: vault_key,
            systemProgram: SystemProgram.programId,
        })
        .signers([
            keypair,
        ]).rpc();
        console.log(`Success! Check out your TX here: 
        https://explorer.solana.com/tx/${txhash}?cluster=devnet`);
    } catch(e) {
        console.error(`Oops, something went wrong: ${e}`)
    }
})();
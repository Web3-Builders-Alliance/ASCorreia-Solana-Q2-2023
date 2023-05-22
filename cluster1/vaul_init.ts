import { Connection, Keypair, SystemProgram, PublicKey } from "@solana/web3.js"
import * as anchor from "@project-serum/anchor";
import { WbaVault, IDL } from "./programs/wba_vault";
import * as bs58 from "bs58";
import {keypair} from "./wallet";

// Create a devnet connection
const connection = new Connection("https://api.devnet.solana.com");

// Create our anchor provider
const provider = new anchor.AnchorProvider(connection, new anchor.Wallet(keypair), { commitment: "confirmed"});

// Create our program
const program = new anchor.Program<WbaVault>(IDL, "D51uEDHLbWAxNfodfQDv7qkp8WZtxrhi3uganGbNos7o" as anchor.Address, provider);

// Create a new keypair
const vaultState = Keypair.generate();
console.log("Vault State Public Key: ", vaultState.publicKey.toBase58());

// Create the PDA for our vault auth
const vaultAuth_seeds = [Buffer.from("auth"), vaultState.publicKey.toBuffer()];
const [vaultAuth_key, _bump] = PublicKey.findProgramAddressSync(vaultAuth_seeds, program.programId);

// Create the PDA for our vault
const vault_seeds = [Buffer.from("vault"), vaultAuth_key.toBuffer()];
const [vault_key, _anotherBump] = PublicKey.findProgramAddressSync(vault_seeds, program.programId);

// Execute our enrollment transaction
(async () => {
    try {
        const txhash = await program.methods
        .initialize()
        .accounts({
            owner: keypair.publicKey,
            vaultState: vaultState.publicKey,
            vaultAuth: vaultAuth_key,
            vault: vault_key,
            systemProgram: SystemProgram.programId,
        })
        .signers([
            keypair,
            vaultState,
        ]).rpc();
        console.log(`Success! Check out your TX here: 
        https://explorer.solana.com/tx/${txhash}?cluster=devnet`);
    } catch(e) {
        console.error(`Oops, something went wrong: ${e}`)
    }
})();
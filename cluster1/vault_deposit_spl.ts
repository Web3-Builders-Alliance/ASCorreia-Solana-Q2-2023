import { Connection, SystemProgram, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js"
import * as anchor from "@project-serum/anchor";
import { WbaVault, IDL } from "./programs/wba_vault";
import {keypair} from "./wallet";
import { BN } from "@project-serum/anchor";
import { TOKEN_PROGRAM_ID, getOrCreateAssociatedTokenAccount } from "@solana/spl-token";
import { ASSOCIATED_PROGRAM_ID } from "@project-serum/anchor/dist/cjs/utils/token";

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

//Create mint public key
let mint = new PublicKey("EoiL2ir7L7RaKd55yhqG84UYE92ugsVW5JYsKHqEf8s1");

// Execute our enrollment transaction
(async () => {
    //create our associated token account
    let ataFrom = await getOrCreateAssociatedTokenAccount(connection, keypair, mint, keypair.publicKey);
    //create the recipient token account
    let ataTo = await getOrCreateAssociatedTokenAccount(connection, keypair, mint, vaultAuth_key, true); //probably vault_key

    console.log("Vault Key: ", vault_key);

    try {
        const txhash = await program.methods
        .depositSpl(new BN(0.1))
        .accounts({
            owner: keypair.publicKey,
            vaultState: vaultState,
            vaultAuth: vaultAuth_key,
            systemProgram: SystemProgram.programId,
            ownerAta: ataFrom.address,
            vaultAta: ataTo.address,
            tokenMint: mint,
            tokenProgram: TOKEN_PROGRAM_ID,
            associatedTokenProgram: ASSOCIATED_PROGRAM_ID,
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
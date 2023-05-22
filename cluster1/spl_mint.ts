import * as web3 from "@solana/web3.js";
import {keypair} from "./wallet";
import * as spl from"@solana/spl-token";

// Create a devnet connection
let connection = new web3.Connection("https://api.devnet.solana.com", 'finalized');

(async () => {
    //Create mint public key
    let mint = new web3.PublicKey("EoiL2ir7L7RaKd55yhqG84UYE92ugsVW5JYsKHqEf8s1");

    //create our associated token account
    let ata = await spl.getOrCreateAssociatedTokenAccount(connection, keypair, mint, keypair.publicKey);

    //Log our ATA
    console.log("ATA created: ", ata.address);

    //Mint SPL Tokens to our account (ATA)
    let tx = await spl.mintTo(connection, keypair, mint, ata.address, keypair, 1_000_000 * 1);

    //Log our mint transaction
    console.log("Token minted: ", tx);
})();
import * as web3 from "@solana/web3.js";
import {keypair} from "./wallet";
import * as spl from"@solana/spl-token";

// Create a devnet connection
let connection = new web3.Connection("https://api.devnet.solana.com", 'finalized');

(async () => {
    //Create mint public key
    let mint = new web3.PublicKey("EoiL2ir7L7RaKd55yhqG84UYE92ugsVW5JYsKHqEf8s1");

    //Create recipient public key
    let recipient = new web3.PublicKey("CQ7gTuJ4pMpAKKZurEmLMjGMif82xwPL6aoHyXjgramX");

    //create our associated token account
    let ataFrom = await spl.getOrCreateAssociatedTokenAccount(connection, keypair, mint, keypair.publicKey);

    //create the recipient token account
    let ataTo = await spl.getOrCreateAssociatedTokenAccount(connection, keypair, mint, recipient);

    //Log our ATA
    console.log("ATA created: ", ataFrom.address);

    //Mint SPL Tokens to our account (ATA)
    let tx = await spl.transfer(connection, keypair, ataFrom.address, ataTo.address, keypair, 1_000_000 * 1);

    //Log our mint transaction
    console.log("Token minted: ", tx);
})();
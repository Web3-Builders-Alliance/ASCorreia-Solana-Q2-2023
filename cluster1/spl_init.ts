import * as web3 from "@solana/web3.js";
import {keypair} from "./wallet";
import * as spl from"@solana/spl-token";

// Create a devnet connection
let connection = new web3.Connection("https://api.devnet.solana.com", 'finalized');

(async() => {
    //Create a new mint account with our wallet as init payer, mint authority and freeze authority
    let mint = await spl.createMint(connection, keypair, keypair.publicKey, keypair.publicKey, 6);

    //Log our mint account
    console.log("Mint ID: ", mint.toString());
})();
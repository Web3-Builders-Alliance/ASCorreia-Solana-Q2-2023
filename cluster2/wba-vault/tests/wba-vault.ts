import * as anchor from "@project-serum/anchor";
import { BN, Program } from "@project-serum/anchor";
import { WbaVault } from "../target/types/wba_vault";
import { Connection, clusterApiUrl, ConfirmOptions, PublicKey, SystemProgram, LAMPORTS_PER_SOL} from "@solana/web3.js";
import { TOKEN_PROGRAM_ID, createMint, getAccount, getOrCreateAssociatedTokenAccount, mintTo } from "@solana/spl-token";
import { ASSOCIATED_PROGRAM_ID } from "@project-serum/anchor/dist/cjs/utils/token";

describe("wba-vault", async () => {
  // Configure the client to use the local cluster.
  anchor.AnchorProvider.env().opts.commitment = "finalized";
  anchor.setProvider(anchor.AnchorProvider.env());
  const provider = anchor.getProvider();

  const program = anchor.workspace.WbaVault as Program<WbaVault>;

  // Generate new keypair
  const keypair = anchor.web3.Keypair.generate();
  console.log("Keypair Pubkey: ", keypair.publicKey.toBase58());

  const connection = new Connection("https://api.devnet.solana.com");

  // Create a new keypair
  const vaultState = anchor.web3.Keypair.generate();
  console.log("Vault State Public Key: ", vaultState.publicKey.toBase58());

  // Create the PDA for our vault auth
  const vaultAuth_seeds = [Buffer.from("auth"), vaultState.publicKey.toBuffer()];
  const [vaultAuth_key, _bump] = PublicKey.findProgramAddressSync(vaultAuth_seeds, program.programId);

  // Create the PDA for our vault
  const vault_seeds = [Buffer.from("vault"), vaultAuth_key.toBuffer()];
  const [vault_key, _anotherBump] = PublicKey.findProgramAddressSync(vault_seeds, program.programId);

  it("Airdrop token", async() => {
    const txhash = await provider.connection.requestAirdrop(keypair.publicKey, 2 * LAMPORTS_PER_SOL);

    let latestBlockHash = await provider.connection.getLatestBlockhash()
    await provider.connection.confirmTransaction({
      blockhash: latestBlockHash.blockhash,
      lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
      signature: txhash,
    });

    console.log(`Success! Check out your TX here: 
      https://explorer.solana.com/tx/${txhash}?cluster=devnet`);
  });

  it("Is initialized!", async () => {
    // Add your test here.
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
  });

  it("Deposit 1.5 SOL!", async () => {
    // Add your test here.
    try {
      const txhash = await program.methods
      .deposit(new BN(1.5 * LAMPORTS_PER_SOL))
      .accounts({
          owner: keypair.publicKey,
          vaultState: vaultState.publicKey,
          vaultAuth: vaultAuth_key,
          vault: vault_key,
          systemProgram: SystemProgram.programId,
      })
      .signers([
          keypair,
      ]).rpc({
        skipPreflight: true,
      });
      console.log(`Success! Check out your TX here: 
      https://explorer.solana.com/tx/${txhash}?cluster=devnet`);
      let accountBalance = await provider.connection.getBalance(vault_key);
      console.log("\nVault Balance: ", accountBalance);
    } catch(e) {
      console.error(`Oops, something went wrong: ${e}`)
    }
  });

  it("Withdraw 1 SOL!", async () => {
    // Add your test here.
    try {
      const txhash = await program.methods
      .withdraw(new BN(1 * LAMPORTS_PER_SOL))
      .accounts({
          owner: keypair.publicKey,
          vaultState: vaultState.publicKey,
          vaultAuth: vaultAuth_key,
          vault: vault_key,
          systemProgram: SystemProgram.programId,
      })
      .signers([
          keypair,
      ]).rpc();
      console.log(`Success! Check out your TX here: 
      https://explorer.solana.com/tx/${txhash}?cluster=devnet`);
      let accountBalance = await provider.connection.getBalance(vault_key);
      console.log("\nVault Balance: ", accountBalance);
    } catch(e) {
      console.error(`Oops, something went wrong: ${e}`)
    }
  });

  it("Deposit SPL", async () => {
    // Add your test here.
    //Create a new mint account with our wallet as init payer, mint authority and freeze authority
    let mint = await createMint(provider.connection, keypair, keypair.publicKey, keypair.publicKey, 6);
    console.log("Mint ID: ", mint.toString());

    //create our associated token account
    let ataFrom = await getOrCreateAssociatedTokenAccount(provider.connection, keypair, mint, keypair.publicKey);
    console.log("ATA From: ", ataFrom.address.toString());

    //create the recipient token account
    let ataTo = await getOrCreateAssociatedTokenAccount(provider.connection, keypair, mint, vaultAuth_key, true);
    console.log("ATA To: ", ataTo.address.toString());

    //Mint SPL Tokens to our account (ATA)
    let tx = await mintTo(provider.connection, keypair, mint, ataFrom.address, keypair, 1_000_000 * 1);

    //Log our mint transaction
    console.log("Token minted: ", tx);

    try {
      const txhash = await program.methods
      .depositSpl(new BN(1 * 1_000_000))
      .accounts({
        owner: keypair.publicKey,
        vaultState: vaultState.publicKey,
        vaultAuth: vaultAuth_key,
        systemProgram: SystemProgram.programId,
        ownerAta: ataFrom.address,
        vaultAta: ataTo.address,
        tokenMint: mint,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([
          keypair,
      ]).rpc();
      console.log(`Success! Check out your TX here: 
      https://explorer.solana.com/tx/${txhash}?cluster=devnet`);
      let accountBalance = (await provider.connection.getTokenAccountBalance(ataTo.address)).value.amount;
      console.log("\nSPL Balance: ", accountBalance);
    } catch(e) {
      console.error(`Oops, something went wrong: ${e}`)
    }
  });

  it("Withdraw SPL", async () => {
    // Add your test here.
    //Create a new mint account with our wallet as init payer, mint authority and freeze authority
    let mint = await createMint(provider.connection, keypair, keypair.publicKey, keypair.publicKey, 6);
    console.log("Mint ID: ", mint.toString());

    //create our associated token account
    let ataFrom = await getOrCreateAssociatedTokenAccount(provider.connection, keypair, mint, keypair.publicKey);
    console.log("ATA From: ", ataFrom.address.toString());

    //create the recipient token account
    let ataTo = await getOrCreateAssociatedTokenAccount(provider.connection, keypair, mint, vaultAuth_key, true);
    console.log("ATA To: ", ataFrom.address.toString());

    //Mint SPL Tokens to our account (ATA)
    let tx = await mintTo(provider.connection, keypair, mint, ataFrom.address, keypair, 1_000_000 * 1);

    //Log our mint transaction
    console.log("Token minted: ", tx);

    try {
      const txhash = await program.methods
      .depositSpl(new BN(1 * 1_000_000))
      .accounts({
        owner: keypair.publicKey,
        vaultState: vaultState.publicKey,
        vaultAuth: vaultAuth_key,
        systemProgram: SystemProgram.programId,
        ownerAta: ataFrom.address,
        vaultAta: ataTo.address,
        tokenMint: mint,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([
          keypair,
      ]).rpc();
      console.log(`\nSPL Deposit Success! Check out your TX here: 
      https://explorer.solana.com/tx/${txhash}?cluster=devnet`);
      let accountBalance = (await provider.connection.getTokenAccountBalance(ataTo.address)).value.amount;
      console.log("SPL Balance: ", accountBalance);
    } catch(e) {
      console.error(`Oops, something went wrong: ${e}`)
    }

    try {
      const txhash = await program.methods
      .withdrawSpl(new BN(1 * 1_000_000))
      .accounts({
        owner: keypair.publicKey,
        vaultState: vaultState.publicKey,
        vaultAuth: vaultAuth_key,
        systemProgram: SystemProgram.programId,
        ownerAta: ataFrom.address,
        vaultAta: ataTo.address,
        tokenMint: mint,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([
          keypair,
      ]).rpc();
      console.log(`\n\nSPL Withdraw Success! Check out your TX here: 
      https://explorer.solana.com/tx/${txhash}?cluster=devnet`);
      let accountBalance = (await provider.connection.getTokenAccountBalance(ataTo.address)).value.amount;
      console.log("SPL Balance: ", accountBalance);
    } catch(e) {
      console.error(`Oops, something went wrong: ${e}`)
    }
  });
});

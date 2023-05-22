use anchor_lang::prelude::*;
use anchor_lang::{system_program::transfer};
use anchor_lang::solana_program::program::{invoke_signed};
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token::{TokenAccount, Token};

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

#[program]
pub mod wba_vault {
    use solana_program::system_instruction::transfer;

    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        let vault_state = &mut ctx.accounts.vault_state;
        
        vault_state.owner = *ctx.accounts.owner.key;
        vault_state.auth_bump = *ctx.bumps.get("vault_auth").unwrap();
        vault_state.vault_bump = *ctx.bumps.get("vault").unwrap();
        vault_state.score = 0;
        
        Ok(())
    }

    pub fn deposit(ctx: Context<Deposit>, amount: u64) -> Result<()> {
        let cpi_program = ctx.accounts.system_program.to_account_info();
        let cpi_accounts = anchor_lang::system_program::Transfer {
            from: ctx.accounts.owner.to_account_info(),
            to: ctx.accounts.vault.to_account_info(),
        };
        let cpi_context = CpiContext::new(cpi_program, cpi_accounts);

        anchor_lang::system_program::transfer(cpi_context, amount)?;
        
        Ok(())
    }

    pub fn withdraw(ctx: Context<Withdraw>, amount: u64) -> Result<()> {
        let cpi_program = ctx.accounts.system_program.to_account_info();
        let cpi_accounts = anchor_lang::system_program::Transfer {
            from: ctx.accounts.vault.to_account_info(),
            to: ctx.accounts.owner.to_account_info(),
        };
        let seeds = &[
            "vault".as_bytes(),
            &ctx.accounts.vault_auth.key().clone().to_bytes(),
            &[ctx.accounts.vault_state.vault_bump]
        ];
        let signer_seeds = &[&seeds[..]];
        let cpi_context = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer_seeds);

        anchor_lang::system_program::transfer(cpi_context, amount)?;
        
        Ok(())
    }

    pub fn withdraw2(ctx: Context<Withdraw>, amount: u64) -> Result<()> {
        let auth_key = ctx.accounts.vault_auth.key();
        let seeds = &[
            "vault".as_bytes(),
            auth_key.as_ref(),
            &[ctx.accounts.vault_state.auth_bump]
        ];

        let transfer_instruction = &solana_program::system_instruction::transfer(&ctx.accounts.vault.key(), &ctx.accounts.owner.key(), amount);

        invoke_signed(transfer_instruction, &[ctx.accounts.vault.to_account_info(), ctx.accounts.owner.to_account_info()], &[seeds])?;
        
        Ok(())
    }

    /*pub fn deposit_spl(ctx: Context<DepositSpl>, amount: u64) -> Result<()> {
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_accounts = anchor_spl::token::Transfer {
            from: ctx.accounts.owner_ata.to_account_info(),
            to: ctx.accounts.vault_ata.to_account_info(),
            authority: ctx.accounts.owner.to_account_info(),
        };
        let cpi_context = CpiContext::new(cpi_program, cpi_accounts);

        anchor_spl::token::transfer(cpi_context, amount)?;
        
        Ok(())
    }*/

    pub fn deposit_spl(ctx: Context<DepositSpl>, amount: u64) -> Result<()> {
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_context = CpiContext::new(cpi_program, anchor_spl::token::Transfer {
            from: ctx.accounts.owner_ata.to_account_info(),
            to: ctx.accounts.vault_ata.to_account_info(),
            authority: ctx.accounts.owner.to_account_info(),
        });

        anchor_spl::token::transfer(cpi_context, amount)?;
        
        Ok(())
    }

    pub fn withdraw_spl(ctx: Context<WithdrawSpl>, amount: u64) -> Result<()> {
        let seeds = &[
            "auth".as_bytes(),
            &ctx.accounts.vault_state.key().clone().to_bytes(),
            &[ctx.accounts.vault_state.auth_bump]
        ];
        let signer_seeds = &[&seeds[..]];

        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_accounts = anchor_spl::token::Transfer {
            from: ctx.accounts.vault_ata.to_account_info(),
            to: ctx.accounts.owner_ata.to_account_info(),
            authority: ctx.accounts.vault_auth.to_account_info(),
        };

        let cpi_context = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer_seeds);

        anchor_spl::token::transfer(cpi_context, amount)?;
        

        Ok(())
    }
}
#[derive(Accounts)]
pub struct Deposit<'info> {
    #[account(mut)]
    pub vault_state: Account<'info, VaultState>,
    #[account(seeds = [b"auth", vault_state.key().as_ref()], bump)]
    /// CHECK: Don't need to check this
    pub vault_auth: UncheckedAccount<'info>,
    #[account(mut, seeds = [b"vault", vault_auth.key().as_ref()], bump)]
    pub vault: SystemAccount<'info>,
    pub system_program: Program<'info, System>,
    #[account(mut)]
    pub owner: Signer<'info>
}

#[derive(Accounts)]
pub struct DepositSpl<'info> {
    #[account(mut)]
    pub vault_state: Account<'info, VaultState>,
    #[account(seeds = [b"auth", vault_state.key().as_ref()], bump)]
    /// CHECK: Don't need to check this
    pub vault_auth: UncheckedAccount<'info>,
    #[account(mut)]
    pub owner_ata: Account<'info, TokenAccount>,
    #[account(mut)]
    pub vault_ata: Account<'info, TokenAccount>,
    /// CHECK: Don't need to check this
    pub token_mint: UncheckedAccount<'info>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    #[account(mut)]
    pub owner: Signer<'info>
}

#[derive(Accounts)]
pub struct Withdraw<'info> {
    #[account(mut, has_one = owner)]
    pub vault_state: Account<'info, VaultState>,
    #[account(seeds = [b"auth", vault_state.key().as_ref()], bump)]
    /// CHECK: Don't need to check this
    pub vault_auth: UncheckedAccount<'info>,
    #[account(mut, seeds = [b"vault", vault_auth.key().as_ref()], bump)]
    pub vault: SystemAccount<'info>,
    pub system_program: Program<'info, System>,
    #[account(mut)]
    pub owner: Signer<'info>
}

#[derive(Accounts)]
pub struct WithdrawSpl<'info> {
    #[account(mut, has_one = owner)]
    pub vault_state: Account<'info, VaultState>,
    #[account(seeds = [b"auth", vault_state.key().as_ref()], bump)]
    /// CHECK: Don't need to check this
    pub vault_auth: UncheckedAccount<'info>,
    #[account(mut)]
    pub owner_ata: Account<'info, TokenAccount>,
    #[account(mut)]
    pub vault_ata: Account<'info, TokenAccount>,
    /// CHECK: Don't need to check this
    pub token_mint: UncheckedAccount<'info>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    #[account(mut)]
    pub owner: Signer<'info>
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(init, payer = owner, space = 8 + 32 + 1 + 1 + 1)]
    pub vault_state: Account<'info, VaultState>,
    #[account(seeds = [b"auth", vault_state.key().as_ref()], bump)]
    /// CHECK: Don't need to check this
    pub vault_auth: UncheckedAccount<'info>,
    #[account(seeds = [b"vault", vault_auth.key().as_ref()], bump)]
    pub vault: SystemAccount<'info>,
    pub system_program: Program<'info, System>,
    #[account(mut)]
    pub owner: Signer<'info>,
}

#[account]
pub struct VaultState {
    owner: Pubkey,
    auth_bump: u8,
    vault_bump: u8,
    score: u8,
}

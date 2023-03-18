use anchor_lang::prelude::*;

use crate::{constants::*, error::*, states::*};

use std::mem::size_of;

use anchor_spl::token::{ Mint, Token, TokenAccount };

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    pub reward_mint: Account<'info, Mint>,
    
    #[account(
        init,
        payer = authority,
        seeds = [ POOL_SEED, reward_mint.key().as_ref() ],
        bump,
        token::mint = reward_mint,
        token::authority = global_state,
    )]
    pub reward_vault: Box<Account<'info, TokenAccount>>,

    #[account(
        init,
        seeds = [GLOBAL_STATE_SEED],
        bump,
        payer = authority,
        space = 8 + size_of::<GlobalState>()
    )]
    pub global_state: Box<Account<'info, GlobalState>>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

impl<'info> Initialize<'info> {
    pub fn validate(&self) -> Result<()> {
        if self.global_state.is_initialized == 1 {
            require_keys_eq!(
                self.global_state.authority,
                self.authority.key(),
                StakingError::NotAllowedAuthority
            )
        }
        Ok(())
    }
}

#[access_control(ctx.accounts.validate())]
pub fn handler(ctx: Context<Initialize>, new_authority: Pubkey, nft_creator: Pubkey) -> Result<()> {
    let accts = ctx.accounts;
    accts.global_state.is_initialized = 1;
    accts.global_state.authority = new_authority;
    accts.global_state.nft_creator = nft_creator;
    accts.global_state.reward_vault = accts.reward_vault.key();
    accts.global_state.reward_mint = *accts.reward_mint.to_account_info().key;
    Ok(())
}
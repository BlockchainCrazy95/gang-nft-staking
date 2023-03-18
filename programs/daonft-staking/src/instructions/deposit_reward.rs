use anchor_lang::prelude::*;

use crate::{constants::*, states::*};

use anchor_spl::{
    token::{self, Mint, Token, TokenAccount, Transfer}
};

#[derive(Accounts)]
pub struct DepositReward<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(
        mut,
        seeds = [GLOBAL_STATE_SEED],
        bump
    )]
    pub global_state: Box<Account<'info, GlobalState>>,

    #[account(
        mut,
        token::mint = reward_mint,
        token::authority = global_state,
    )]
    pub reward_vault: Box<Account<'info, TokenAccount>>,

    // funder account
    #[account(mut)]
    user_token_ata: Account<'info, TokenAccount>,

    #[account(address = global_state.reward_mint)]
    pub reward_mint: Box<Account<'info, Mint>>,

    pub token_program: Program<'info, Token>,
}

impl<'info> DepositReward<'info> {
    fn deposit_reward_context(&self) -> CpiContext<'_, '_, '_, 'info, Transfer<'info>> {
        CpiContext::new(
            self.token_program.to_account_info(),
            Transfer {
                from: self.user_token_ata.to_account_info(),
                to: self.reward_vault.to_account_info(),
                authority: self.user.to_account_info()
            }
        )
    }
}

pub fn handler(ctx: Context<DepositReward>, amount: u64) -> Result<()> {
    let accts = ctx.accounts;
    token::transfer(
        accts.deposit_reward_context(),
        amount
    )?;

    Ok(())
}
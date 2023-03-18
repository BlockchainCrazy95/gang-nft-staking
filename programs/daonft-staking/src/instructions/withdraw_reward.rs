use anchor_lang::prelude::*;

use crate::{constants::*, states::*};

use anchor_spl::{
    associated_token::AssociatedToken,
    token::{self, Mint, Token, TokenAccount, Transfer}
};

#[derive(Accounts)]
pub struct WithdrawReward<'info> {
    #[account(mut)]
    admin: Signer<'info>,
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

    #[account(
        associated_token::mint = reward_mint,
        associated_token::authority = admin,
    )]
    reward_to_account: Box<Account<'info, TokenAccount>>,

    #[account(address = global_state.reward_mint)]
    pub reward_mint: Box<Account<'info, Mint>>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

impl<'info> WithdrawReward<'info> {
    fn withdraw_reward_context(&self) -> CpiContext<'_, '_, '_, 'info, Transfer<'info>> {
        CpiContext::new(
            self.token_program.to_account_info(),
            Transfer {
                from: self.reward_vault.to_account_info(),
                to: self.reward_to_account.to_account_info(),
                authority: self.global_state.to_account_info()
            }
        )
    }
}

pub fn handler(ctx: Context<WithdrawReward>) -> Result<()> {
    let accts = ctx.accounts;
    let vault_amount = accts.reward_vault.amount;
    if vault_amount > 0 {
        token::transfer(
            accts
                .withdraw_reward_context()
                .with_signer(reward_vault)
            ,
            amount
        )
    }
}
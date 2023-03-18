use anchor_lang::prelude::*;

use crate::{constants::*, states::*};

use anchor_spl::{
    associated_token::AssociatedToken,
    token::{self, Mint, Token, TokenAccount, Transfer}
};

#[derive(Accounts)]
pub struct ClaimReward<'info> {
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
        seeds = [USER_STATE_SEED, user.key().as_ref()],
        bump
    )]
    pub user_state: Box<Account<'info, UserState>>,

    #[account(
        mut,
        token::mint = reward_mint,
        token::authority = global_state,
    )]
    pub reward_vault: Box<Account<'info, TokenAccount>>,

    #[account(
        mut,
        associated_token::mint = reward_mint,
        associated_token::authority = user,
    )]
    pub user_token_ata: Box<Account<'info, TokenAccount>>,

    pub reward_mint: Box<Account<'info, Mint>>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

impl<'info> ClaimReward<'info> {
    fn validate(&self) -> Result<()> {
        Ok(())
    }

    fn claim_reward_context(&self) -> CpiContext<'_, '_, '_, 'info, Transfer<'info>> {
        CpiContext::new(
            self.token_program.to_account_info(),
            Transfer {
                from: self.reward_vault.to_account_info(),
                to: self.user_token_ata.to_account_info(),
                authority: self.global_state.to_account_info()
            }
        )
    }
}

#[access_control(ctx.accounts.validate())]
pub fn handler(ctx: Context<ClaimReward>) -> Result<()> {
    let accts = ctx.accounts;
    //transfer reward from pool to user
    accts.user_state.calculate_reward_amount()?;
    let reward_to_claim = accts.user_state.pending_reward as u64;
    accts.user_state.claimed_amount = u64::from(accts.user_state.claimed_amount)
        .checked_add(reward_to_claim)
        .unwrap();
    
    accts.user_state.pending_reward = 0;

    let bump = ctx.bumps.get("global_state").unwrap();

    token::transfer(
        accts
            .claim_reward_context()
            .with_signer(&[&[GLOBAL_STATE_SEED.as_ref(), &[*bump]]]),
        accts.user_state.staked_amount * 4
    )?;
    Ok(())
}
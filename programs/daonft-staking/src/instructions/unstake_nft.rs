use anchor_lang::prelude::*;

use crate::{constants::*, error::*, states::*};

use anchor_spl::{
    associated_token::AssociatedToken,
    token::{self, Mint, Token, TokenAccount, Transfer}
};

// use mpl_token_metadata::{state::Metadata, ID as MetadataProgramID};

#[derive(Accounts)]
pub struct UnstakeNft<'info> {
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
        associated_token::mint = nft_mint,
        associated_token::authority = global_state,
    )]
    pub pool_nft_ata: Box<Account<'info, TokenAccount>>,

    #[account(
        mut,
        associated_token::mint = nft_mint,
        associated_token::authority = user
    )]
    pub user_nft_ata: Box<Account<'info, TokenAccount>>,

    pub nft_mint: Box<Account<'info, Mint>>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

impl<'info> UnstakeNft<'info> {
    fn validate(&self) -> Result<()> {
        Ok(())
    }

    fn unstake_nft_context(&self) -> CpiContext<'_, '_, '_, 'info, Transfer<'info>> {
        CpiContext::new(
            self.token_program.to_account_info(),
            Transfer {
                from: self.pool_nft_ata.to_account_info(),
                to: self.user_nft_ata.to_account_info(),
                authority: self.global_state.to_account_info(),
            }
        )
    }
}

#[access_control(ctx.accounts.validate())]
pub fn handler(ctx: Context<UnstakeNft>) -> Result<()> {
    // let current_time = Clock::get()?.unix_timestamp as u64;

    let accts = ctx.accounts;
    
    let nft_idx = accts
        .user_state
        .potion_nfts
        .iter()
        .position(|&nft_key| nft_key.eq(&accts.nft_mint.key()));
    msg!("nft_idx={}", nft_idx.unwrap());

    // if(nft_idx.is_none() || nft_idx.unwrap() as u8 )
    if nft_idx.is_none() {
        return Err(error!(StakingError::UnknownNFT));
    }

    let index = nft_idx.unwrap() as usize;

    // verify lock period
    // msg!(
    //     "accts.user_state.last_claim_time[index] = {}",
    //     accts.user_state.last_claim_time[index]
    // );
    // let unstakable_time = accts.user_state.last_claim_time[index]
    //     .checked_add(LOCK_PERIOD)
    //     .unwrap();
    
    // require!(unstakable_time <= current_time, StakingError::NftLocked);

    let last_index: usize = (accts.user_state.staked_amount as usize) - 1;
    if index != last_index {
        accts.user_state.potion_nfts[index] = accts.user_state.potion_nfts[last_index as usize];
        accts.user_state.last_claim_time[index] = accts.user_state.last_claim_time[last_index as usize];
    }

    accts.user_state.staked_amount = accts.user_state.staked_amount - 1;

    let bump = ctx.bumps.get("global_state").unwrap();

    token::transfer(
        accts
            .unstake_nft_context()
            .with_signer(&[&[GLOBAL_STATE_SEED.as_ref(), &[*bump]]]),
        1
    )?;

    Ok(())
}
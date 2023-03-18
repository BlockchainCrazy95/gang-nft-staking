use anchor_lang::prelude::*;

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

/// constant
pub mod constants;
/// instructions
pub mod instructions;
/// error
pub mod error;
/// states
pub mod states;

use crate::instructions::*;

#[program]
pub mod daonft_staking {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>, new_authority: Pubkey, nft_creator: Pubkey) -> Result<()> {
        initialize::handler(ctx, new_authority, nft_creator)
    }

    pub fn init_user_state(ctx: Context<InitUserState>, user_key: Pubkey) -> Result<()> {
        init_user_state::handler(ctx, user_key)
    }
    
    pub fn stake_nft(ctx: Context<StakeNft>) -> Result<()> {
        stake_nft::handler(ctx)
    }

    pub fn unstake_nft(ctx: Context<UnstakeNft>) -> Result<()> {
        unstake_nft::handler(ctx)
    }

    pub fn claim_reward(ctx: Context<ClaimReward>) -> Result<()> {
        claim_reward::handler(ctx)
    }

    pub fn deposit_reward(ctx: Context<DepositReward>, amount: u64) -> Result<()> {
        deposit_reward::handler(ctx, amount)
    }
}
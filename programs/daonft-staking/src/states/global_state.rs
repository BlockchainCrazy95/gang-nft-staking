use anchor_lang::prelude::*;

#[account]
#[derive(Default)]
pub struct GlobalState {
    pub is_initialized: u8,
    pub authority: Pubkey,
    pub nft_creator: Pubkey,
    pub reward_vault: Pubkey,
    pub reward_mint: Pubkey
}
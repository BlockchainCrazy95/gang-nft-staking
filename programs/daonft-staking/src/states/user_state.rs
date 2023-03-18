use anchor_lang::prelude::*;

use crate::{constants::*};

#[account]
#[derive(Default)]
pub struct UserState {
    pub user: Pubkey,
    pub potion_nfts: [Pubkey; 30],
    pub last_claim_time: [u64; 30],
    pub staked_amount: u64,
    pub claimed_amount: u64,
    pub pending_reward: u64,
}

impl UserState {
    pub fn calculate_reward_amount<'info>(
        &mut self
    ) -> Result<()> {
        let mut pending_amount: u64 = 0;
        let current_time:u64 = Clock::get()?.unix_timestamp as u64;

        for i in 0..self.staked_amount as usize {
            if u64::from(current_time).checked_sub(self.last_claim_time[i]).unwrap() >= ONE_DAY {
                let reward_per_nft = current_time
                    .checked_sub(self.last_claim_time[i])
                    .unwrap()
                    .checked_div(ONE_DAY)
                    .unwrap()
                    .checked_mul(2)
                    .unwrap();
                pending_amount = u64::from(pending_amount).checked_add(reward_per_nft).unwrap();
                self.last_claim_time[i] = current_time;
            }
        }
        self.pending_reward = self.pending_reward.checked_add(pending_amount).unwrap();
        Ok(())
    }
}
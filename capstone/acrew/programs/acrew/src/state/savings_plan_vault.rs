use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct SavingsPlanVault {
    pub savings_plan: Pubkey,
    pub bump: u8,
}

use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct UserVault {
    pub user: Pubkey,
    pub savings_plan: Pubkey,
    pub active: bool,
    pub bump: u8,
}

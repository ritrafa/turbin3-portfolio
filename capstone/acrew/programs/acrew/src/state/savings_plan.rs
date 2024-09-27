use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct SavingsPlan {
    pub admin: Pubkey,
    #[max_len(28)]
    pub name: String,
    pub start: i64,    // Unix timestamp
    pub duration: i64, // Duration in seconds
    pub amount: u64,   // Amount in lamports
    pub bump: u8,
    pub participants: u64,
}

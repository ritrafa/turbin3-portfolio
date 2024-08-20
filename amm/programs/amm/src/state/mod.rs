use anchor_lang::prelude::Pubkey;

#[account]
#[derive(InitSpace)]
pub struct Config {
    seed: u64,
    fee: u16, // 10000 = 100%
    mint_x: Pubkey,
    mint_y: Pubkey,
    bump: u8,
    lp_bump: u8,
}

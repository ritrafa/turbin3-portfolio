use achor_lang::prelude::*;

#[account]
pub struct Listing {
    pub maker: Pubkey,
    pub mint: Pubkey,
    pub price: u64,
    pub bump: u8,
}

impl Space for Listing {
    const INIT_SPACE = 8 + 32 + 32 + 8 + 1; // descriminator + maker + mint + price + bump
}
use anchor_lang::prelude::*;

declare_id!("2VqNyUXrSjcrmBFsG7hHGsXpF7JBdvxagXWbBHP3Vuqs");

#[program]
pub mod nft_staking {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        msg!("Greetings from: {:?}", ctx.program_id);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}

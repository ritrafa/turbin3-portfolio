use anchor_lang::prelude::*;

declare_id!("2hnwrduyL5ppN6bUeN2x3GH7ygaBfvW9CoGHiCFL92Vt");

pub mod instructions;
pub use instructions::*;

pub mod state;
pub use state::*;

#[program]
pub mod anchor_escrow {
    use super::*;

    pub fn make(ctx: Context<Make>, seed: u64, deposit: u64, receive: u64) -> Result<()> {
        ctx.accounts.init_escrow(seed, receive, &ctx.bumps)?;
        ctx.accounts.deposit(deposit)?;

        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}

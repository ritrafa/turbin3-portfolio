use anchor_lang::prelude::*;

declare_id!("6rhV7UZi6QSUDz4rCQN83miCdbNDzdhF3zxyviYRk9nF");

#[program]
pub mod rng {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        msg!("Greetings from: {:?}", ctx.program_id);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}

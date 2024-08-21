use anchor_lang::prelude::*;

declare_id!("7RixFzDGibi3fiCJVVccUbqbtb6bkUZZdhLWazwyEks");

#[program]
pub mod marketplace {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        msg!("Greetings from: {:?}", ctx.program_id);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}

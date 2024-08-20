use anchor_lang::prelude::*;
pub mod context;

pub mod state;

declare_id!("FkoH9f76ocAMbc3jxXbADCCm8KfLkJwM62R7K6UiCzLP");

#[program]
pub mod amm {
    use super::*;

    // Initialize a pool
    pub fn initialize(
        ctx: Context<Initialize>,
        seed: u64,
        fee: u16,
        amount_x: u64,
        amount_y: u64,
    ) -> Result<()> {
        // Creating a curve
        ctx.accounts
            .save_config(seed, fee, ctx.bumps.config, ctx.bumps.mint_lp)?;
        ctx.accounts.deposit(amount_x, true)?;
        ctx.accounts.deposit(amount_y, false)?;
        ctx.accounts.mint_lp_tokens(amount_x, amount_y)?;

        Ok(())
    }

    // Add liquidity to the pool to receive lp tokens
    pub fn deposit(ctx: Context<Deposit>, amount: u64, max_x: u64, max_y: u64) -> Result<()> {
        // Deposit tokens(x, y)
        // Mint lp tokens

        Ok(())
    }

    pub fn withdraw(ctx: Context<Withdraw>, amount: u64, min_x: u64, min_y: u64) -> Result<()> {
        // Deposit lp tokens
        // Burn lp tokens
        // Withdraw tokens (you get x & y at current pool balance)

        Ok(())
    }

    pub fn swap(ctx: Context<Swap>, amount: u64, min_receive: u64, is_x: bool) -> Result<()> {
        // Swap tokens(x, y)

        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {
    #[account(mut)]
    signer: Signer<'info>,

    #[account(mut)]
    pub system_program: Program<'info, System>,
}

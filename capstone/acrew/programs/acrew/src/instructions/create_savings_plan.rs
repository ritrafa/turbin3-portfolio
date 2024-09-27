use anchor_lang::prelude::*;

use crate::state::*;
use crate::LAMPORTS_PER_SOL;

#[derive(Accounts)]
#[instruction(name: String, start: i64, duration: i64, amount: u64)]
pub struct CreateSavingsPlan<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,

    #[account(
        init,
        payer = admin,
        space = 8 + SavingsPlan::INIT_SPACE,
        seeds = [b"savings_plan", admin.key().as_ref(), name.as_bytes()],
        bump
    )]
    pub savings_plan: Account<'info, SavingsPlan>,

    #[account(
        init,
        payer = admin,
        space = 8 + SavingsPlanVault::INIT_SPACE,
        seeds = [b"savings_plan_vault", savings_plan.key().as_ref()],
        bump
    )]
    pub savings_plan_vault: Account<'info, SavingsPlanVault>,
    pub system_program: Program<'info, System>,
}

impl<'info> CreateSavingsPlan<'info> {
    pub fn create_savings_plan(
        &mut self,
        name: String,
        start: i64,
        duration: i64,
        amount: u64,
        bumps: &CreateSavingsPlanBumps,
    ) -> Result<()> {
        self.savings_plan.set_inner(SavingsPlan {
            admin: self.admin.key(),
            name,
            start,
            duration,
            amount,
            participants: 0,
            bump: bumps.savings_plan,
        });

        self.savings_plan_vault.set_inner(SavingsPlanVault {
            savings_plan: self.savings_plan.key(),
            bump: bumps.savings_plan_vault,
        });

        msg!("Savings plan created: {}", self.savings_plan.name);
        msg!(
            "Target amount: {} SOL",
            amount as f64 / LAMPORTS_PER_SOL as f64
        );
        msg!("Duration: {} days", duration / 86400); // 86400 seconds in a day

        Ok(())
    }
}

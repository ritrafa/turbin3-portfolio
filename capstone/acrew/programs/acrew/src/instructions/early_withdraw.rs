use crate::state::*;
use crate::LAMPORTS_PER_SOL;
use anchor_lang::prelude::*;
use anchor_lang::system_program;

#[derive(Accounts)]
pub struct EarlyWithdraw<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(mut)]
    pub savings_plan: Account<'info, SavingsPlan>,

    #[account(mut)]
    pub savings_plan_vault: Account<'info, SavingsPlanVault>,

    #[account(
        mut,
        close = user,
        constraint = user_vault.user == user.key(),
        constraint = user_vault.savings_plan == savings_plan.key(),
    )]
    pub user_vault: Account<'info, UserVault>,

    pub system_program: Program<'info, System>,
}

pub fn early_withdraw(ctx: Context<EarlyWithdraw>, savings_plan: Pubkey) -> Result<()> {
    let user = &ctx.accounts.user;
    let savings_plan = &mut ctx.accounts.savings_plan;
    let savings_plan_vault = &mut ctx.accounts.savings_plan_vault;
    let user_vault = &mut ctx.accounts.user_vault;

    // Calculate amounts
    let total_amount = user_vault.to_account_info().lamports();
    let penalty_amount = total_amount / 10; // 10% penalty
    let withdraw_amount = total_amount - penalty_amount;

    // Transfer all funds from user vault to user
    **user_vault.to_account_info().try_borrow_mut_lamports()? = 0;
    **user.to_account_info().try_borrow_mut_lamports()? += total_amount;

    // Transfer penalty from user to savings plan vault
    **user.to_account_info().try_borrow_mut_lamports()? -= penalty_amount;
    **savings_plan_vault
        .to_account_info()
        .try_borrow_mut_lamports()? += penalty_amount;

    // Update savings plan
    savings_plan.participants = savings_plan.participants.checked_sub(1).unwrap();

    // Close user vault
    user_vault.active = false;

    msg!(
        "Early withdrawal processed. User received {} SOL, Penalty: {} SOL",
        withdraw_amount as f64 / LAMPORTS_PER_SOL as f64,
        penalty_amount as f64 / LAMPORTS_PER_SOL as f64
    );

    Ok(())
}

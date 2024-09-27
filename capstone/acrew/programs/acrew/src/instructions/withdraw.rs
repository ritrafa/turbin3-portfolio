use crate::state::*;
use crate::AcrewError;
use crate::LAMPORTS_PER_SOL;
use anchor_lang::prelude::*;
use anchor_lang::system_program;

#[derive(Accounts)]
#[instruction(savings_plan: Pubkey)]
pub struct Withdraw<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(
        mut,
        seeds = [b"savings_plan", savings_plan.admin.key().as_ref(), savings_plan.name.as_bytes()],
        bump = savings_plan.bump,
    )]
    pub savings_plan: Account<'info, SavingsPlan>,

    #[account(
        mut,
        seeds = [b"savings_plan_vault", savings_plan.key().as_ref()],
        bump = savings_plan_vault.bump,
    )]
    pub savings_plan_vault: Account<'info, SavingsPlanVault>,

    #[account(
        mut,
        seeds = [b"user_vault", savings_plan.key().as_ref(), user.key().as_ref()],
        bump = user_vault.bump,
        constraint = user_vault.user == user.key(),
        constraint = user_vault.savings_plan == savings_plan.key(),
        close = user
    )]
    pub user_vault: Account<'info, UserVault>,

    pub system_program: Program<'info, System>,
}

pub fn withdraw(ctx: Context<Withdraw>, _savings_plan: Pubkey) -> Result<()> {
    let user = &ctx.accounts.user;
    let savings_plan = &mut ctx.accounts.savings_plan;
    let savings_plan_vault = &mut ctx.accounts.savings_plan_vault;
    let user_vault = &ctx.accounts.user_vault;

    // Add logs for debugging
    msg!("Starting withdrawal process for user: {:?}", user.key());
    msg!("Savings Plan: {:?}", savings_plan.key());
    msg!("User Vault: {:?}", user_vault.key());
    msg!("Savings Plan Vault: {:?}", savings_plan_vault.key());

    // Ensure participants are greater than 0
    require!(
        savings_plan.participants > 0,
        AcrewError::ArithmeticOverflow
    );

    // Calculate the user's share based on vault balance
    let vault_balance = savings_plan_vault.to_account_info().lamports();
    msg!("Vault Balance: {}", vault_balance);
    let user_share = vault_balance
        .checked_div(savings_plan.participants)
        .ok_or(AcrewError::ArithmeticOverflow)?;
    msg!("User Share: {}", user_share);

    // Transfer the user's share from savings_plan_vault to user directly
    **savings_plan_vault
        .to_account_info()
        .try_borrow_mut_lamports()? -= user_share;
    **user.to_account_info().try_borrow_mut_lamports()? += user_share;

    // Update savings plan participants count
    savings_plan.participants = savings_plan.participants.checked_sub(1).unwrap();

    // Log the successful transfer
    msg!(
        "Withdrawal processed. User received {} SOL from savings plan vault",
        user_share as f64 / LAMPORTS_PER_SOL as f64
    );

    Ok(())
}

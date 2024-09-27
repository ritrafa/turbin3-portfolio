use crate::state::*;
use crate::AcrewError;
use crate::LAMPORTS_PER_SOL;
use anchor_lang::{
    prelude::*,
    system_program::{transfer, Transfer},
};
use anchor_spl::token_interface::TokenInterface;

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
    pub token_program: Interface<'info, TokenInterface>,
}

impl<'info> Withdraw<'info> {
    pub fn withdraw(&mut self, _savings_plan: Pubkey) -> Result<()> {
        // Calculate the user's share from the savings plan vault
        let vault_balance = self.savings_plan_vault.to_account_info().lamports();
        let user_share = vault_balance
            .checked_div(self.savings_plan.participants)
            .ok_or(AcrewError::ArithmeticOverflow)?;

        // Transfer the user's share from the savings plan vault to the user
        let ctx_program = self.token_program.to_account_info();
        let accounts = Transfer {
            from: self.savings_plan_vault.to_account_info(),
            to: self.user.to_account_info(),
        };
        let cpi_ctx = CpiContext::new(ctx_program, accounts);
        transfer(cpi_ctx, user_share)?;

        // Update savings plan
        self.savings_plan.participants = self.savings_plan.participants.checked_sub(1).unwrap();

        // Log the withdrawal
        msg!(
            "Withdrawal processed. User received {} SOL from user vault and {} SOL from savings plan vault",
            self.user_vault.to_account_info().lamports() as f64 / LAMPORTS_PER_SOL as f64,
            user_share as f64 / LAMPORTS_PER_SOL as f64
        );

        Ok(())
    }
}

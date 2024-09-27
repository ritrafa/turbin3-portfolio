use crate::state::*;
use crate::LAMPORTS_PER_SOL;
use anchor_lang::{
    prelude::*,
    system_program::{transfer, Transfer},
};
use anchor_spl::token_interface::TokenInterface;

#[derive(Accounts)]
#[instruction(savings_plan: Pubkey, amount: u64)]
pub struct Deposit<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(
        mut,
        seeds = [b"savings_plan", savings_plan.admin.key().as_ref(), savings_plan.name.as_bytes()],
        bump = savings_plan.bump,
    )]
    pub savings_plan: Account<'info, SavingsPlan>,

    #[account(
        init_if_needed,
        payer = user,
        space = 8 + UserVault::INIT_SPACE,
        seeds = [b"user_vault", savings_plan.key().as_ref(), user.key().as_ref()],
        bump,
    )]
    pub user_vault: Account<'info, UserVault>,

    pub system_program: Program<'info, System>,
    pub token_program: Interface<'info, TokenInterface>,
}

impl<'info> Deposit<'info> {
    pub fn deposit(
        &mut self,
        savings_plan: Pubkey,
        amount: u64,
        bumps: &DepositBumps,
    ) -> Result<()> {
        // Update user vault
        self.user_vault.set_inner(UserVault {
            user: self.user.key(),
            savings_plan,
            active: true,
            bump: bumps.user_vault,
        });

        // Transfer funds from user to user vault
        let ctx_program = self.token_program.to_account_info();

        let accounts = Transfer {
            from: self.user.to_account_info(),
            to: self.user_vault.to_account_info(),
        };

        let cpi_ctx = CpiContext::new(ctx_program, accounts);

        transfer(cpi_ctx, amount)?;

        // Update savings plan
        self.savings_plan.participants = self.savings_plan.participants.checked_add(1).unwrap();

        msg!(
            "User deposited {} SOL to their vault for savings plan: {}",
            amount as f64 / LAMPORTS_PER_SOL as f64,
            self.savings_plan.name
        );

        Ok(())
    }
}

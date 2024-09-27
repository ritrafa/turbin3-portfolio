use anchor_lang::prelude::*;

pub mod instructions;
pub use instructions::*;

pub mod state;
pub use state::*;

declare_id!("2DSqE2VWrX33g3CWCQiwDsx3Y5DubKnPMojdsEKZTytb");

pub const MIN_DURATION: i64 = 1; // 30 seconds for testing, change to 3600 (1 hour) for production
pub const LAMPORTS_PER_SOL: u64 = 1_000_000_000; // 1 SOL = 1e9 lamports

#[program]
pub mod acrew {
    use super::*;

    pub fn create_savings_plan(
        ctx: Context<CreateSavingsPlan>,
        name: String,
        start: i64,
        duration: i64,
        amount: u64,
    ) -> Result<()> {
        // Ensure the name matches length requirement
        require!(name.len() <= 28, AcrewError::NameTooLong);

        // Ensure the savings plan duration is at least the program minimum
        require!(duration >= MIN_DURATION, AcrewError::DurationTooShort);

        // Ensure the start time is in the future
        let current_time = Clock::get()?.unix_timestamp;
        require!(start > current_time, AcrewError::StartTimeInPast);

        ctx.accounts
            .create_savings_plan(name, start, duration, amount, &ctx.bumps)
    }

    pub fn deposit(ctx: Context<Deposit>, savings_plan: Pubkey, amount: u64) -> Result<()> {
        // Check if the savings plan is still active
        let current_time = Clock::get()?.unix_timestamp;
        require!(
            current_time < ctx.accounts.savings_plan.start + ctx.accounts.savings_plan.duration,
            AcrewError::SavingsPlanEnded
        );

        // Check if the deposit amount meets or exceeds the target amount
        require!(
            amount >= ctx.accounts.savings_plan.amount,
            AcrewError::DepositAmountTooLow
        );

        ctx.accounts.deposit(savings_plan, amount, &ctx.bumps)
    }

    pub fn early_withdraw(ctx: Context<EarlyWithdraw>, savings_plan: Pubkey) -> Result<()> {
        // Check if the savings plan is still active
        let current_time = Clock::get()?.unix_timestamp;
        require!(
            current_time < ctx.accounts.savings_plan.start + ctx.accounts.savings_plan.duration,
            AcrewError::SavingsPlanEnded
        );

        // Check if the user vault is active
        require!(
            ctx.accounts.user_vault.active,
            AcrewError::UserVaultInactive
        );

        instructions::early_withdraw::early_withdraw(ctx, savings_plan)
    }

    pub fn withdraw(ctx: Context<Withdraw>, savings_plan: Pubkey) -> Result<()> {
        // Check if the user vault is active
        require!(
            ctx.accounts.user_vault.active,
            AcrewError::UserVaultInactive
        );

        // Check if the savings plan has ended
        let current_time = Clock::get()?.unix_timestamp;
        require!(
            current_time >= ctx.accounts.savings_plan.start + ctx.accounts.savings_plan.duration,
            AcrewError::SavingsPlanStillActive
        );

        ctx.accounts.withdraw(savings_plan)
    }
}

#[error_code]
pub enum AcrewError {
    #[msg("The provided name is too long. Maximum length is 28 bytes.")]
    NameTooLong,
    #[msg("The duration is too short. Minimum duration is 30 seconds.")]
    DurationTooShort,
    #[msg("The start time must be in the future.")]
    StartTimeInPast,
    #[msg("The savings plan has ended.")]
    SavingsPlanEnded,
    #[msg("The deposit amount is lower than the savings plan target amount.")]
    DepositAmountTooLow,
    #[msg("The user vault is not active.")]
    UserVaultInactive,
    #[msg("The savings plan is still active.")]
    SavingsPlanStillActive,
    #[msg("Arithmetic Overflow")]
    ArithmeticOverflow,
}

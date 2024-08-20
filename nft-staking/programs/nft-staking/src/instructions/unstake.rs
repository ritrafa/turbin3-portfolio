use anchor_lang::prelude::*;
use anchor_spl::{
    metadata::{metadata_program, MasterEditionAccount, MetadataAccount},
    token::{Mint, TokenAccount},
};

#[derive(Accounts)]
pub struct Stake<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    pub mint: Account<'info, Mint>,
    pub collection: Account<'info, Mint>,
    #[account(
        mut,
        associated_token:mint = mint,
        associated_token::authority = user,
    )]
    pub mint_ata: Account<'info, TokenAccount>,
    #[account(
        seeds = [
            b"metadata",
            metadata_program.key().as_ref(),
            mint.key().as_ref(),
            b"edition"
        ],
        seeds::program = metadata_program.key(),
        bump,
    )]
    pub edition: Account<'info, MasterEditionAccount>,
    pub config: Account<'info, StakeAccount>,
    #[account(
        init,
        payer = user,
        seeds = [b"stake", mint.key().as_ref(), config.key().as_ref()],
        bump,
        space = StakeAccount::INIT_SPACE
    )]
    pub stake_account: Account<'info, StakeAccount>,
    #[account(
        mut,
        seeds = [b"user", user.key().as_ref()],
        bump = user_account.bump
    )]
    pub user_account: Account<'info, UserAccount>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub metadata_program: Program<'info, Metadata>,
}

impl<'info> Unstake<'info> {
    pub fn unstake(&mut self, bumps: &UnstakeBumps) -> Result<()> {
        let time_elapsed =
            ((Clock::get()?.unix_timestamp - self.stake_account.last_update) / 86400) as u32;
        self.user_account.points += time_elapsed * self.config.points_per_stake;

        let cpi_program = self.token_program.to_account_info();

        let cpi_accounts = Approve {
            to: self.mint_ata.to_account_info(),
            delegate: self.stake_account.to_account_info(),
            authority: self.user.to_account_info(),
        };

        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);

        approve(cpi_ctx, 1)?;

        let delegate: &AccountInfo = &self.stake_account.to_account_info();
        let token_account: &AccountInfo = &self.mint_ata.to_account_info();
        let edition: &AccountInfo = &self.edition.to_account_info();
        let mint: &AccountInfo = &self.mint.to_account_info();
        let token_program: &AccountInfo = &self.token_program.to_account_info();
        let metadata_program: &AccountInfo = &self.metadata_program.to_account_info();

        ThawDelegatedAccountCpi::new(
            metadata_program,
            ThawDelegatedAccountCpiAccounts {
                delegate,
                token_account,
                edition,
                mint,
                token_program,
            },
        )
        .invoke_signed();

        self.user_account.amount_staked -= 1;

        Ok(())
    }
}

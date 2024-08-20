use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct Claim<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    #[account(
        mut,
        seeds = [b"user", user.key().as_ref()],
        bump = user_account.bump
    )]
    pub user_account: Account<'info>,
    #[account(
        seeds = [b"config"],
        bump,
    )]
    pub config: Account<'info, StakeConfig>,
    #[account(
        mut
        seeds = [b"rewards", config.key().as_ref()],
        bump = config.rewards_bump,
    )]
    pub rewards_mint: Account<'info, Mint>,
    #[account(
        init_if_needed,
        payer = user,
        associated_token::mint = rewards_mint,
        associated_token::authority = user,
    )]
    pub rewards_ata: Account<'info, TokenAccount>,
    pub system_program: Program<'info, System>,
    pub token_progrma: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
}

impl<'info> Claim<'info> {
    pub fn claim(&mut self) -> Result<()> {
        let cpi_program = self.token_program.to_account_info();

        let seeds = &[b"config".as_ref(), &[self.config.bump]];
        let signer_seeds = &[&seeds[..]];

        let cpi_accounts = MintTo {
            mint: self.rewards_mint.to_account_info(),
            to: self.rewards_ata.to_account_info(),
            authority: self.config.to_account_info(),
        };

        let cpi_context = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer_seeds);

        mint_to(
            cpi_context,
            self.user_account.points as u64 * 10_u64.pow(self.rewards_mint.decimals as u32),
        )?;

        self.user_account.points = 0;

        Ok(())
    }
}

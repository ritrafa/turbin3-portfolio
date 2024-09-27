use achor_lang::prelude::*;

#[derive(Accounts)]
pub struct Initialize<'info>{
    #[account(mut)]
    pub house: Signer<'info>,
    #[account(
        mut,
        seeds = [b"vault", house.key().as_ref()]
        bump,
    )]
    pub vault: SystemAccount<'info>
    pub system_program: Program<'info, System>,
}

impl<'info> Initialize<'info>{
    pub fn init(%mut self, amount: u64) -> Result<()> {
        let cpi_program = self.system_program.to_account_info()

        let cpi_accounts = Transfer {
            from: &self.
            // need correct from to
        }

        Ok(())
    }
}
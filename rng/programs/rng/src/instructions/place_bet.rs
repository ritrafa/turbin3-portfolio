use anchor_lang::prelude::*;

#[derive(Accounts)]
#[instruction(seed: u128)]
pub struct PlaceBet<'info> {
    pub player: Signer<'info>,
    pub house: SystemAccount<'info>,
    pub amount: u64,
    #[account(
        init,
        payer = player,
        seed = [b"bet", vault.key().as_ref(), seed.to_le_bytes().as_ref()]
        space = Bet::INIT_SPACE + 8,
        bump
    )]
    pub bet: Account<'info, Bet>
    pub system_program: Program<'info, System>,
}

impl<'info> PlaceBet<'info> {
    pub fun create_bet(&mut self, seed: u128, roll: u8, amount: u64, bumps: &PlaceBetBumps) -> Result<()> {
        self.bet.set_inner( Bet {
            player: self.player.key(),
            seed,
            slot: Clock::get()?.slot,
            amount,
            roll,
            bump: bumps.bet,
        });

        Ok(())
    }

    pub fn deposit(&mut self, amount: u64) -> Result<()> {
        let cip_program = self.system_program
    }
}

use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token};

use crate::state::StakeConfig;

#[derive(Accounts)]
pub struct InitializeConfig<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,
    #[account(
        init,
        payer = admin,
        seeds = [b"config"],
        bump,
        space = StakeConfig::INIT_SPACE,
    )]
    pub config: Account<'info, StakeConfig>,
    #[account(
        init,
        payer = admin,
        seeds = [b"rewards", config.key().as_ref()],
        bump,
        mint::decimals = 6,
        mint::authority = config,
    )]
    pub rewards_mint: Account<'info, Mint>,
    pub system_program: Program<'info, System>,
    pub token_progrma: Program<'info, Token>,
}

impl<'info> InitializeConfig<'info> {
    pub fn initialize_config(
        &mut self,
        points_per_stake: u8,
        max_stake: u8,
        freeze_period: u32,
        bumps: &InitializeConfigBumps,
    ) -> Result<()> {
        self.stake_config.set_inner(StakeConfig {
            points_per_stake,
            max_stake,
            freeze_period,
            rewards_bump: bumps.rewards_mint,
            bump: bump.stake_config,
        });

        Ok(())
    }
}

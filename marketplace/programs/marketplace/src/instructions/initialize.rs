use anchor_lang::prelude::*;
use anchor_spl::token_interface::{Mint, TokenInterface};

use crate::error::MarketplaceError::*;
use crate::state::Marketplace::*;

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(mut)]
    admin: Signer<'info>,
    #[account(
        init,
        payer = admin,
        seeds = [b"marketplace", name.as_str().as_bytes()],
        bump,
        space = Marketplace::INIT_SPACE,
    )]
    marketplace: Account<'info, Marketplace>,
    #[account(
        init,
        seeds = [b"rewards", marketplace.key().as_ref()],
        bump,
        payer = admin,
        mint::decimals = 6,
        mint::authority = marketplace,
    )]
    rewards_mint: Account<'info, Mint>,
    #[account(
        seeds = [b"treasury", marketplace.key().as_ref()],
        bump,
    )]
    treasury: SystemAccount<'info>,
    system_program: Program<'info, System>,
    token_program: Interface<'info, TokenInterface>,
}

impl<'info> Initialize<'info> {
    pub fn init(&mut self, name: String, fee: u16, bumps: &InitializeBumps) -> Result<()> {
        require!(fee <= 10000, MarketplaceError::InvalidFee);
        require!(
            name.len() > 0 && name.len() <= 32,
            MarketplaceError::InvalidName
        );

        self.marketplace.set_inner(Marketplace {
            admin: self.admin.key(),
            fee,
            bump: bumps.marketplace,
            rewards_bump: bumps.rewards_mint,
            treasury_bump: bumps.treasury,
            name,
        });

        Ok(())
    }
}

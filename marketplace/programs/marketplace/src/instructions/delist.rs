use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    metadata::{MasterEditionAccount, Metadata, MetadataAccount},
    token_interface::{transfer_checked, Mint, TokenAccount, TokenInterface, TransferChecked},
};

use crate::state::*;

#[derive(Accounts)]
pub struct Delist<'info> {
    #[account(mut)]
    maker: Signer<'info>,
    #[account(
        mut,
        seeds = [b"marketplace", marketplace.name.as_str().as_bytes()],
        bump = marketplace.bump,
    )]
    marketplace: Box<Account<'info, Marketplace>>,
    maker_mint: Box<InterfaceAccount<'info, Mint>>,
    collection_mint: Box<InterfaceAccount<'info, TokenAccount>>,
    #[account(
        mut,
        associated_token::mint = maker_mint,
        associated_token::authority = maker,
    )   ]
    maker_ata: Box<Account<'info, TokenAccount>>,
    #[account(
        close = maker,
        seeds = [b"listing", marketplace.key().as_ref(), maker_mint.key().as_ref()],
        bump,
    )]
    lisiting: Box<Account<'info, Listing>>,
    #[account(
        mut,
        associated_token::authority = lisitng,
        associated_token::mint = maker_mint,
    )]
    vault: Box<InterfaceAccount<'info, TokenAccount>>,

    system_program: Program<'info, System>,
    token_program: Interface<'info, TokenInterface>,
}

impl<'info> List<'info> {
    pub fn withdraw_nft(&mut self) -> Result<()> {
        // TODO this is not right
        let signer_seeds = &[
            self.marketplace.key().as_ref(),
            self.marketplace.name.as_str().as_bytes(),
            &[self.marketplace.bump],
        ];

        let account = TransferChecked {
            from: self.vault.to_account_info(),
            to: self.maker_ata.to_account_info(),
            authority: self.listing.to_account_info(),
            mint: self.maker_mint.to_account_info(),
        };

        let cpi_ctx = CpiContext::new_with_signer(
            self.token_program.to_account_info(),
            account,
            signer_seeds,
        ); // TODO THIS IS NOT RIGHT

        transfer_checked(account, amount, decimals, mint, authority, signers)
        // TODO THIS IS NOT RIGHT
    }

    pub fn delist(&mut self, price: u64, bumps: &ListBumps) -> Result<()> {
        self.listing.set_inner(Listing {
            maker: self.maker.key(),
            mint: self.maker_mint.key(),
            price,
            bump: bumps.listing,
        });

        Ok(())
    }
}

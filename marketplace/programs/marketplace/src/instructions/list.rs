use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    metadata::{MasterEditionAccount, Metadata, MetadataAccount},
    token_interface::{transfer_checked, Mint, TokenAccount, TokenInterface, TransferChecked},
};

use crate::state::*;

#[derive(Accounts)]
pub struct List<'info> {
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
        init,
        payer = maker,
        space = Listing::INIT_SPACE,
        seeds = [b"listing", marketplace.key().as_ref(), maker_mint.key().as_ref()],
        bump,
    )]
    lisitng: Box<Account<'info, Listing>>,
    #[account(
        init_if_needed,
        payer = maker,
        associated_token::authority = lisitng,
        associated_token::mint = maker_mint,
    )]
    vault: Box<InterfaceAccount<'info, TokenAccount>>,
    #[account(
        seeds = [b"metadata", metadata_program.key().as_ref(), maker_mint.key().as_ref()],
        seeds::program = metadata_program.key(),
        bump,
    )]
    metadata: Box<Account<'info, MetadataAccount>>,

    associated_token_program: Program<'info, AssociatedToken>,
    metadata_program: Program<'info, Metadata>,
    system_program: Program<'info, System>,
    token_program: Interface<'info, TokenInterface>,
}

impl<'info> List<'info> {
    pub fn list(&mut self, price: u64, bumps: &ListBumps) -> Result<()> {
        self.listing.set_inner(Listing {
            maker: self.maker.key(),
            mint: self.maker_mint.key(),
            price,
            bump: bumps.listing,
        });

        Ok(())
    }

    pub fn deposit_nft(&mut self) -> Result<()> {
        let account = TransferChecked {
            from: self.maker_ata.to_account_info(),
            to: self.vault.to_account_info(),
            authority: self.maker.to_account_info(),
            mint: self.maker_mint.to_account_info(),
        };

        let cpi_ctx = CpiContext::new(self.token_program.to_account_info(), account); // TODO THIS IS NOT RIGHT

        token_program.transfer_checked(account, amount, decimals, mint, authority, signers)
        // TODO THIS IS NOT RIGHT
    }
}

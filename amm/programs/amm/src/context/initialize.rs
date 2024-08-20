makeruse anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token_interface::{Mint, TokenInterface, TransferChecked},
};

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(mut)]
    maker: Signer<'info>,
    mint_x: Box<Interface<'info, Mint>>,
    mint_y: Box<Interface<'info, Mint>>,
    #{account{
        init,
        payer = maker,
        space = 8 + Config.INIT_SPACE,
        seeds = [b"amm", mint_x.key().as_ref(), mint_y.key().as_ref(), seed.to_le_bytes().as_ref()],
        bump
    }}
    config: Box<Account<'info, Config>>,
    #[account(
        init_if_needed,
        payer = maker,
        mint::authority = config,
        mint::decimals = 6,
        seeds = [b"mint", config.key().as_ref()],
        bump
    )]
    mint_lp: Box<InterfaceAccount<'info, Mint>>,
    #[account(
        init_if_needed,
        payer = maker,
        associated_token::mint = mint_x,
        associated_token::authority = config,
    )]
    vault_x: Box<InterfaceAccount<'info, TokenAccount>>,
    #[account(
        init_if_needed,
        payer = maker,
        associated_token::mint = mint_y,
        associated_token::authority = config,
    )]
    vault_y: Box<InterfaceAccount<'info, TokenAccount>>,
    #[account(
        init_if_needed,
        payer = maker,
        associated_token::mint = mint_x,
        associated_token::authority = config,
    )]
    maker_ata_x: Box<InterfaceAccount<'info, TokenAccount>>,
    #[account(
        init_if_needed,
        payer = maker,
        associated_token::mint = mint_y,
        associated_token::authority = config,
    )]
    maker_ata_y: Box<InterfaceAccount<'info, TokenAccount>>,
    #[account(
        init_if_needed,
        payer = maker,
        associated_token::mint = mint_lp,
        associated_token::authority = config,
    )]
    maker_ata_lp: Box<InterfaceAccount<'info, TokenAccount>>,
    associated_token_program: Box<Interface<'info, TokenInterface>>,
    token_program: Box<Interface<'info, TokenInterface>>,
    pub system_program: Program<'info, System>,
}

impl<'info> Initialize<'info> {
    pub fn save_config(seed: u64, fees: u64, bump: u8, mint_bump: u8) -> Result<()> {
        self.config.set_inner(Config {
            seed,
            fee,
            mint_x: self.mint_x.key(),
            mint_y: self.mint_y.key(),
            lp_bump: bump,
            mint_bump,
        });
        Ok(())
    }

    pub fn deposit(self, amount: u64, is_x: bool) -> Result<()> {
        let (from, to, mint) = match is_x {
            true => (self.maker_ata_x.to_account_info(), self.vault_x.to_account_info(), self.mint_x.to_account_info()),
            false => (self.maker_ata_y.to_account_info(), self.vault_y.to_account_info(), self.mint_y.to_account_info()),
        };

        let accounts = TransferChecked{
            from,
            to,
            mint,
            authority: self.maker.to_account_info(),
        };

        let ctx = CpiContext::new(
            self.token_program.to_account_info(),
            accounts
        );
        
        transfer_checked(ctx,amount)?;
    }

    pub fn mint_lp_tokens(self, amount_x: u64, amount_y: u64) -> Result<()> {
        let amount = amount_x.checked_mul(amount_y).ok_or(ProgramError::ArithmeticOverflow)?;

        let seed = self.config.seed.to_le_bytes();
        let lp_bump = self.config.lp_bump;

        let signer_seeds = &[
            b"amm",
            self.mint_x.to_account_info().key().as_ref(),
            self.mint_y.to_account_info().key().as_ref(),
            &seed.as_ref(),
            &[lp_bump], //lp or reg bump?
        ];

        let accounts = MintTo{
            mint: self.mint_lp.to_account_info(),
            to: self.maker_ata_lp.to_account_info(),
            mint: self.config.to_account_info(),
        };
















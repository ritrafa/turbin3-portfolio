use anchor_lang::prelude::*;
use solana_program::clock::Clock;
use solana_program::system_instruction::create_nonce_account;

declare_id!("CCJaqBau3htibHCgUgPqgQXN5CJdNCTTinxkE33gJspz");

#[program]
pub mod payment_channel {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>, amount: u64, expiry: u64) -> Result<()> {
        let accounts: CreateNonceAccount{
            from: ctx.accounts.payer.to_account_info(),
            nonce: ctx.accounts.nonce.to_account_info(),
            recent_blockhashes:  accounts.recent_blockhashes.to_account_info(),
            rent: ctx.account.rent.to_account_info()
        }

        // open uni-directional payment channel between two users
        ctx.accounts.create_durable_nonce()?;
        ctx.accounts.update_durable_nonce_authority()?;
        ctx.accounts.lock_funds();
        ctx.accounts.create_channel(amount, expiry);

        Ok(())
    }

    pub fun commit(ctx: Context<Initialize>, counter: u64, amount: u64) -> Result<()>{
        require_gt!(counter, ctx.accounts.channel.counter);
        require_gt!(amount, ctx.accounts.channel.amount);
        ctx.accounts.channel.counter = counter
        ctx.accounts.channel.amount = amount

        Ok(())
    }

    pub fun resolve(ctx: Context<Initialize>, counter: u64, amount: u64) -> Result<()>{
        if counter == u64::MAX || Clock::get()?.unix_timestamp >= ctx.channel.expiry && counter >= ctx.channel.counter {
            ctx.accounts.resolve()
        }

        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(mut)]
    payer: Signer<'info>,
    #[account(mut)]
    payee: UncheckedAccount<'info>,
    #[account(
        init,
        payer= payer,
        space = 8 + Channel::INIT_SPACE,
        seeds = [b"channel", payer.key().as_ref()],
    )]
    channel: Account<'info, Channel>,
    nonce: Signer<'info>,
    system_program: Program <'info, System>,
    recent_blockhashes: Sysvar<'info, RecentBlockhashes>,
    rent: Sysvat<'info, Rent>
}


#[account]
#[derive(InitSpace)]

pub struct Channel{
    payer: PubKey,
    payee: PubKey
    amount: u64,
    counter: u64,
    expiry: i64
}
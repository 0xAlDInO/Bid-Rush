use anchor_lang::prelude::*;

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

#[program]
pub mod bid_rush {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        msg!("Bienvenue sur le contrat intelligent Bid-Rush Solana !");
        let state = &mut ctx.accounts.state;
        state.authority = ctx.accounts.authority.key();
        state.auction_count = 0;
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + 32 + 8
    )]
    pub state: Account<'info, ContractState>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[account]
pub struct ContractState {
    pub authority: Pubkey,
    pub auction_count: u64,
}

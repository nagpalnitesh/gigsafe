use anchor_lang::prelude::*;
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token::{self, CloseAccount, Mint, Token, TokenAccount, Transfer};

declare_id!("2UFrdXwUEDtr5uXsVrCYuvnGoaESQM9UqVVovEYmsAY4");

// ============================================================
// GigSafe Protocol — Trustless Freelance Escrow on Solana
//
// Instructions:
//   1. create_gig       — Client posts a gig with milestones
//   2. fund_gig         — Client deposits tokens into escrow PDA
//   3. accept_gig       — Freelancer accepts the gig
//   4. submit_milestone — Freelancer marks milestone complete
//   5. approve_milestone — Client approves → releases milestone payment
//   6. request_dispute   — Either party raises a dispute
//   7. resolve_dispute   — Resolver splits funds per AI recommendation
//   8. cancel_gig       — Client cancels before freelancer accepts
// ============================================================

pub const MAX_MILESTONES: usize = 10;
pub const MAX_TITLE_LEN: usize = 64;

#[program]
pub mod gigsafe_protocol {
    use super::*;

    /// Create a new gig with milestones.
    pub fn create_gig(
        ctx: Context<CreateGig>,
        gig_id: u64,
        title: String,
        milestone_amounts: Vec<u64>,
        deadline: i64,
    ) -> Result<()> {
        require!(title.len() > 0 && title.len() <= MAX_TITLE_LEN, GigSafeError::InvalidTitle);
        require!(milestone_amounts.len() > 0 && milestone_amounts.len() <= MAX_MILESTONES, GigSafeError::InvalidMilestoneCount);
        require!(milestone_amounts.iter().all(|&a| a > 0), GigSafeError::InvalidMilestoneAmount);

        let clock = Clock::get()?;
        require!(deadline > clock.unix_timestamp, GigSafeError::DeadlineInPast);

        let total_budget: u64 = milestone_amounts
            .iter()
            .try_fold(0u64, |acc, &x| acc.checked_add(x))
            .ok_or(GigSafeError::MathOverflow)?;
        require!(total_budget > 0, GigSafeError::InvalidBudget);

        let gig = &mut ctx.accounts.gig;
        gig.client = ctx.accounts.client.key();
        gig.freelancer = Pubkey::default();
        gig.token_mint = ctx.accounts.token_mint.key();
        gig.title = title;
        gig.total_budget = total_budget;
        gig.funded_amount = 0;
        gig.released_amount = 0;
        gig.status = GigStatus::Open as u8;
        gig.milestone_count = milestone_amounts.len() as u8;
        gig.milestone_amounts = milestone_amounts.clone();
        gig.milestone_statuses = vec![MilestoneStatus::Pending as u8; milestone_amounts.len()];
        gig.deadline = deadline;
        gig.created_at = clock.unix_timestamp;
        gig.gig_id = gig_id;
        gig.escrow_bump = ctx.bumps.escrow;
        gig.bump = ctx.bumps.gig;

        emit!(GigCreated {
            gig_id,
            client: gig.client,
            total_budget,
            milestone_count: gig.milestone_count,
            token_mint: gig.token_mint,
            deadline,
        });

        Ok(())
    }

    /// Client deposits tokens into the escrow PDA.
    pub fn fund_gig(ctx: Context<FundGig>, _gig_id: u64) -> Result<()> {
        let gig = &ctx.accounts.gig;
        require!(gig.status == GigStatus::Open as u8, GigSafeError::GigNotOpen);
        require!(gig.funded_amount == 0, GigSafeError::AlreadyFunded);

        token::transfer(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.client_token_account.to_account_info(),
                    to: ctx.accounts.escrow.to_account_info(),
                    authority: ctx.accounts.client.to_account_info(),
                },
            ),
            gig.total_budget,
        )?;

        let gig = &mut ctx.accounts.gig;
        gig.funded_amount = gig.total_budget;

        emit!(GigFunded {
            gig_id: gig.gig_id,
            amount: gig.total_budget,
            token_mint: gig.token_mint,
        });

        Ok(())
    }

    /// Freelancer accepts the gig.
    pub fn accept_gig(ctx: Context<AcceptGig>, _gig_id: u64) -> Result<()> {
        let gig = &ctx.accounts.gig;
        require!(gig.status == GigStatus::Open as u8, GigSafeError::GigNotOpen);
        require!(gig.funded_amount > 0, GigSafeError::NotFunded);
        require!(gig.freelancer == Pubkey::default(), GigSafeError::AlreadyAccepted);
        require!(ctx.accounts.freelancer.key() != gig.client, GigSafeError::CannotAcceptOwnGig);

        let gig = &mut ctx.accounts.gig;
        gig.freelancer = ctx.accounts.freelancer.key();
        gig.status = GigStatus::Active as u8;

        emit!(GigAccepted {
            gig_id: gig.gig_id,
            freelancer: gig.freelancer,
        });

        Ok(())
    }

    /// Freelancer submits a milestone as complete.
    pub fn submit_milestone(
        ctx: Context<SubmitMilestone>,
        _gig_id: u64,
        milestone_index: u8,
    ) -> Result<()> {
        let gig = &ctx.accounts.gig;
        require!(gig.status == GigStatus::Active as u8, GigSafeError::GigNotActive);
        let idx = milestone_index as usize;
        require!(idx < gig.milestone_count as usize, GigSafeError::InvalidMilestoneIndex);
        require!(
            gig.milestone_statuses[idx] == MilestoneStatus::Pending as u8,
            GigSafeError::MilestoneNotPending
        );

        let gig = &mut ctx.accounts.gig;
        gig.milestone_statuses[idx] = MilestoneStatus::Submitted as u8;

        emit!(MilestoneSubmitted {
            gig_id: gig.gig_id,
            milestone_index,
        });

        Ok(())
    }

    /// Client approves a milestone → releases payment to freelancer.
    pub fn approve_milestone(
        ctx: Context<ApproveMilestone>,
        _client_key: Pubkey,
        _gig_id: u64,
        milestone_index: u8,
    ) -> Result<()> {
        let gig = &ctx.accounts.gig;
        require!(gig.status == GigStatus::Active as u8, GigSafeError::GigNotActive);
        let idx = milestone_index as usize;
        require!(idx < gig.milestone_count as usize, GigSafeError::InvalidMilestoneIndex);
        require!(
            gig.milestone_statuses[idx] == MilestoneStatus::Submitted as u8,
            GigSafeError::MilestoneNotSubmitted
        );

        let amount = gig.milestone_amounts[idx];

        // PDA signs the transfer
        let client_key = gig.client;
        let gig_id_bytes = gig.gig_id.to_le_bytes();
        let bump = gig.bump;
        let seeds: &[&[u8]] = &[b"gig", client_key.as_ref(), &gig_id_bytes, &[bump]];
        let signer = &[seeds];

        token::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.escrow.to_account_info(),
                    to: ctx.accounts.freelancer_token_account.to_account_info(),
                    authority: ctx.accounts.gig.to_account_info(),
                },
                signer,
            ),
            amount,
        )?;

        let gig = &mut ctx.accounts.gig;
        gig.milestone_statuses[idx] = MilestoneStatus::Approved as u8;
        gig.released_amount = gig.released_amount.checked_add(amount).ok_or(GigSafeError::MathOverflow)?;

        // Check if all milestones approved → complete the gig
        let all_approved = gig
            .milestone_statuses
            .iter()
            .all(|&s| s == MilestoneStatus::Approved as u8);
        if all_approved {
            gig.status = GigStatus::Completed as u8;
        }

        emit!(MilestoneApproved {
            gig_id: gig.gig_id,
            milestone_index,
            amount,
        });

        Ok(())
    }

    /// Either party raises a dispute.
    pub fn request_dispute(ctx: Context<RequestDispute>, _gig_id: u64) -> Result<()> {
        let gig = &ctx.accounts.gig;
        require!(gig.status == GigStatus::Active as u8, GigSafeError::GigNotActive);
        let caller = ctx.accounts.caller.key();
        require!(
            caller == gig.client || caller == gig.freelancer,
            GigSafeError::Unauthorized
        );

        let gig = &mut ctx.accounts.gig;
        gig.status = GigStatus::Disputed as u8;

        emit!(DisputeRaised {
            gig_id: gig.gig_id,
            raised_by: caller,
        });

        Ok(())
    }

    /// Resolve a dispute by splitting remaining escrow funds.
    /// freelancer_bps: basis points for freelancer (0-10000)
    /// Remaining goes to client.
    pub fn resolve_dispute(
        ctx: Context<ResolveDispute>,
        _client_key: Pubkey,
        _gig_id: u64,
        freelancer_bps: u16,
    ) -> Result<()> {
        let gig = &ctx.accounts.gig;
        require!(gig.status == GigStatus::Disputed as u8, GigSafeError::GigNotDisputed);
        require!(freelancer_bps <= 10000, GigSafeError::InvalidDisputeShares);

        let remaining = gig.funded_amount.checked_sub(gig.released_amount).ok_or(GigSafeError::MathOverflow)?;
        let freelancer_amount = (remaining as u128)
            .checked_mul(freelancer_bps as u128)
            .ok_or(GigSafeError::MathOverflow)?
            .checked_div(10000)
            .ok_or(GigSafeError::MathOverflow)? as u64;
        let client_refund = remaining.checked_sub(freelancer_amount).ok_or(GigSafeError::MathOverflow)?;

        let client_key = gig.client;
        let gig_id_bytes = gig.gig_id.to_le_bytes();
        let bump = gig.bump;
        let seeds: &[&[u8]] = &[b"gig", client_key.as_ref(), &gig_id_bytes, &[bump]];
        let signer = &[seeds];

        // Pay freelancer their share
        if freelancer_amount > 0 {
            token::transfer(
                CpiContext::new_with_signer(
                    ctx.accounts.token_program.to_account_info(),
                    Transfer {
                        from: ctx.accounts.escrow.to_account_info(),
                        to: ctx.accounts.freelancer_token_account.to_account_info(),
                        authority: ctx.accounts.gig.to_account_info(),
                    },
                    signer,
                ),
                freelancer_amount,
            )?;
        }

        // Refund client their share
        if client_refund > 0 {
            token::transfer(
                CpiContext::new_with_signer(
                    ctx.accounts.token_program.to_account_info(),
                    Transfer {
                        from: ctx.accounts.escrow.to_account_info(),
                        to: ctx.accounts.client_token_account.to_account_info(),
                        authority: ctx.accounts.gig.to_account_info(),
                    },
                    signer,
                ),
                client_refund,
            )?;
        }

        // Close escrow account
        token::close_account(CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            CloseAccount {
                account: ctx.accounts.escrow.to_account_info(),
                destination: ctx.accounts.resolver.to_account_info(),
                authority: ctx.accounts.gig.to_account_info(),
            },
            signer,
        ))?;

        let gig = &mut ctx.accounts.gig;
        gig.status = GigStatus::Resolved as u8;
        gig.released_amount = gig.funded_amount;

        emit!(DisputeResolved {
            gig_id: gig.gig_id,
            freelancer_amount,
            client_refund,
        });

        Ok(())
    }

    /// Client cancels a gig before freelancer accepts. Full refund.
    pub fn cancel_gig(ctx: Context<CancelGig>, _client_key: Pubkey, _gig_id: u64) -> Result<()> {
        let gig = &ctx.accounts.gig;
        require!(gig.status == GigStatus::Open as u8, GigSafeError::GigNotOpen);

        let refund = gig.funded_amount;

        if refund > 0 {
            let client_key = gig.client;
            let gig_id_bytes = gig.gig_id.to_le_bytes();
            let bump = gig.bump;
            let seeds: &[&[u8]] = &[b"gig", client_key.as_ref(), &gig_id_bytes, &[bump]];
            let signer = &[seeds];

            token::transfer(
                CpiContext::new_with_signer(
                    ctx.accounts.token_program.to_account_info(),
                    Transfer {
                        from: ctx.accounts.escrow.to_account_info(),
                        to: ctx.accounts.client_token_account.to_account_info(),
                        authority: ctx.accounts.gig.to_account_info(),
                    },
                    signer,
                ),
                refund,
            )?;

            token::close_account(CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                CloseAccount {
                    account: ctx.accounts.escrow.to_account_info(),
                    destination: ctx.accounts.client.to_account_info(),
                    authority: ctx.accounts.gig.to_account_info(),
                },
                signer,
            ))?;
        }

        let gig = &mut ctx.accounts.gig;
        gig.status = GigStatus::Cancelled as u8;

        emit!(GigCancelled {
            gig_id: gig.gig_id,
            refund_amount: refund,
        });

        Ok(())
    }
}

// ============================================================
// ACCOUNT VALIDATION STRUCTS
// ============================================================

#[derive(Accounts)]
#[instruction(gig_id: u64)]
pub struct CreateGig<'info> {
    #[account(
        init,
        payer = client,
        space = 8 + GigAccount::MAX_SIZE,
        seeds = [b"gig", client.key().as_ref(), &gig_id.to_le_bytes()],
        bump
    )]
    pub gig: Account<'info, GigAccount>,

    #[account(
        init,
        payer = client,
        token::mint = token_mint,
        token::authority = gig,
        seeds = [b"escrow", gig.key().as_ref()],
        bump
    )]
    pub escrow: Account<'info, TokenAccount>,

    #[account(mut)]
    pub client: Signer<'info>,

    pub token_mint: Account<'info, Mint>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
#[instruction(gig_id: u64)]
pub struct FundGig<'info> {
    #[account(
        mut,
        seeds = [b"gig", client.key().as_ref(), &gig_id.to_le_bytes()],
        bump,
        constraint = gig.client == client.key() @ GigSafeError::Unauthorized,
    )]
    pub gig: Account<'info, GigAccount>,

    #[account(
        mut,
        seeds = [b"escrow", gig.key().as_ref()],
        bump,
    )]
    pub escrow: Account<'info, TokenAccount>,

    #[account(mut)]
    pub client: Signer<'info>,

    #[account(mut, associated_token::mint = gig.token_mint, associated_token::authority = client)]
    pub client_token_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
#[instruction(gig_id: u64)]
pub struct AcceptGig<'info> {
    #[account(
        mut,
        seeds = [b"gig", gig.client.as_ref(), &gig_id.to_le_bytes()],
        bump,
    )]
    pub gig: Account<'info, GigAccount>,

    #[account(mut)]
    pub freelancer: Signer<'info>,
}

#[derive(Accounts)]
#[instruction(gig_id: u64)]
pub struct SubmitMilestone<'info> {
    #[account(
        mut,
        seeds = [b"gig", gig.client.as_ref(), &gig_id.to_le_bytes()],
        bump,
        constraint = gig.freelancer == freelancer.key() @ GigSafeError::Unauthorized,
    )]
    pub gig: Account<'info, GigAccount>,

    pub freelancer: Signer<'info>,
}

#[derive(Accounts)]
#[instruction(client_key: Pubkey, gig_id: u64)]
pub struct ApproveMilestone<'info> {
    #[account(
        mut,
        seeds = [b"gig", client_key.as_ref(), &gig_id.to_le_bytes()],
        bump,
        constraint = gig.client == client.key() @ GigSafeError::Unauthorized,
    )]
    pub gig: Account<'info, GigAccount>,

    #[account(
        mut,
        seeds = [b"escrow", gig.key().as_ref()],
        bump,
    )]
    pub escrow: Account<'info, TokenAccount>,

    #[account(mut)]
    pub client: Signer<'info>,

    #[account(
        init_if_needed,
        payer = client,
        associated_token::mint = token_mint,
        associated_token::authority = freelancer_wallet,
    )]
    pub freelancer_token_account: Account<'info, TokenAccount>,

    /// CHECK: validated against gig.freelancer
    #[account(constraint = freelancer_wallet.key() == gig.freelancer @ GigSafeError::Unauthorized)]
    pub freelancer_wallet: UncheckedAccount<'info>,

    #[account(constraint = token_mint.key() == gig.token_mint @ GigSafeError::Unauthorized)]
    pub token_mint: Account<'info, Mint>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
}

#[derive(Accounts)]
#[instruction(gig_id: u64)]
pub struct RequestDispute<'info> {
    #[account(
        mut,
        seeds = [b"gig", gig.client.as_ref(), &gig_id.to_le_bytes()],
        bump,
    )]
    pub gig: Account<'info, GigAccount>,

    pub caller: Signer<'info>,
}

#[derive(Accounts)]
#[instruction(client_key: Pubkey, gig_id: u64)]
pub struct ResolveDispute<'info> {
    #[account(
        mut,
        seeds = [b"gig", client_key.as_ref(), &gig_id.to_le_bytes()],
        bump,
        constraint = gig.status == GigStatus::Disputed as u8 @ GigSafeError::GigNotDisputed,
    )]
    pub gig: Account<'info, GigAccount>,

    #[account(
        mut,
        seeds = [b"escrow", gig.key().as_ref()],
        bump,
    )]
    pub escrow: Account<'info, TokenAccount>,

    /// Resolver can be client (for now). Future: DAO/arbitrator.
    #[account(mut)]
    pub resolver: Signer<'info>,

    #[account(
        init_if_needed,
        payer = resolver,
        associated_token::mint = token_mint,
        associated_token::authority = freelancer_wallet,
    )]
    pub freelancer_token_account: Account<'info, TokenAccount>,

    #[account(
        init_if_needed,
        payer = resolver,
        associated_token::mint = token_mint,
        associated_token::authority = client_wallet,
    )]
    pub client_token_account: Account<'info, TokenAccount>,

    /// CHECK: validated against gig.freelancer
    #[account(constraint = freelancer_wallet.key() == gig.freelancer @ GigSafeError::Unauthorized)]
    pub freelancer_wallet: UncheckedAccount<'info>,

    /// CHECK: validated against gig.client
    #[account(constraint = client_wallet.key() == gig.client @ GigSafeError::Unauthorized)]
    pub client_wallet: UncheckedAccount<'info>,

    #[account(constraint = token_mint.key() == gig.token_mint @ GigSafeError::Unauthorized)]
    pub token_mint: Account<'info, Mint>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
}

#[derive(Accounts)]
#[instruction(client_key: Pubkey, gig_id: u64)]
pub struct CancelGig<'info> {
    #[account(
        mut,
        seeds = [b"gig", client_key.as_ref(), &gig_id.to_le_bytes()],
        bump,
        constraint = gig.client == client.key() @ GigSafeError::Unauthorized,
    )]
    pub gig: Account<'info, GigAccount>,

    #[account(
        mut,
        seeds = [b"escrow", gig.key().as_ref()],
        bump,
    )]
    pub escrow: Account<'info, TokenAccount>,

    #[account(mut)]
    pub client: Signer<'info>,

    #[account(
        mut,
        associated_token::mint = token_mint,
        associated_token::authority = client,
    )]
    pub client_token_account: Account<'info, TokenAccount>,

    #[account(constraint = token_mint.key() == gig.token_mint @ GigSafeError::Unauthorized)]
    pub token_mint: Account<'info, Mint>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
}

// ============================================================
// ON-CHAIN DATA
// ============================================================

#[account]
pub struct GigAccount {
    pub client: Pubkey,            // 32
    pub freelancer: Pubkey,        // 32
    pub token_mint: Pubkey,        // 32
    pub title: String,             // 4 + MAX_TITLE_LEN
    pub total_budget: u64,         // 8
    pub funded_amount: u64,        // 8
    pub released_amount: u64,      // 8
    pub status: u8,                // 1
    pub milestone_count: u8,       // 1
    pub milestone_amounts: Vec<u64>,   // 4 + (8 * MAX_MILESTONES)
    pub milestone_statuses: Vec<u8>,   // 4 + (1 * MAX_MILESTONES)
    pub deadline: i64,             // 8
    pub created_at: i64,           // 8
    pub gig_id: u64,              // 8
    pub escrow_bump: u8,          // 1
    pub bump: u8,                 // 1
}

impl GigAccount {
    pub const MAX_SIZE: usize = 32 + 32 + 32 + (4 + MAX_TITLE_LEN) + 8 + 8 + 8 + 1 + 1
        + (4 + 8 * MAX_MILESTONES) + (4 + 1 * MAX_MILESTONES)
        + 8 + 8 + 8 + 1 + 1;
}

// ============================================================
// ENUMS
// ============================================================

#[derive(Clone, Copy, PartialEq)]
pub enum GigStatus {
    Open = 0,
    Active = 1,
    Completed = 2,
    Disputed = 3,
    Resolved = 4,
    Cancelled = 5,
}

#[derive(Clone, Copy, PartialEq)]
pub enum MilestoneStatus {
    Pending = 0,
    Submitted = 1,
    Approved = 2,
    Disputed = 3,
}

// ============================================================
// EVENTS
// ============================================================

#[event]
pub struct GigCreated {
    pub gig_id: u64,
    pub client: Pubkey,
    pub total_budget: u64,
    pub milestone_count: u8,
    pub token_mint: Pubkey,
    pub deadline: i64,
}

#[event]
pub struct GigFunded {
    pub gig_id: u64,
    pub amount: u64,
    pub token_mint: Pubkey,
}

#[event]
pub struct GigAccepted {
    pub gig_id: u64,
    pub freelancer: Pubkey,
}

#[event]
pub struct MilestoneSubmitted {
    pub gig_id: u64,
    pub milestone_index: u8,
}

#[event]
pub struct MilestoneApproved {
    pub gig_id: u64,
    pub milestone_index: u8,
    pub amount: u64,
}

#[event]
pub struct DisputeRaised {
    pub gig_id: u64,
    pub raised_by: Pubkey,
}

#[event]
pub struct DisputeResolved {
    pub gig_id: u64,
    pub freelancer_amount: u64,
    pub client_refund: u64,
}

#[event]
pub struct GigCancelled {
    pub gig_id: u64,
    pub refund_amount: u64,
}

// ============================================================
// ERRORS
// ============================================================

#[error_code]
pub enum GigSafeError {
    #[msg("Title must be 1-64 characters")]
    InvalidTitle,
    #[msg("Budget must be greater than zero")]
    InvalidBudget,
    #[msg("Must have 1-10 milestones")]
    InvalidMilestoneCount,
    #[msg("Each milestone amount must be greater than zero")]
    InvalidMilestoneAmount,
    #[msg("Deadline must be in the future")]
    DeadlineInPast,
    #[msg("Gig is not open")]
    GigNotOpen,
    #[msg("Gig is not active")]
    GigNotActive,
    #[msg("Gig is not disputed")]
    GigNotDisputed,
    #[msg("Gig is already funded")]
    AlreadyFunded,
    #[msg("Gig must be funded before accepting")]
    NotFunded,
    #[msg("Gig already has a freelancer")]
    AlreadyAccepted,
    #[msg("Cannot accept your own gig")]
    CannotAcceptOwnGig,
    #[msg("Invalid milestone index")]
    InvalidMilestoneIndex,
    #[msg("Milestone is not pending")]
    MilestoneNotPending,
    #[msg("Milestone is not submitted")]
    MilestoneNotSubmitted,
    #[msg("Unauthorized")]
    Unauthorized,
    #[msg("Arithmetic overflow")]
    MathOverflow,
    #[msg("Dispute shares must be 0-10000 basis points")]
    InvalidDisputeShares,
}

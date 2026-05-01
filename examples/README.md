# GigSafe Examples

Complete examples covering every product workflow, API usage, and test case.

## Structure

```
examples/
├── workflows/          Full product workflows (step-by-step)
│   ├── 01-create-gig.md
│   ├── 02-accept-gig.md
│   ├── 03-milestone-flow.md
│   ├── 04-dispute-resolution.md
│   ├── 05-cancel-refund.md
│   ├── 06-bidding.md
│   ├── 07-profiles-reputation.md
│   ├── 08-messaging.md
│   └── 09-ai-features.md
├── test-data/          Sample data for testing
│   ├── seed-gigs.json
│   ├── seed-profiles.json
│   └── seed-reviews.json
├── api-examples/       cURL examples for every API endpoint
│   └── all-endpoints.sh
└── README.md
```

## Quick Start

```bash
# Seed test data
bun run examples/test-data/seed.ts

# Run API examples
bash examples/api-examples/all-endpoints.sh

# Run full test suite
bash tests/api.test.sh
```

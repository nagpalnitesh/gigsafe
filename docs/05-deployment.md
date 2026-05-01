# Deployment Guide

## Smart Contract (Protocol)

### Current Deployment

The GigSafe protocol is deployed on **Solana Devnet**:

- **Program ID:** `2UFrdXwUEDtr5uXsVrCYuvnGoaESQM9UqVVovEYmsAY4`
- **Authority:** `AA9uJF8FtcKQirYhT2bDKseDW3GvTK3ABnErqJP6of85`
- **Network:** Devnet

### Building the Program

```bash
cd gigsafe-protocol
anchor build
```

This generates:
- Compiled program: `target/deploy/gigsafe_protocol.so`
- IDL: `target/idl/gigsafe_protocol.json`
- Keypair: `target/deploy/gigsafe_protocol-keypair.json`

### Deploying to Devnet

```bash
# Make sure you're on devnet
solana config set --url https://api.devnet.solana.com

# Check your balance (need ~3 SOL for deployment)
solana balance

# Deploy
anchor deploy --provider.cluster devnet
```

### Upgrading

Since the program is upgradeable:

```bash
anchor upgrade target/deploy/gigsafe_protocol.so \
  --program-id 2UFrdXwUEDtr5uXsVrCYuvnGoaESQM9UqVVovEYmsAY4 \
  --provider.cluster devnet
```

### Updating the IDL

After building, copy the new IDL to the frontend:

```bash
cp target/idl/gigsafe_protocol.json ../gigsafe/src/lib/idl/
```

## Frontend

### Building for Production

```bash
cd gigsafe
bun run build
# or
npm run build
```

This creates an optimized build in `.next/`.

### Running in Production

```bash
bun start
# or
npm start
```

By default, it runs on port 3000.

### Nginx Reverse Proxy

The live deployment uses Nginx as a reverse proxy with SSL:

```nginx
server {
    listen 443 ssl;
    server_name gigsafe.wildsnap.in;

    ssl_certificate /etc/letsencrypt/live/gigsafe.wildsnap.in/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/gigsafe.wildsnap.in/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}

server {
    listen 80;
    server_name gigsafe.wildsnap.in;
    return 301 https://$host$request_uri;
}
```

### Process Management

For persistent running, use PM2 or systemd:

#### PM2

```bash
npm install -g pm2
pm2 start npm --name "gigsafe" -- start
pm2 save
pm2 startup
```

#### systemd

```ini
[Unit]
Description=GigSafe Frontend
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/gigsafe
ExecStart=/usr/bin/npm start
Restart=on-failure
Environment=NODE_ENV=production
Environment=PORT=3000

[Install]
WantedBy=multi-user.target
```

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| PORT | 3000 | Server port |
| NODE_ENV | development | Environment mode |

RPC endpoint and program ID are hardcoded in `src/lib/constants.ts`. For a production deployment, consider moving these to environment variables.

## Devnet USDC Token

The devnet deployment uses a custom SPL token as mock USDC:

- **Mint:** `5ZpAiCXV9kgRm5Sa8755cJ9YYwuJtgZdZEKY1a5zPyYV`
- **Decimals:** 6
- **Mint Authority:** Deploy wallet

To mint test tokens:

```bash
spl-token mint 5ZpAiCXV9kgRm5Sa8755cJ9YYwuJtgZdZEKY1a5zPyYV 10000 -- <recipient-token-account>
```

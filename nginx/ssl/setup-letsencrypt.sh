#!/bin/bash
# ============================================================
# Let's Encrypt SSL Certificate Setup (Production)
# Use Certbot with Docker
# ============================================================

set -e

DOMAIN="${1:-bizcore.dev}"
EMAIL="${2:-admin@bizcore.dev}"

echo "🔐 Setting up Let's Encrypt SSL Certificate"
echo "   Domain: $DOMAIN"
echo "   Email: $EMAIL"
echo ""

if [ -z "$DOMAIN" ]; then
    echo "❌ Error: Domain not provided"
    echo "Usage: bash setup-letsencrypt.sh <domain> [email]"
    exit 1
fi

# Check if certbot is available
if ! command -v certbot &> /dev/null; then
    echo "📦 Installing certbot..."
    apt-get update && apt-get install -y certbot python3-certbot-nginx
fi

echo "📝 Generating certificate for $DOMAIN..."
certbot certonly --standalone \
  --non-interactive \
  --agree-tos \
  --email "$EMAIL" \
  -d "$DOMAIN" \
  -d "www.$DOMAIN"

CERT_DIR="/etc/letsencrypt/live/$DOMAIN"
SSL_DIR="$(dirname "$0")"

echo "📋 Creating symbolic links in $SSL_DIR..."
ln -sf "$CERT_DIR/fullchain.pem" "$SSL_DIR/cert.pem"
ln -sf "$CERT_DIR/privkey.pem" "$SSL_DIR/key.pem"
ln -sf "$CERT_DIR/chain.pem" "$SSL_DIR/chain.pem"

echo "✅ Certificate installed successfully!"
echo ""
echo "📁 Certificate files:"
echo "   Certificate: $SSL_DIR/cert.pem"
echo "   Private Key: $SSL_DIR/key.pem"
echo "   Chain: $SSL_DIR/chain.pem"
echo ""
echo "🔄 Auto-renewal setup:"
echo "   Add to crontab for auto-renewal:"
echo "   0 2 * * * certbot renew --quiet --post-hook 'systemctl reload nginx'"
echo ""
echo "✅ Update nginx config:"
echo "   1. Uncomment HTTPS server block in bizcore-secure.conf"
echo "   2. Restart nginx container"
echo "   3. Access via https://$DOMAIN"

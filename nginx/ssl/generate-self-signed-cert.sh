#!/bin/bash
# ============================================================
# Self-Signed SSL Certificate Generator
# Use this for DEVELOPMENT ONLY!
# For production, use Let's Encrypt (Certbot)
# ============================================================

set -e

CERT_DIR="$(dirname "$0")"
CERT_FILE="$CERT_DIR/cert.pem"
KEY_FILE="$CERT_DIR/key.pem"

echo "🔐 Generating self-signed SSL certificate..."
echo "   Certificate valid for 365 days"
echo "   For production, use Let's Encrypt instead"
echo ""

# Generate private key and self-signed certificate
openssl req -x509 -newkey rsa:4096 -nodes \
  -out "$CERT_FILE" \
  -keyout "$KEY_FILE" \
  -days 365 \
  -subj "/C=US/ST=State/L=City/O=BizCore/CN=localhost"

# Set proper permissions
chmod 600 "$KEY_FILE"
chmod 644 "$CERT_FILE"

echo "✅ Certificate generated successfully!"
echo ""
echo "📁 Certificate files:"
echo "   Certificate: $CERT_FILE"
echo "   Private Key: $KEY_FILE"
echo ""
echo "⚠️  Certificate is self-signed - browsers will show warning"
echo "✅ Safe to use for local development and testing"
echo ""
echo "🔧 To use in nginx:"
echo "   1. Uncomment HTTPS server block in bizcore-secure.conf"
echo "   2. Restart nginx container"
echo "   3. Access via https://localhost"

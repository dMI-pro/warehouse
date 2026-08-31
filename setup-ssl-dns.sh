#!/bin/bash
set -e

if [ -z "$1" ] || [ -z "$2" ]; then
  echo "Usage: ./setup-ssl.sh <domain> <email>"
  echo "Example: ./setup-ssl.sh tsehh.ru admin@tsehh.ru"
  exit 1
fi

DOMAIN=$1
EMAIL=$2

echo "Creating directories..."
mkdir -p ./certs
mkdir -p ./letsencrypt
mkdir -p ./letsencrypt-lib

echo "Stopping proxy to free port 80..."
docker compose -f docker-compose.prod.yml stop proxy || true

echo "Requesting certificates for $DOMAIN..."
docker run -it --rm \
  -v "$(pwd)/letsencrypt:/etc/letsencrypt" \
  -v "$(pwd)/letsencrypt-lib:/var/lib/letsencrypt" \
  -p 80:80 \
  certbot/certbot certonly --standalone \
  --preferred-challenges http \
  --email "$EMAIL" \
  --agree-tos \
  --no-eff-email \
  -d "$DOMAIN"

if [ -f "./letsencrypt/live/$DOMAIN/fullchain.pem" ]; then
  echo "Certificates obtained successfully!"
  echo "Copying to ./certs/ for Nginx..."
  cp -L "./letsencrypt/live/$DOMAIN/fullchain.pem" "./certs/fullchain.pem"
  cp -L "./letsencrypt/live/$DOMAIN/privkey.pem" "./certs/privkey.pem"
  
  echo "Starting services..."
  docker compose -f docker-compose.prod.yml up -d proxy
  echo "Done! Your site should be live at https://$DOMAIN"
else
  echo "Error: Certificates were not generated. Check the logs above."
  exit 1
fi

#!/bin/bash
# IndexNow URL submission script for MapParser
# Run after deployment to notify search engines of updated pages.
# Usage: ./scripts/indexnow-submit.sh

HOST="mapparser.travel-tracker.org"
KEY="28302727dda8741d53a40768e01d19af"
KEY_LOCATION="https://${HOST}/${KEY}.txt"
ENDPOINT="https://api.indexnow.org/indexnow"

URLS=(
  "https://${HOST}/"
  "https://${HOST}/download"
  "https://${HOST}/about"
  "https://${HOST}/my-trips"
  "https://${HOST}/map-view"
  "https://${HOST}/google-map-view"
  "https://${HOST}/login"
  "https://${HOST}/privacy"
  "https://${HOST}/delete-account"
)

URL_LIST=$(printf ',"%s"' "${URLS[@]}")
URL_LIST="[${URL_LIST:1}]"

PAYLOAD=$(cat <<EOF
{
  "host": "${HOST}",
  "key": "${KEY}",
  "keyLocation": "${KEY_LOCATION}",
  "urlList": ${URL_LIST}
}
EOF
)

echo "Submitting ${#URLS[@]} URLs to IndexNow..."
echo ""

RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${ENDPOINT}" \
  -H "Content-Type: application/json; charset=utf-8" \
  -d "${PAYLOAD}")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

echo "HTTP Status: ${HTTP_CODE}"

case $HTTP_CODE in
  200) echo "Success: URLs submitted and indexed." ;;
  202) echo "Accepted: URLs received, pending key validation." ;;
  400) echo "Error: Bad request. Check payload format." ;;
  403) echo "Error: Invalid key. Verify key file is accessible at ${KEY_LOCATION}" ;;
  422) echo "Error: Unprocessable entity. URLs may not match the host." ;;
  429) echo "Error: Too many requests. Try again later." ;;
  *) echo "Unexpected response: ${BODY}" ;;
esac

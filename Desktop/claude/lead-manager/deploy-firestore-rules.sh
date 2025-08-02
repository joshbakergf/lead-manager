#!/bin/bash

# Get the access token
ACCESS_TOKEN=$(gcloud auth print-access-token)

# Read the rules file
RULES_CONTENT=$(cat firestore-open.rules)

# Create the JSON payload
cat > rules-payload.json << EOF
{
  "rules": {
    "source": "$RULES_CONTENT"
  }
}
EOF

echo "🔧 Deploying Firestore rules..."
echo "Rules content:"
echo "$RULES_CONTENT"

# Deploy the rules using REST API
curl -X PATCH \
  "https://firestore.googleapis.com/v1/projects/interactive-call-script/databases/(default)/documents" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d @rules-payload.json

echo ""
echo "✅ Rules deployment completed"
echo "Rules should be active in 1-2 minutes"

# Clean up
rm rules-payload.json
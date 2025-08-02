#!/bin/bash

# Deploy Firestore security rules using gcloud
echo "🔧 Deploying Firestore security rules..."

# Use REST API to update Firestore rules
curl -X PATCH \
  "https://firestore.googleapis.com/v1/projects/interactive-call-script/databases/(default)/documents" \
  -H "Authorization: Bearer $(gcloud auth print-access-token)" \
  -H "Content-Type: application/json" \
  -d "@firestore.rules"

echo "✅ Firestore rules deployment initiated"
echo "Rules may take a few minutes to propagate"
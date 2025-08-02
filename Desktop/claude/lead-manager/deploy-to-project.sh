#!/bin/bash

# Deploy to a specific Google Cloud project

if [ -z "$1" ]; then
    echo "Usage: ./deploy-to-project.sh PROJECT_ID"
    echo "Example: ./deploy-to-project.sh my-new-project-123"
    exit 1
fi

PROJECT_ID=$1

echo "🎯 Deploying Lead Manager to project: $PROJECT_ID"

# Set the project
echo "📋 Setting project to $PROJECT_ID..."
gcloud config set project $PROJECT_ID

# Enable required APIs
echo "🔧 Enabling required APIs..."
gcloud services enable cloudbuild.googleapis.com run.googleapis.com containerregistry.googleapis.com storage.googleapis.com

# Get project number for permissions
PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format="value(projectNumber)")

# Grant Cloud Build permissions
echo "🔐 Setting up permissions..."
gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com" \
    --role="roles/editor" --quiet

# Deploy using the simple server
echo "🚀 Starting deployment..."
gcloud builds submit --config cloudbuild.simple.yaml . --project=$PROJECT_ID

# Get the service URL
SERVICE_URL=$(gcloud run services describe lead-manager --region=us-central1 --format="value(status.url)" --project=$PROJECT_ID)

echo ""
echo "✅ Deployment successful!"
echo "🌐 Your application is available at: $SERVICE_URL"
echo "📋 Project: $PROJECT_ID"
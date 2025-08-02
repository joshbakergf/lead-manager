#!/bin/bash

# Google Cloud deployment script for Lead Manager

set -e

echo "🚀 Starting deployment to Google Cloud..."

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo "❌ gcloud CLI is not installed. Please install it first:"
    echo "https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Check if user is authenticated
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
    echo "❌ Not authenticated with gcloud. Please run: gcloud auth login"
    exit 1
fi

# Get current project
PROJECT_ID=$(gcloud config get-value project)
if [ -z "$PROJECT_ID" ]; then
    echo "❌ No project set. Please run: gcloud config set project YOUR_PROJECT_ID"
    exit 1
fi

echo "📋 Project ID: $PROJECT_ID"

# Ask user which deployment method they prefer
echo ""
echo "Choose deployment method:"
echo "1) Cloud Run with Nginx (Recommended - Production ready)"
echo "2) Cloud Run Simple (Fallback - Python server)"
echo "3) App Engine (Managed platform)"
echo "4) Build only (Just build the Docker image)"
read -p "Enter choice (1-4): " choice

case $choice in
    1)
        echo "🐳 Deploying to Cloud Run with Nginx..."
        
        # Enable required APIs
        echo "🔧 Enabling required APIs..."
        gcloud services enable cloudbuild.googleapis.com
        gcloud services enable run.googleapis.com
        gcloud services enable containerregistry.googleapis.com
        
        # Build and deploy using Cloud Build
        echo "🏗️  Building and deploying with Cloud Build..."
        gcloud builds submit --config cloudbuild.yaml .
        
        # Get the service URL
        SERVICE_URL=$(gcloud run services describe lead-manager --region=us-central1 --format="value(status.url)")
        echo ""
        echo "✅ Deployment successful!"
        echo "🌐 Your application is available at: $SERVICE_URL"
        ;;
        
    2)
        echo "🐍 Deploying to Cloud Run with Simple Python Server..."
        
        # Enable required APIs
        echo "🔧 Enabling required APIs..."
        gcloud services enable cloudbuild.googleapis.com
        gcloud services enable run.googleapis.com
        gcloud services enable containerregistry.googleapis.com
        
        # Build and deploy using Cloud Build with simple server
        echo "🏗️  Building and deploying with simple server..."
        gcloud builds submit --config cloudbuild.simple.yaml .
        
        # Get the service URL
        SERVICE_URL=$(gcloud run services describe lead-manager --region=us-central1 --format="value(status.url)")
        echo ""
        echo "✅ Deployment successful!"
        echo "🌐 Your application is available at: $SERVICE_URL"
        ;;
        
    3)
        echo "🏠 Deploying to App Engine..."
        
        # Build the application
        echo "🏗️  Building application..."
        npm run build
        
        # Deploy to App Engine
        echo "🚀 Deploying to App Engine..."
        gcloud app deploy app.yaml --quiet
        
        # Get the service URL
        SERVICE_URL=$(gcloud app describe --format="value(defaultHostname)")
        echo ""
        echo "✅ Deployment successful!"
        echo "🌐 Your application is available at: https://$SERVICE_URL"
        ;;
        
    4)
        echo "🏗️  Building Docker image only..."
        
        # Enable required APIs
        gcloud services enable cloudbuild.googleapis.com
        gcloud services enable containerregistry.googleapis.com
        
        # Build the image
        gcloud builds submit --tag gcr.io/$PROJECT_ID/lead-manager .
        
        echo ""
        echo "✅ Build successful!"
        echo "🐳 Image available at: gcr.io/$PROJECT_ID/lead-manager"
        echo ""
        echo "To deploy manually:"
        echo "gcloud run deploy lead-manager --image gcr.io/$PROJECT_ID/lead-manager --region us-central1 --allow-unauthenticated"
        ;;
        
    *)
        echo "❌ Invalid choice. Exiting."
        exit 1
        ;;
esac

echo ""
echo "🎉 Deployment process completed!"
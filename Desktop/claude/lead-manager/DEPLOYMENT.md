# Google Cloud Deployment Guide

This guide will help you deploy the Lead Manager application to Google Cloud Platform.

## Prerequisites

1. **Google Cloud Account**: You need a Google Cloud account with billing enabled
2. **Google Cloud CLI**: Install the gcloud CLI tool
   ```bash
   # macOS (using Homebrew)
   brew install --cask google-cloud-sdk
   
   # Or download from: https://cloud.google.com/sdk/docs/install
   ```

## Setup Steps

### 1. Authentication & Project Setup

```bash
# Login to Google Cloud
gcloud auth login

# Set your project ID (replace with your actual project ID)
gcloud config set project your-project-id

# Enable billing (required for deployment)
# Visit: https://console.cloud.google.com/billing
```

### 2. Quick Deployment

Run the automated deployment script:

```bash
./deploy.sh
```

The script will guide you through the deployment process and offer three options:
- **Cloud Run** (Recommended): Containerized, auto-scaling deployment
- **App Engine**: Simpler managed platform deployment  
- **Build Only**: Just build the Docker image for manual deployment

### 3. Manual Deployment Options

#### Option A: Cloud Run (Recommended)

```bash
# Enable required APIs
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable containerregistry.googleapis.com

# Build and deploy
gcloud builds submit --config cloudbuild.yaml .
```

#### Option B: App Engine

```bash
# Build the application
npm run build

# Deploy to App Engine
gcloud app deploy app.yaml
```

## Configuration

### Environment Variables

If you need to add environment variables, update the `cloudbuild.yaml` or `app.yaml` files:

**For Cloud Run:**
```yaml
# Add to cloudbuild.yaml deploy step
'--set-env-vars', 'NODE_ENV=production,API_URL=https://your-api.com'
```

**For App Engine:**
```yaml
# Add to app.yaml
env_variables:
  NODE_ENV: production
  API_URL: https://your-api.com
```

### Custom Domain

To use a custom domain:

1. **Cloud Run:**
   ```bash
   gcloud run domain-mappings create --service lead-manager --domain your-domain.com --region us-central1
   ```

2. **App Engine:**
   ```bash
   gcloud app domain-mappings create your-domain.com
   ```

## Monitoring & Logs

### View Logs
```bash
# Cloud Run logs
gcloud logs read --service lead-manager

# App Engine logs  
gcloud app logs tail -s default
```

### Monitoring
- Visit [Google Cloud Console](https://console.cloud.google.com)
- Navigate to Cloud Run or App Engine
- View metrics, logs, and performance data

## Scaling Configuration

### Cloud Run Scaling
- **Min instances**: 0 (scales to zero when not in use)
- **Max instances**: 100 (adjust based on expected traffic)
- **Memory**: 512Mi (can be increased if needed)
- **CPU**: 1 (can be adjusted)

### App Engine Scaling
- **Auto-scaling**: Configured in `app.yaml`
- **Min instances**: 0
- **Max instances**: 10
- **Target CPU**: 60%

## Costs

### Estimated Monthly Costs (Low Traffic)
- **Cloud Run**: $0-20/month (pay per request)
- **App Engine**: $0-30/month (includes free tier)
- **Cloud Build**: ~$0.10 per build
- **Container Registry**: ~$0.50 storage

### Cost Optimization
- Cloud Run scales to zero when not in use
- Use App Engine free tier for development
- Enable Cloud CDN for static assets
- Monitor usage in Cloud Console

## Troubleshooting

### Common Issues

1. **Build Failures**
   ```bash
   # Check build logs
   gcloud builds log [BUILD_ID]
   ```

2. **Permission Errors**
   ```bash
   # Ensure proper IAM roles
   gcloud projects add-iam-policy-binding PROJECT_ID \
     --member="user:your-email@gmail.com" \
     --role="roles/run.admin"
   ```

3. **Service Not Accessible**
   - Check if `--allow-unauthenticated` flag was used
   - Verify firewall rules
   - Check service status in Console

### Useful Commands

```bash
# List Cloud Run services
gcloud run services list

# Get service details
gcloud run services describe lead-manager --region us-central1

# Update service
gcloud run services update lead-manager --region us-central1

# Delete service
gcloud run services delete lead-manager --region us-central1
```

## Security Considerations

- Application runs with HTTPS by default
- No authentication required (as configured)
- Add Cloud IAP for additional security if needed
- Monitor access logs regularly
- Use Cloud Armor for DDoS protection

## Next Steps

After deployment:
1. Test the application thoroughly
2. Set up monitoring and alerts
3. Configure backups if needed
4. Consider adding a CDN for better performance
5. Set up CI/CD pipeline for automatic deployments

## Support

For issues:
- Check [Google Cloud Status](https://status.cloud.google.com)
- Review [Cloud Run documentation](https://cloud.google.com/run/docs)
- Visit [Google Cloud Support](https://cloud.google.com/support)
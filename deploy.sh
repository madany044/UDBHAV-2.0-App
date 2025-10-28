#!/bin/bash

# UDBHAV-2.0 Deployment Script

echo "🚀 Starting UDBHAV-2.0 deployment process..."

# Check if Netlify CLI is installed
if ! command -v netlify &> /dev/null; then
    echo "❌ Netlify CLI not found. Installing..."
    npm install -g netlify-cli
fi

# Check if user is logged in to Netlify
if ! netlify status &> /dev/null; then
    echo "🔐 Please log in to Netlify:"
    netlify login
fi

# Deploy to production
echo "📦 Deploying to Netlify..."
netlify deploy --prod

echo "✅ Deployment complete!"
echo "🌐 Your site is now live on Netlify!"

#!/bin/sh

# TechOps Dashboard Start Script
# This script starts both the backend and frontend services

set -e

echo "Starting TechOps Dashboard..."

# Check if we're in production mode
if [ "$NODE_ENV" = "production" ]; then
    echo "Running in production mode"
    # In production, serve the built frontend and run the backend
    exec npm start
else
    echo "Running in development mode"
    # In development, run both frontend and backend with hot reload
    exec npm run dev
fi
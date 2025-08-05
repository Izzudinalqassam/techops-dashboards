#!/usr/bin/env node

/**
 * TechOps Dashboard API Server
 * 
 * This is the main entry point for the TechOps Dashboard backend API.
 * The application has been refactored into a modular MVC structure:
 * 
 * - /config - Configuration files (database, server settings)
 * - /controllers - Business logic and request handlers
 * - /middleware - Authentication, validation, rate limiting
 * - /routes - API route definitions
 * - /utils - Utility functions and helpers
 * - app.js - Express application setup and configuration
 */

const { startServer } = require('./app');

// Start the server
startServer().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
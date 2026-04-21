# Environment Variables Guide

This document explains the environment variables used by the Wave Connect frontend.

## Configuration

Create a `.env.local` file in the project root to override default values:

```bash
# .env.local
VITE_API_URL=http://localhost:8080
```

## Available Variables

### Required Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_URL` | `http://localhost:8080` | Base URL for the Wave Connect Gateway API |

### Optional Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_ANALYTICS_ENDPOINT` | (undefined) | URL endpoint for analytics service (e.g., Umami) |
| `VITE_ANALYTICS_WEBSITE_ID` | (undefined) | Website ID for analytics tracking |
| `VITE_APP_TITLE` | (undefined) | Application title |
| `VITE_APP_LOGO` | (undefined) | Application logo URL |
| `VITE_APP_ID` | (undefined) | Application identifier |

## Setup Instructions

### 1. Create `.env.local` File

In the project root directory, create a `.env.local` file:

```bash
# .env.local

# API Configuration (Required)
VITE_API_URL=http://localhost:8080

# Analytics Configuration (Optional)
# Uncomment and fill in if you want to enable analytics
# VITE_ANALYTICS_ENDPOINT=https://analytics.example.com
# VITE_ANALYTICS_WEBSITE_ID=your-website-id
```

### 2. Development Server

When you run `pnpm dev`, the development server will automatically load variables from `.env.local`.

### 3. Production Build

For production builds, ensure all required environment variables are set in your deployment environment.

## Example Configurations

### Local Development (No Analytics)

```bash
VITE_API_URL=http://localhost:8080
```

### Local Development (With Analytics)

```bash
VITE_API_URL=http://localhost:8080
VITE_ANALYTICS_ENDPOINT=http://localhost:3001
VITE_ANALYTICS_WEBSITE_ID=wave-connect-dev
```

### Production

```bash
VITE_API_URL=https://api.waveconnect.com
VITE_ANALYTICS_ENDPOINT=https://analytics.waveconnect.com
VITE_ANALYTICS_WEBSITE_ID=wave-connect-prod
VITE_APP_TITLE=Wave Connect
VITE_APP_LOGO=https://waveconnect.com/logo.png
```

## Notes

- **Do not commit `.env.local`** to version control - it may contain sensitive information
- Variables prefixed with `VITE_` are exposed to the client-side code
- Variables without `VITE_` prefix are only available on the server-side
- The `.env.local` file is loaded automatically by Vite and takes precedence over `.env`

## Troubleshooting

### Analytics Script Not Loading

If you see warnings about undefined analytics variables, ensure:
1. You have set both `VITE_ANALYTICS_ENDPOINT` and `VITE_ANALYTICS_WEBSITE_ID`
2. Both variables are non-empty strings
3. The analytics endpoint is accessible from your browser

If you don't need analytics, simply leave these variables undefined - the script will not load.

### API Connection Issues

If the frontend cannot connect to the API:
1. Verify `VITE_API_URL` points to a running API server
2. Check that CORS is properly configured on the API server
3. Ensure the API server is accessible from your network

## Vite Environment Variables Documentation

For more information about Vite environment variables, see:
https://vitejs.dev/guide/env-and-mode.html

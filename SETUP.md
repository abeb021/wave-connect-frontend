# Wave Connect Frontend - Local Setup Guide

This guide will help you get the Wave Connect frontend running on your local machine.

## Prerequisites

Before you start, ensure you have the following installed:

- **Node.js** (version 18 or higher) - [Download here](https://nodejs.org/)
- **pnpm** (package manager) - Install with: `npm install -g pnpm`
- **Git** (optional, for cloning the repository)

## Installation Steps

### 1. Clone or Download the Project

**Option A: Using Git (if you have the repository URL)**
```bash
git clone <repository-url>
cd wave-connect-frontend
```

**Option B: If you have the project files**
```bash
# Navigate to the project directory
cd wave-connect-frontend
```

### 2. Install Dependencies

Run the following command to install all required packages:

```bash
pnpm install
```

This will install all dependencies listed in `package.json`, including React, TailwindCSS, shadcn/ui components, and other libraries.

### 3. Configure API URL (Optional)

The frontend is configured to connect to the Wave Connect Gateway API at `http://localhost:8080` by default.

If your API is running on a different URL, create a `.env.local` file in the project root:

```bash
# .env.local
VITE_API_URL=http://your-api-url:8080
```

## Running the Development Server

### Start the Development Server

```bash
pnpm dev
```

This will:
- Start the Vite development server
- Open the application in your browser (usually at `http://localhost:5173`)
- Enable hot module replacement (HMR) for instant updates as you code

### Access the Application

Once the server is running, open your browser and navigate to:
```
http://localhost:5173
```

You should see the Wave Connect landing page with options to sign up or sign in.

## Building for Production

To create an optimized production build:

```bash
pnpm build
```

This will:
- Compile the React application
- Optimize assets and bundle size
- Generate output in the `dist/` directory

### Preview Production Build Locally

To test the production build locally:

```bash
pnpm preview
```

## Project Structure

```
wave-connect-frontend/
├── client/
│   ├── public/              # Static files (favicon, robots.txt)
│   ├── src/
│   │   ├── pages/          # Page components (Home, Login, Feed, Profile, Chat)
│   │   ├── components/     # Reusable UI components
│   │   ├── contexts/       # React contexts (Auth, Theme)
│   │   ├── lib/            # Utility functions and API client
│   │   ├── App.tsx         # Main app component with routing
│   │   ├── main.tsx        # React entry point
│   │   └── index.css       # Global styles and design tokens
│   └── index.html          # HTML template
├── server/                 # Backend server (Express)
├── package.json            # Project dependencies
└── vite.config.ts          # Vite configuration
```

## Available Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start development server with hot reload |
| `pnpm build` | Create optimized production build |
| `pnpm preview` | Preview production build locally |
| `pnpm check` | Run TypeScript type checking |
| `pnpm format` | Format code with Prettier |

## Features Overview

### Authentication
- **Register**: Create a new account with username, email, and password
- **Login**: Sign in with your credentials to access the platform
- **Session Management**: JWT tokens are stored locally for persistent sessions

### Feed
- **Create Publications**: Share your thoughts with the community
- **Edit Publications**: Update your posts after publishing
- **Delete Publications**: Remove publications you no longer want
- **View Feed**: See publications from all users

### Profile
- **View Profile**: See your account information
- **Create Profile**: Set up your public profile with a display name
- **Edit Profile**: Update your profile information

### Chat
- **Send Messages**: Direct messaging with other users
- **Edit Messages**: Update messages you've sent
- **Delete Messages**: Remove messages from the conversation
- **Real-time Updates**: Instant message delivery

## API Integration

The frontend connects to the Wave Connect Gateway API. Make sure your API server is running before using the application.

**Default API URL**: `http://localhost:8080`

The application uses the following API endpoints:
- `/api/auth/*` - Authentication (register, login, user management)
- `/api/feed/*` - Publications (create, read, update, delete)
- `/api/profile/*` - User profiles (create, read, update, delete)
- `/api/chat/*` - Messages (create, read, update, delete)
- `/api/chat/ws` - WebSocket for real-time chat

## Troubleshooting

### Port Already in Use

If port 5173 is already in use, Vite will automatically use the next available port. Check the terminal output for the correct URL.

### API Connection Issues

If you see errors connecting to the API:
1. Verify the API server is running on `http://localhost:8080`
2. Check your `.env.local` file if you've configured a custom API URL
3. Ensure CORS is properly configured on your API server

### Dependencies Installation Issues

If `pnpm install` fails:
```bash
# Clear pnpm cache
pnpm store prune

# Try installing again
pnpm install
```

### TypeScript Errors

To check for TypeScript errors:
```bash
pnpm check
```

## Design System

The application uses a **Modern Minimalist** design philosophy:

- **Primary Color**: Deep Navy Blue (#1a2744)
- **Accent Color**: Vibrant Teal (#00d4d4)
- **Typography**: Playfair Display (headers) + Inter (body)
- **Layout**: Asymmetric, whitespace-focused design
- **Components**: shadcn/ui for consistent, accessible UI

## Browser Support

The application works on all modern browsers:
- Chrome/Chromium (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Development Tips

### Hot Module Replacement (HMR)

Changes to your code will automatically refresh in the browser without losing state.

### Debugging

Use your browser's DevTools:
- **Console**: Check for JavaScript errors
- **Network**: Monitor API requests
- **Application**: View stored tokens and session data

### Code Formatting

Format your code with Prettier:
```bash
pnpm format
```

## Next Steps

1. **Customize Design**: Edit `client/src/index.css` to modify colors and typography
2. **Add Features**: Create new pages in `client/src/pages/`
3. **Extend Components**: Add new components in `client/src/components/`
4. **API Integration**: Modify `client/src/lib/api.ts` for additional endpoints

## Support & Documentation

- **Vite Documentation**: https://vitejs.dev/
- **React Documentation**: https://react.dev/
- **TailwindCSS Documentation**: https://tailwindcss.com/
- **shadcn/ui Documentation**: https://ui.shadcn.com/

## License

This project is part of the Wave Connect platform.

---

**Happy coding!** 🌊

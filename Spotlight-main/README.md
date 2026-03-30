# InThaSpotlight - Central PA Music Platform

A modern web application built with React, TypeScript, Tailwind CSS, and Convex for the backend.

## Features

- **Artist Discovery**: Browse local artists from Central Pennsylvania
- **Content Upload**: Share audio/video content with the community
- **Social Features**: Like, comment, share, and follow other artists
- **Real-time Feed**: Pulse feed with live updates
- **Subscription Tiers**: Premium features for artists
- **Admin Dashboard**: Platform management and analytics

## Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Convex (real-time database + serverless functions)
- **Routing**: React Router v6
- **Icons**: Lucide React

## Getting Started

### Prerequisites

- Node.js 18+
- npm or pnpm

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   # or
   pnpm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env.local
   ```
   
   The Convex URL is already configured in the code.

4. Start the development server:
   ```bash
   npm run dev
   # or
   pnpm dev
   ```

5. Open [http://localhost:5173](http://localhost:5173) in your browser

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # shadcn/ui components
│   ├── Layout.tsx      # Main layout with navigation
│   └── PostCard.tsx    # Post card component
├── pages/              # Page components
│   ├── Index.tsx       # Home page
│   ├── Discovery.tsx   # Artist discovery
│   ├── Pulse.tsx       # Real-time feed
│   ├── Upload.tsx      # Content upload
│   ├── Subscriptions.tsx # Subscription management
│   ├── Admin.tsx       # Admin dashboard
│   ├── Profile.tsx     # User profile
│   └── SignUp.tsx      # User registration
├── lib/                # Utility functions
│   └── convex.ts       # Convex client configuration
├── convex/             # Backend functions
│   ├── schema.ts       # Database schema
│   ├── users.ts        # User queries/mutations
│   ├── posts.ts        # Post queries/mutations
│   ├── follows.ts      # Follow/unfollow logic
│   ├── auth.ts         # Authentication
│   ├── subscriptions.ts # Subscription management
│   └── admin.ts        # Admin functions
├── App.tsx             # Main app component
└── main.tsx            # Entry point
```

## Convex Setup

This project uses Convex for all backend functionality. The Convex deployment URL is already configured.

To deploy your own Convex backend:

1. Install Convex CLI: `npm install -g convex`
2. Run `npx convex dev` to link your local project with Convex
3. Deploy with `npx convex deploy`

## Authentication

Currently uses simple email/password authentication. For production, implement proper password hashing and consider OAuth providers.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT
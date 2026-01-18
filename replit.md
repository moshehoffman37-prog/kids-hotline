# Kids' Hotline - OneTimeOneTime Streaming App

## Overview

Kids' Hotline is a secure content streaming mobile application for families. Parents can provide curated video, audio, and photo content to children without giving them browser access. The app connects to your onetimeonetime.com account and mirrors the website's content structure.

**Key Features:**
- Login with existing onetimeonetime.com credentials
- Browse content by categories (Stories, Mishnayos, One Daf One Daf, Just Kidding Podcast, Documents)
- Video streaming (Bunny CDN compatible)
- Audio playback for MP3 files
- Document/image viewing for JPGs
- Simple logout option in header
- Links to website for account management and password reset

## User Preferences

- Keep the app simple - mirror the website's design and functionality
- Videos stream from Bunny CDN
- MP3s play as audio with playback controls
- JPGs display as documents (image viewer)
- No admin capabilities needed
- Account creation and password reset redirect to onetimeonetime.com

## System Architecture

### Frontend (Expo/React Native)
- **Entry Point**: `client/App.tsx`
- **Navigation**: `client/navigation/RootStackNavigator.tsx`
  - Login screen (shown when not authenticated)
  - Home screen (main content browser)
  - ContentPlayer screen (video/audio/photo playback)
- **Auth Context**: `client/contexts/AuthContext.tsx` - manages login state
- **Theme**: `client/constants/theme.ts` - colors and styling

### Backend (Express.js)
- **Server**: `server/index.ts` - Express server on port 5000
- **Routes**: `server/routes.ts` - API endpoints
  - `POST /api/auth/login` - Authenticate user
  - `GET /api/content/home` - Get recent, categories, and all content
  - `GET /api/content/:id` - Get single content item

### Current Demo Users
For testing, use:
- Email: `demo@onetimeonetime.com`
- Password: `demo123`

## Screen Flow

1. **Login Screen** - Email/password login with links to website for:
   - Forgot Password → onetimeonetime.com/forgot-password
   - Create Account → onetimeonetime.com/signup

2. **Home Screen** - After login, shows:
   - Header with app logo, title, and Logout button
   - "Recent" section with horizontal scroll
   - Category filter pills (Stories, Mishnayos, etc.)
   - Grid of content cards with thumbnails

3. **Content Player** - Tapping a card opens:
   - Video player (for video content)
   - Audio player with controls (for MP3s)
   - Zoomable image viewer (for documents/photos)

## Key Files

```
client/
├── App.tsx                    # App entry with providers
├── contexts/AuthContext.tsx   # Authentication state
├── screens/
│   ├── LoginScreen.tsx        # Login form
│   ├── HomeScreen.tsx         # Main content browser
│   └── ContentPlayerScreen.tsx # Media playback
├── components/
│   ├── ContentCard.tsx        # Content thumbnail cards
│   ├── Input.tsx              # Form input with floating label
│   └── Button.tsx             # Primary action button
└── lib/
    ├── auth.ts                # Auth storage utilities
    ├── content.ts             # Content/favorites storage
    └── query-client.ts        # API client configuration

server/
├── index.ts                   # Express server setup
└── routes.ts                  # API routes
```

## Content Types

| Type | Icon | Player |
|------|------|--------|
| video | Play button | expo-av Video player with native controls |
| audio | Headphones | expo-av Audio with play/pause, progress bar |
| photo | File text | Zoomable Image viewer |

## Environment Variables

- `EXPO_PUBLIC_DOMAIN` - API server domain (auto-set by Replit)
- `DATABASE_URL` - PostgreSQL connection (for future use)

## TODO: Production Integration

To connect to real onetimeonetime.com backend:
1. Update `server/routes.ts` to proxy authentication to website API
2. Fetch real content from Bunny CDN via website API
3. Map content URLs to proper Bunny CDN streams

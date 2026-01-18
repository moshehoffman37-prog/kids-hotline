# Kids' Hotline - OneTimeOneTime Streaming App

## Overview

Kids' Hotline is a secure content streaming mobile application for families. Parents can provide curated video, audio, and document content to children without giving them browser access. The app connects directly to your onetimeonetime.com backend API.

## Features

- Login with existing onetimeonetime.com credentials
- Browse content by categories (auto-detected from your API)
- Video streaming via Bunny Stream embed URLs
- Audio playback with streaming endpoint
- Document/image viewing via pages endpoint
- Simple logout option in header
- Links to website for account management and password reset

## API Integration

The app connects to **https://onetimeonetime.com** with these endpoints:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/mobile/login` | POST | Login with {email, password}, returns {token, user} |
| `/api/mobile/me` | GET | Get current user info |
| `/api/mobile/refresh-token` | POST | Refresh auth token |
| `/api/videos` | GET | Get all videos |
| `/api/audio-files` | GET | Get all audio files |
| `/api/documents` | GET | Get all documents |
| `/api/audio-files/:id/stream` | GET | Stream audio file |
| `/api/documents/:id/pages` | GET | View document pages |

All requests after login include `Authorization: Bearer <token>` header.

## Branding

- **Primary Color**: #1A2A3A (dark blue)
- **Accent Color**: #EDE518 (yellow)
- **Background**: #161616 (dark)
- **Font**: Open Sans / System

## Screen Flow

1. **Login Screen** - Email/password login with links to:
   - Forgot Password → onetimeonetime.com/forgot-password
   - Create Account → onetimeonetime.com/signup

2. **Home Screen** - After login, shows:
   - Header with One Time One Time logo and Logout button
   - "Recent" section with latest content
   - Category filter pills (auto-generated from content)
   - Grid of content cards with thumbnails

3. **Content Player** - Tapping a card opens:
   - Video: Native HLS playback via expo-video (no browser required)
   - Audio: Native audio player with play/pause and progress bar
   - Document: Image viewer with pinch-to-zoom and 2-finger pan

## Project Structure

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
│   ├── Input.tsx              # Form input
│   └── Button.tsx             # Primary button
└── lib/
    └── api.ts                 # API client with auth headers

assets/images/
├── logo.webp                  # One Time One Time logo
├── icon.png                   # App icon
└── splash-icon.png            # Splash screen icon
```

## Content Types

| Type | Source | Player |
|------|--------|--------|
| video | embedUrl from API | Native HLS playback via expo-video (no browser required) |
| audio | /api/audio-files/:id/stream | expo-av Audio player |
| document | /api/documents/:id/pages | Image viewer with pinch-to-zoom |

## User Preferences

- Keep the app simple - mirror the website's design
- Videos stream from Bunny CDN via embed URLs
- MP3s play as audio with playback controls
- Documents display via pages endpoint
- No admin capabilities
- Account creation and password reset redirect to website

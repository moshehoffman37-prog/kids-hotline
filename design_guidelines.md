# Design Guidelines: OneTimeOneTime Streaming App

## Brand Identity

**Purpose**: A secure content streaming platform for families, allowing parents to provide curated video/audio/photo content to children without browser access.

**Aesthetic Direction**: **Trustworthy & Calm** - Clean, organized, and reassuring. The design should feel professional and parent-approved while remaining approachable for kids. Think Netflix meets educational platforms - premium content experience without distractions.

**Memorable Element**: Generous whitespace and large, finger-friendly content cards that prioritize the media itself. The interface steps back to let content shine.

## Navigation Architecture

**Root Navigation**: Tab Bar (3 tabs)
- **Browse** - Discover and explore all available content
- **Library** - User's saved/favorited content and watch history
- **Profile** - Account info, settings, logout

**Authentication Flow**:
- Login screen (initial launch if not authenticated)
- SSO not needed - custom email/password login matching website credentials
- "Forgot Password?" and "Create Account" buttons link to onetimeonetime.com in external browser
- No in-app account creation or password reset

## Screen Specifications

### Login Screen
- **Purpose**: Authenticate existing customers
- **Layout**: 
  - Centered vertical stack (no header)
  - Logo/app icon at top
  - Email and password input fields
  - Primary "Sign In" button
  - Two text links below: "Forgot Password?" and "Create Account" (both open website)
  - Safe area insets: top = insets.top + Spacing.xxl, bottom = insets.bottom + Spacing.xl
- **Components**: Text inputs with floating labels, primary button, text links

### Browse Screen (Tab 1)
- **Purpose**: Discover all available content organized by category
- **Layout**:
  - Transparent header with app logo (left) and search icon (right)
  - Scrollable content area with horizontal content carousels
  - Sections: "Recently Added", "Videos", "Audio", "Photos", "Continue Watching"
  - Safe area insets: top = headerHeight + Spacing.xl, bottom = tabBarHeight + Spacing.xl
- **Components**: Horizontal scrolling lists, content cards with thumbnails
- **Empty State**: "No content available" with empty-browse.png illustration

### Content Detail Screen (Modal)
- **Purpose**: Display full content information and playback controls
- **Layout**:
  - Custom header with back button (left) and favorite icon (right)
  - Hero image/video preview at top
  - Title, description, metadata below
  - Large "Play" button (videos/audio) or "View" button (photos)
  - Safe area insets: top = headerHeight + Spacing.lg, bottom = insets.bottom + Spacing.xl
- **Components**: Media player, action buttons, text content

### Library Screen (Tab 2)
- **Purpose**: Access favorited content and watch history
- **Layout**:
  - Default header with "Library" title
  - Segmented control: "Favorites" | "History"
  - Grid view of saved content
  - Safe area insets: top = Spacing.xl, bottom = tabBarHeight + Spacing.xl
- **Components**: Segmented control, grid layout, content cards
- **Empty State**: "No saved content yet" with empty-library.png illustration

### Profile Screen (Tab 3)
- **Purpose**: View account info and app settings
- **Layout**:
  - Transparent header with "Profile" title
  - User avatar and email at top
  - Settings list: Notifications, Video Quality, Open Website, Help
  - Logout button at bottom (destructive style)
  - Safe area insets: top = headerHeight + Spacing.xl, bottom = tabBarHeight + Spacing.xl
- **Components**: Avatar, list items, destructive button
- **Logout**: Confirmation alert before logging out

### Search Screen (Modal)
- **Purpose**: Find specific content quickly
- **Layout**:
  - Search bar in header with cancel button
  - Recent searches (if empty)
  - Results grid below
  - Safe area insets: top = Spacing.xl, bottom = insets.bottom + Spacing.xl
- **Components**: Search input, grid results, empty state for no results

## Color Palette

- **Primary**: `#2563EB` (trustworthy blue)
- **Primary Dark**: `#1E40AF` (button press states)
- **Background**: `#F8FAFC` (soft light gray)
- **Surface**: `#FFFFFF` (cards, modals)
- **Text Primary**: `#0F172A` (near-black)
- **Text Secondary**: `#64748B` (muted gray)
- **Border**: `#E2E8F0` (subtle dividers)
- **Success**: `#10B981` (favorite/saved indicators)
- **Destructive**: `#EF4444` (logout, delete)

## Typography

- **Primary Font**: System default (SF Pro for iOS)
- **Scale**:
  - **Title**: Bold, 28pt (screen headers)
  - **Heading**: Semibold, 20pt (section headers)
  - **Body**: Regular, 16pt (descriptions)
  - **Caption**: Medium, 14pt (metadata, labels)
  - **Small**: Regular, 12pt (footnotes)

## Visual Design

- **Content Cards**: Rounded corners (12pt radius), subtle shadow for depth
- **Buttons**: Rounded (8pt radius), solid fill for primary actions
- **Touchable Feedback**: Reduce opacity to 0.7 on press
- **Tab Bar Icons**: Use Feather icons - home, heart, user
- **Floating Buttons**: Shadow specs - offset: {width: 0, height: 2}, opacity: 0.10, radius: 2

## Assets to Generate

1. **icon.png** - App icon featuring "1x1" or abstract play symbol in Primary blue - *Used: Device home screen*
2. **splash-icon.png** - Same as icon.png - *Used: Launch screen*
3. **empty-browse.png** - Illustration of empty content shelf/library - *Used: Browse screen when no content*
4. **empty-library.png** - Illustration of empty folder or bookmark - *Used: Library screen when no favorites/history*
5. **empty-search.png** - Illustration of magnifying glass with question mark - *Used: Search screen with no results*
6. **default-avatar.png** - Simple user silhouette in Primary color - *Used: Profile screen before user uploads avatar*

All illustrations should use the Primary color palette with light Background tints, simple geometric style, family-friendly aesthetic.
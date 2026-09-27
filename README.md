# Xencard Keeper

Your intelligent business-card manager. Scan, organize, and search business cards with on-device OCR and AI-powered natural language search through Xeni.

## Overview

Xencard Keeper is a production-quality business-card management application built with a focus on:
- Maximum performance
- Fast startup
- Offline-first operation
- On-device OCR
- Minimal cloud dependency
- Zero-cost development infrastructure
- Clean and maintainable TypeScript
- Cross-platform architecture

## Features

- **Scan Business Cards**: Capture physical business cards with camera
- **On-Device OCR**: Extract contact information without cloud dependency
- **Local Storage**: Store cards locally with SQLite
- **Instant Search**: Search contacts by name, company, industry
- **Xeni AI Assistant**: Natural language search and contact actions
- **Industry Categorization**: Automatically categorize by industry
- **Contact Actions**: Call, WhatsApp, email, open in Maps
- **Personal Card**: Create and share your own digital visiting card
- **Offline-First**: Core functionality works without internet
- **Optional Cloud Sync**: Backup and sync when desired

## Technology Stack

### Mobile App
- **Framework**: React Native + Expo
- **Navigation**: Expo Router
- **Language**: TypeScript (strict mode)
- **Database**: Expo SQLite + Drizzle ORM
- **State Management**: Zustand
- **Validation**: Zod
- **Forms**: React Hook Form
- **OCR**: Google ML Kit (Android), Apple Vision (iOS)
- **Styling**: NativeWind
- **Animation**: React Native Reanimated

### Backend (Optional)
- **API**: Vercel Functions
- **Database**: Supabase PostgreSQL
- **Auth**: Supabase Auth
- **Storage**: Supabase Storage

## Project Structure

```
xencard-keeper/
├── app/                    # Expo Router pages
│   ├── (tabs)/             # Tab navigation
│   ├── contact/            # Contact detail pages
│   ├── settings/           # Settings pages
│   └── personal-card/      # Personal card pages
├── src/
│   ├── components/         # Reusable UI components
│   ├── features/           # Feature modules
│   │   ├── contacts/       # Contact management
│   │   ├── scanner/        # Card scanning
│   │   ├── xeni/           # AI assistant
│   │   ├── personal-card/  # Personal card
│   │   ├── analytics/      # Analytics
│   │   └── sharing/        # Sharing functionality
│   ├── db/                 # Database layer
│   │   ├── client.ts       # SQLite client
│   │   ├── schema.ts       # Database schema
│   │   ├── migrations/     # Database migrations
│   │   └── repositories/   # Data repositories
│   ├── services/           # External services
│   │   ├── ocr/            # OCR service
│   │   ├── xeni/           # Xeni AI service
│   │   ├── linking/        # Deep linking
│   │   ├── sharing/        # Native sharing
│   │   ├── storage/        # File storage
│   │   └── sync/           # Cloud sync
│   ├── hooks/              # Custom React hooks
│   ├── stores/             # Zustand stores
│   ├── types/              # TypeScript types
│   ├── utils/              # Utility functions
│   ├── constants/          # App constants
│   └── config/             # Configuration
├── api/                    # Vercel API routes
├── assets/                 # Images, fonts, etc.
├── tests/                  # Test files
├── scripts/                # Build/deployment scripts
└── website/               # Companion website
```

## Development Setup

### Prerequisites

- Node.js 18+
- npm or yarn
- Expo CLI
- Android Studio (for Android development)
- Xcode (for iOS development, optional)

### Installation

1. Clone the repository:
```bash
git clone git@github.com:CreatixaIT/xencard-keeper.git
cd xencard-keeper
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npx expo start
```

4. Run on Android:
```bash
npx expo start --android
```

5. Run on iOS:
```bash
npx expo start --ios
```

### Environment Variables

Create a `.env` file (see `.env.example`):

```env
# Optional: Supabase (for cloud sync)
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Optional: Vercel API (for Xeni AI)
EXPO_PUBLIC_API_URL=your_vercel_api_url
```

**Important**: Never commit real secrets to Git. Use `.env.example` for reference only.

## Database Setup

The app uses Expo SQLite with Drizzle ORM. The database is automatically initialized on first launch.

### Schema

Primary tables:
- `contacts` - Stored business cards
- `personal_card` - User's personal card
- `scan_history` - Scan history
- `app_settings` - App settings
- `sync_queue` - Cloud sync queue

### Migrations

Migrations are applied automatically on app startup. See `src/db/migrations/` for migration files.

## Local Development

### Running Tests

```bash
npm test
```

### TypeScript Check

```bash
npx tsc --noEmit
```

### Linting

```bash
npm run lint
```

### Formatting

```bash
npm run format
```

## EAS Build

### Configuration

Build profiles are defined in `eas.json`:
- `development` - Development builds
- `preview` - Preview builds
- `production` - Production builds

### Building Android APK

```bash
eas build --platform android --profile preview
```

### Building for Production

```bash
eas build --platform android --profile production
```

## APK Distribution

The initial release will be distributed outside Google Play:
- Xeni website
- Social media
- WhatsApp
- Direct links
- QR codes

## Vercel Deployment

### API Routes

Deploy API routes to Vercel:
- `/api/health` - Health check
- `/api/version` - Version information
- `/api/xeni` - Xeni AI endpoint
- `/api/sync` - Cloud sync
- `/api/user` - User management

### Deployment

```bash
cd api
vercel deploy
```

## Supabase Configuration

### Setup

1. Create a Supabase project
2. Enable PostgreSQL database
3. Enable Auth
4. Enable Storage
5. Configure environment variables

### Tables

Supabase tables mirror local SQLite schema for cloud sync.

## Architecture Principles

### Offline-First

The local SQLite database is the primary data source. The app works without internet for:
- Opening the application
- Viewing cards
- Searching cards
- Viewing contact details
- Running OCR
- Basic Xeni commands
- Contact actions

### Performance

- **Startup**: Fast cold start, minimal initial loading
- **Search**: <100ms for local queries
- **Lists**: Virtualized rendering (FlatList)
- **Images**: Thumbnail generation

### Security

- No secrets in mobile app code
- Server-side API keys only
- Secure API communication
- Privacy-first data handling

## Xeni AI Assistant

Xeni provides natural language search and contact actions:

### Examples
- "Find Rahim"
- "Show me Rahim from ABC Motors"
- "Find all automotive contacts"
- "Email Rahim"
- "WhatsApp Rahim"
- "Call Rahim"
- "Show me where ABC Motors is"

### Architecture

Three-level search system:
1. **Level 1**: Exact/local search (SQLite)
2. **Level 2**: Local intent parsing (deterministic)
3. **Level 3**: LLM (only when necessary)

Xeni never directly executes native actions - it returns structured intent that the app validates.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for contribution guidelines.

## License

See [LICENSE](LICENSE) for license information.

## Support

For support, visit [Xeni Website](https://your-domain.com) or open an issue on GitHub.

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for version history.

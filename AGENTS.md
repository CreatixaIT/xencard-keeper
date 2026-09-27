# Xencard Keeper - Development Rules

## Core Principles

1. **TypeScript strict mode** - Never use `any` unless explicitly justified
2. **Offline-first architecture** - SQLite is the primary mobile data source
3. **On-device OCR** - OCR runs on-device, not in the cloud
4. **Privacy-first** - Do not send card images to external services by default
5. **Local search first** - Xeni must perform local search before using an LLM
6. **Secure architecture** - Never allow an LLM to directly execute native actions
7. **No secrets in code** - Never expose private API keys in the mobile app
8. **Minimal dependencies** - Keep dependencies minimal and purposeful
9. **Expo-compatible** - Prefer Expo-compatible solutions
10. **Test business logic** - Write tests for business logic
11. **Maintain working code** - Do not rewrite working code unnecessarily
12. **Optimize performance** - Optimize for startup time and perceived performance
13. **Local over remote** - Do not introduce a backend dependency when a local implementation is sufficient
14. **Document decisions** - Document significant architectural decisions

## Technology Stack

- **Framework**: React Native + Expo
- **Navigation**: Expo Router
- **Language**: TypeScript (strict mode)
- **Database**: Expo SQLite + Drizzle ORM
- **State Management**: Zustand
- **Validation**: Zod
- **Forms**: React Hook Form
- **OCR**: On-device (Google ML Kit for Android, Apple Vision for iOS)
- **Styling**: NativeWind or lightweight solution
- **Animation**: React Native Reanimated

## Architecture

The application must remain useful even when the internet is unavailable.

```
MOBILE APP (Primary)
├── Camera (on-device)
├── SQLite (local database)
├── OCR (on-device)
└── Xeni (local search + optional AI)

Optional Cloud Sync
└── Vercel API → Supabase (Auth, DB, Storage)
```

## Development Phases

1. **Phase 1 - Foundation**: Expo, TypeScript, Router, navigation, theme, project structure
2. **Phase 2 - SQLite**: Schema, migrations, repositories, CRUD, indexes, seed data
3. **Phase 3 - Dashboard**: Metrics, recent contacts, industry breakdown
4. **Phase 4 - Scanner**: Camera, permissions, capture, OCR abstraction, extraction, confirmation
5. **Phase 5 - Xeni**: Search bar, local search, intent parser, results, actions
6. **Phase 6 - Deep Linking**: Phone, WhatsApp, email, maps
7. **Phase 7 - Personal Card**: Create, edit, upload, preview, share
8. **Phase 8 - Vercel**: Health, version, optional AI endpoints
9. **Phase 9 - Supabase**: Optional auth, database, storage, sync (if required)
10. **Phase 10 - Website**: Landing, download, help, privacy
11. **Phase 11 - Testing**: Unit, integration, device, offline, permissions, performance
12. **Phase 12 - APK**: Production Android APK testing

## Performance Requirements

- **Startup**: Fast cold start, avoid loading unnecessary services
- **Search**: <100ms perceived response for local queries
- **Lists**: Use virtualization (FlatList), never render thousands of cards
- **Images**: Generate thumbnails, use appropriate sizes

## Error Handling

Never crash because:
- OCR fails
- Camera permission denied
- WhatsApp isn't installed
- Email isn't configured
- Maps isn't available
- Database query fails
- Network unavailable
- AI API unavailable

Use graceful fallbacks with clear user messaging.

## Security Rules

- Never place private API keys in React Native source code
- Never place private API keys in app.json
- Never place private API keys in public environment variables
- Never commit secrets to GitHub
- Never bundle secrets in APK
- Private keys must remain server-side (Vercel environment variables)
- Create .env.example but never commit real secrets

## Privacy Rules

Default behavior:
- OCR → device
- Card image → device
- Contact database → device
- Cloud synchronization is optional

Do not upload card information without:
- Clear user action, OR
- Enabled cloud-sync feature

## Do Not Over-Engineer

Prefer:
- SQLite over remote database request
- Local search over LLM call
- Vercel Function over dedicated server
- Native OS sharing over custom integrations
- Simple repository pattern over complex state architecture

Choose the simpler solution unless the more complex solution provides a measurable benefit.

## Commit Strategy

Use small, focused commits:
- feat: initialize expo project
- feat: add sqlite schema
- feat: add contact repository
- feat: build dashboard
- feat: add camera scanner
- feat: add ocr parser
- feat: add xeni local search
- feat: add contact actions
- feat: add personal card
- feat: add vercel api
- feat: add download website
- test: add xeni parser tests
- fix: handle whatsapp unavailable

## Quality Bar

Before considering MVP complete:
- TypeScript: No unexplained errors
- ESLint: No unexplained errors
- Tests: All critical business logic passes
- Database: Migrations work from clean installation
- Offline mode: Core functionality works without internet
- OCR: Works on representative cards
- Xeni: Simple searches do not require an LLM
- Security: No secrets bundled in the application
- Performance: No obvious UI freezes
- APK: Installs successfully on clean Android device

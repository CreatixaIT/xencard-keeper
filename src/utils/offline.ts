// Offline-first utilities
// The app is designed to work completely offline for core functionality

export async function isOnline(): Promise<boolean> {
  // For MVP, we assume offline-first operation
  // Core functionality works without internet
  return true; // Allow all operations, they will work locally
}

export function isOfflineSupported(): boolean {
  // All core features are offline-supported
  return true;
}

export function getOfflineCapabilities(): string[] {
  return [
    'View contacts',
    'Search contacts',
    'Create contacts',
    'Edit contacts',
    'Delete contacts',
    'Scan cards (camera works)',
    'View personal card',
    'Edit personal card',
    'Xeni local search',
  ];
}

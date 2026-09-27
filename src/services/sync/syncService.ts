import * as SecureStore from 'expo-secure-store';
import { getProfileByXencardId } from '../../db/repositories/userProfileRepository';

interface SyncQueueItem {
  id: string;
  entityType: 'user' | 'contact' | 'personalCard' | 'referral';
  entityId: string;
  action: 'create' | 'update' | 'delete';
  data: any;
  timestamp: number;
  retryCount: number;
}

class SyncService {
  private syncQueue: SyncQueueItem[] = [];
  private isSyncing = false;

  async getStoredXencardId(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync('xencardId');
    } catch (error) {
      console.error('Failed to get stored Xencard ID:', error);
      return null;
    }
  }

  async setStoredXencardId(xencardId: string): Promise<void> {
    try {
      await SecureStore.setItemAsync('xencardId', xencardId);
    } catch (error) {
      console.error('Failed to store Xencard ID:', error);
    }
  }

  async clearStoredXencardId(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync('xencardId');
    } catch (error) {
      console.error('Failed to clear Xencard ID:', error);
    }
  }

  async logoutUser(): Promise<void> {
    try {
      await this.clearStoredXencardId();
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  }

  async registerUser(userData: {
    fullName: string;
    designation: string;
    dateOfBirth: string;
    referralCode?: string;
  }): Promise<{ user: any; xencardId: string }> {
    try {
      // Generate Xencard ID using the same method as userProfileRepository
      const timestamp = Date.now().toString(36);
      const random = Math.random().toString(36).substring(2, 8);
      const xencardId = `XEN${timestamp}${random}`.toUpperCase();

      const user = {
        id: Date.now().toString(),
        xencardId,
        fullName: userData.fullName,
        designation: userData.designation,
        dateOfBirth: userData.dateOfBirth,
        referralCode: xencardId,
        referredBy: userData.referralCode || null,
        cardLimit: 100,
        createdAt: new Date().toISOString(),
      };

      await this.setStoredXencardId(xencardId);
      return { user, xencardId };
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  }

  async loginUser(xencardId: string): Promise<{ user: any }> {
    try {
      // Normalize input: trim whitespace and uppercase
      const normalizedId = xencardId.trim().toUpperCase();
      
      // Validate against database (source of truth)
      const profile = await getProfileByXencardId(normalizedId);
      if (!profile) {
        throw new Error('Invalid Xencard ID. Please check the ID and try again.');
      }

      const user = {
        xencardId: profile.xencardId,
        fullName: profile.fullName,
        designation: profile.designation,
        cardLimit: profile.cardLimit,
      };

      await this.setStoredXencardId(profile.xencardId);
      return { user };
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  async syncContacts(contacts: any[]): Promise<any[]> {
    // For MVP, just return contacts as-is (local storage)
    return contacts;
  }

  async fetchContacts(): Promise<any[]> {
    // For MVP, return empty array
    return [];
  }

  async syncPersonalCard(personalCard: any): Promise<any> {
    // For MVP, just return the card as-is
    return personalCard;
  }

  async fetchPersonalCard(): Promise<any | null> {
    // For MVP, return null
    return null;
  }

  addToSyncQueue(item: SyncQueueItem): void {
    this.syncQueue.push(item);
    this.processSyncQueue();
  }

  private async processSyncQueue(): Promise<void> {
    if (this.isSyncing || this.syncQueue.length === 0) return;

    this.isSyncing = true;

    while (this.syncQueue.length > 0) {
      const item = this.syncQueue.shift();
      if (!item) continue;

      try {
        await this.syncItem(item);
      } catch (error) {
        console.error('Sync item failed:', error);
        item.retryCount++;
        if (item.retryCount < 3) {
          this.syncQueue.unshift(item);
        }
      }
    }

    this.isSyncing = false;
  }

  private async syncItem(item: SyncQueueItem): Promise<void> {
    // For MVP, skip actual sync
    // console.log('Sync item skipped in MVP mode:', item);
    void item; // Mark as intentionally unused for MVP
  }
}

export const syncService = new SyncService();

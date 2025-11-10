import { Injectable } from '@angular/core';
import { initializeApp, FirebaseApp } from 'firebase/app';
import { getAuth, signInAnonymously, Auth, User, onAuthStateChanged } from 'firebase/auth';
import {
  getFirestore,
  Firestore,
  doc,
  setDoc,
  getDoc,
  onSnapshot,
  Unsubscribe,
} from 'firebase/firestore';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { LocalStorageService } from './local-storage';

/**
 * Service for syncing seen license plates to Firebase Firestore.
 * Uses anonymous authentication to create a unique user ID.
 * Automatically syncs data when online and handles offline mode.
 */
@Injectable({
  providedIn: 'root',
})
export class FirebaseSyncService {
  private app: FirebaseApp | null = null;
  private auth: Auth | null = null;
  private firestore: Firestore | null = null;
  private currentUser: User | null = null;
  private unsubscribeSnapshot: Unsubscribe | null = null;

  private syncStatus$ = new BehaviorSubject<'offline' | 'syncing' | 'synced' | 'error'>('offline');
  private lastSyncTime$ = new BehaviorSubject<Date | null>(null);
  private shortCode$ = new BehaviorSubject<string | null>(null);
  private isInitialized = false;
  private isSyncing = false;

  constructor(private localStorageService: LocalStorageService) {
    this.initializeIfConfigured();

    // Listen for local data changes and sync to cloud
    this.localStorageService.onDataChanged$.subscribe(() => {
      if (this.isSyncEnabled()) {
        this.syncToCloud();
      }
    });
  }

  /**
   * Check if Firebase is properly configured
   */
  private isConfigured(): boolean {
    return !!(
      environment.firebase &&
      environment.firebase.apiKey &&
      environment.firebase.projectId
    );
  }

  /**
   * Initialize Firebase only if configuration is present
   */
  private async initializeIfConfigured(): Promise<void> {
    if (!this.isConfigured()) {
      console.log('Firebase not configured, sync disabled');
      return;
    }

    try {
      console.log('Initializing Firebase...');
      this.app = initializeApp(environment.firebase);
      this.auth = getAuth(this.app);
      this.firestore = getFirestore(this.app);
      console.log('Firebase app and services initialized');

      // Listen for auth state changes
      onAuthStateChanged(this.auth, async (user) => {
        console.log('Auth state changed:', user ? `User: ${user.uid}` : 'No user');
        this.currentUser = user;
        if (user) {
          console.log('User signed in:', user.uid);
          this.isInitialized = true; // Set initialized when user is signed in
          await this.generateAndSaveShortCode(); // Generate short code for new user
          this.setupRealtimeSync();
          this.syncToCloud();
        } else {
          console.log('User signed out');
          this.isInitialized = false;
          this.syncStatus$.next('offline');
          this.shortCode$.next(null);
        }
      });

      console.log('Attempting anonymous sign in...');
      // Sign in anonymously
      await signInAnonymously(this.auth);
      console.log('Anonymous sign in completed');
    } catch (error) {
      console.error('Firebase initialization error:', error);
      this.syncStatus$.next('error');
      this.isInitialized = false;
    }
  }

  /**
   * Get the current sync status
   */
  getSyncStatus(): Observable<'offline' | 'syncing' | 'synced' | 'error'> {
    return this.syncStatus$.asObservable();
  }

  /**
   * Get the last sync time
   */
  getLastSyncTime(): Observable<Date | null> {
    return this.lastSyncTime$.asObservable();
  }

  /**
   * Get the short code for sharing
   */
  getShortCode(): Observable<string | null> {
    return this.shortCode$.asObservable();
  }

  /**
   * Generate a simple 6-character short code in ABC123 format
   */
  private generateShortCode(): string {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    let result = '';
    // Generate 3 letters
    for (let i = 0; i < 3; i++) {
      result += letters.charAt(Math.floor(Math.random() * letters.length));
    }
    // Generate 3 numbers
    for (let i = 0; i < 3; i++) {
      result += numbers.charAt(Math.floor(Math.random() * numbers.length));
    }
    return result;
  }

  /**
   * Save the short code to Firestore
   */
  private async saveShortCode(userId: string, shortCode: string): Promise<void> {
    if (!this.firestore) return;
    try {
      await setDoc(doc(this.firestore, 'shortCodes', shortCode), {
        userId,
        createdAt: new Date(),
      });
    } catch (error) {
      console.error('Error saving short code:', error);
    }
  }

  /**
   * Load user ID from short code
   */
  private async loadUserIdFromShortCode(shortCode: string): Promise<string | null> {
    if (!this.firestore) return null;
    try {
      const docRef = doc(this.firestore, 'shortCodes', shortCode);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return docSnap.data()['userId'];
      }
    } catch (error) {
      console.error('Error loading short code:', error);
    }
    return null;
  }

  /**
   * Generate and save a short code for the current user
   */
  private async generateAndSaveShortCode(): Promise<void> {
    if (!this.currentUser) return;

    try {
      // Check if we already have a short code for this user
      const existingShortCode = localStorage.getItem('userShortCode');
      if (existingShortCode) {
        this.shortCode$.next(existingShortCode);
        return;
      }

      // Generate a new short code
      let shortCode: string;
      let attempts = 0;
      do {
        shortCode = this.generateShortCode();
        attempts++;
        // Check if this short code is already taken
        const existingUserId = await this.loadUserIdFromShortCode(shortCode);
        if (!existingUserId) break; // Short code is available
        if (attempts > 10) {
          console.error('Failed to generate unique short code after 10 attempts');
          return;
        }
      } while (true);

      // Save the short code
      await this.saveShortCode(this.currentUser.uid, shortCode);
      localStorage.setItem('userShortCode', shortCode);
      this.shortCode$.next(shortCode);
      console.log('Generated short code:', shortCode);
    } catch (error) {
      console.error('Error generating short code:', error);
    }
  }

  /**
   * Get the user ID for displaying in settings
   */
  getUserId(): string | null {
    return this.currentUser?.uid || null;
  }

  /**
   * Export user ID for cross-device sync
   */
  exportUserId(): string | null {
    // Always return current user ID for sharing with other devices
    return this.currentUser?.uid || null;
  }

  /**
   * Import user ID from another device (for cross-device sync)
   * This switches the sync target to the specified user ID or short code
   */
  async importUserId(input: string): Promise<boolean> {
    if (!this.firestore || !this.auth) return false;

    try {
      let userId = input;

      // If input is 6 characters, treat it as a short code
      if (input.length === 6) {
        console.log('Resolving short code:', input);
        const resolvedUserId = await this.loadUserIdFromShortCode(input.toUpperCase());
        if (!resolvedUserId) {
          console.error('Short code not found:', input);
          return false;
        }
        userId = resolvedUserId;
        console.log('Resolved to user ID:', userId);
      }

      // Store the target user ID
      localStorage.setItem('targetUserId', userId);

      // If we're already signed in, restart sync with new target
      if (this.currentUser) {
        this.setupRealtimeSync();
        await this.syncToCloud();
      }

      console.log('Target user ID imported for cross-device sync:', userId);
      return true;
    } catch (error) {
      console.error('Failed to import user ID:', error);
      return false;
    }
  }

  /**
   * Setup realtime sync listener
   */
  private setupRealtimeSync(): void {
    if (!this.firestore || !this.currentUser) {
      console.log('Cannot setup realtime sync: firestore or user not available');
      return;
    }

    // Use target user ID if set, otherwise use current user ID
    const syncUserId = localStorage.getItem('targetUserId') || this.currentUser.uid;
    console.log('Setting up realtime sync for user:', syncUserId);
    const userDocRef = doc(this.firestore, 'users', syncUserId);

    // Unsubscribe from previous listener if exists
    if (this.unsubscribeSnapshot) {
      this.unsubscribeSnapshot();
    }

    // Listen for changes from cloud
    this.unsubscribeSnapshot = onSnapshot(
      userDocRef,
      (docSnapshot) => {
        console.log('Realtime sync snapshot received');
        if (docSnapshot.exists() && !this.isSyncing) {
          const cloudData = docSnapshot.data();
          const cloudCodes = (cloudData['seenCodes'] as string[]) || [];
          const lastModified = cloudData['lastModified']?.toDate() || new Date(0);

          // Merge with local data (union of both sets)
          const localCodes = this.localStorageService.getSeenCodes();
          const mergedCodes = Array.from(new Set([...localCodes, ...cloudCodes]));

          // Update local storage if there are new codes from cloud
          if (mergedCodes.length > localCodes.length) {
            console.log(`Received ${mergedCodes.length - localCodes.length} new codes from cloud`);
            this.localStorageService.setSeenCodes(mergedCodes);
          }

          this.lastSyncTime$.next(lastModified);
          this.syncStatus$.next('synced');
        } else {
          console.log('Document does not exist or currently syncing');
        }
      },
      (error) => {
        console.error('Realtime sync error:', error);
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);
        this.syncStatus$.next('error');
      }
    );
  }

  /**
   * Sync local data to cloud
   */
  async syncToCloud(): Promise<void> {
    if (!this.firestore || !this.currentUser || !this.isInitialized) {
      console.log('Cannot sync: Firebase not initialized', {
        firestore: !!this.firestore,
        currentUser: !!this.currentUser,
        isInitialized: this.isInitialized,
      });
      return;
    }

    if (this.isSyncing) {
      console.log('Sync already in progress');
      return;
    }

    // Use target user ID if set, otherwise use current user ID
    const syncUserId = localStorage.getItem('targetUserId') || this.currentUser.uid;
    console.log('Starting sync to cloud for user:', syncUserId);

    try {
      this.isSyncing = true;
      this.syncStatus$.next('syncing');

      // Write to shared document (target user ID if set)
      const userDocRef = doc(this.firestore, 'users', syncUserId);
      const localCodes = this.localStorageService.getSeenCodes();
      console.log('Local codes to sync:', localCodes.length);

      // Get current cloud data
      console.log('Fetching existing cloud data...');
      const docSnapshot = await getDoc(userDocRef);
      let finalCodes = localCodes;

      if (docSnapshot.exists()) {
        console.log('Cloud document exists');
        const cloudData = docSnapshot.data();
        const cloudCodes = (cloudData['seenCodes'] as string[]) || [];
        console.log('Cloud codes:', cloudCodes.length);

        // Merge: union of local and cloud
        finalCodes = Array.from(new Set([...localCodes, ...cloudCodes]));

        // Update local storage if cloud had more data
        if (finalCodes.length > localCodes.length) {
          console.log(`Merged ${finalCodes.length - localCodes.length} codes from cloud`);
          this.localStorageService.setSeenCodes(finalCodes);
        }
      } else {
        console.log('No existing cloud document');
      }

      // Save merged data to shared cloud document
      console.log('Saving data to cloud...');
      await setDoc(userDocRef, {
        seenCodes: finalCodes,
        lastModified: new Date(),
        deviceInfo: {
          userAgent: navigator.userAgent,
          platform: navigator.platform,
        },
      });

      this.lastSyncTime$.next(new Date());
      this.syncStatus$.next('synced');
      console.log(`Synced ${finalCodes.length} codes to cloud successfully`);
    } catch (error) {
      console.error('Sync to cloud error:', error);
      console.error('Error code:', (error as any)?.code);
      console.error('Error message:', (error as any)?.message);
      this.syncStatus$.next('error');
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Manually trigger a sync
   */
  async manualSync(): Promise<void> {
    await this.syncToCloud();
  }

  /**
   * Check if sync is enabled
   */
  isSyncEnabled(): boolean {
    return this.isInitialized && this.currentUser !== null;
  }

  /**
   * Cleanup on destroy
   */
  destroy(): void {
    if (this.unsubscribeSnapshot) {
      this.unsubscribeSnapshot();
    }
  }
}

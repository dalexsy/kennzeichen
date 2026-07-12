import { Injectable } from '@angular/core';
import { initializeApp, FirebaseApp } from 'firebase/app';
import { getAuth, signInAnonymously, Auth, User, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, Firestore, Unsubscribe } from 'firebase/firestore';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { LocalStorageService } from './local-storage';
import { generateAndSaveShortCode } from './firebase-short-code';
import {
  CloudSyncContext,
  importUserId,
  setupRealtimeSync,
  syncToCloud,
} from './firebase-cloud-sync';

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
  private isSyncingRef = { value: false };

  constructor(private localStorageService: LocalStorageService) {
    this.initializeIfConfigured();

    this.localStorageService.onDataChanged$.subscribe(() => {
      if (this.isSyncEnabled()) {
        this.syncToCloud();
      }
    });
  }

  private isConfigured(): boolean {
    return !!(
      environment.firebase &&
      environment.firebase.apiKey &&
      environment.firebase.projectId
    );
  }

  private getSyncContext(): CloudSyncContext | null {
    if (!this.firestore || !this.currentUser) return null;
    return {
      firestore: this.firestore,
      currentUser: this.currentUser,
      localStorageService: this.localStorageService,
      syncStatus$: this.syncStatus$,
      lastSyncTime$: this.lastSyncTime$,
      isSyncingRef: this.isSyncingRef,
      unsubscribeSnapshot: this.unsubscribeSnapshot,
    };
  }

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

      onAuthStateChanged(this.auth, async (user) => {
        console.log('Auth state changed:', user ? `User: ${user.uid}` : 'No user');
        this.currentUser = user;
        if (user) {
          console.log('User signed in:', user.uid);
          this.isInitialized = true;
          if (this.firestore) {
            await generateAndSaveShortCode(this.firestore, user, this.shortCode$);
          }
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
      await signInAnonymously(this.auth);
      console.log('Anonymous sign in completed');
    } catch (error) {
      console.error('Firebase initialization error:', error);
      this.syncStatus$.next('error');
      this.isInitialized = false;
    }
  }

  getSyncStatus(): Observable<'offline' | 'syncing' | 'synced' | 'error'> {
    return this.syncStatus$.asObservable();
  }

  getLastSyncTime(): Observable<Date | null> {
    return this.lastSyncTime$.asObservable();
  }

  getShortCode(): Observable<string | null> {
    return this.shortCode$.asObservable();
  }

  getUserId(): string | null {
    return this.currentUser?.uid || null;
  }

  exportUserId(): string | null {
    return this.currentUser?.uid || null;
  }

  async importUserId(input: string): Promise<boolean> {
    const ctx = this.getSyncContext();
    if (!ctx || !this.auth) return false;

    return importUserId(ctx, input, () => {
      this.setupRealtimeSync();
      void this.syncToCloud();
    });
  }

  private setupRealtimeSync(): void {
    const ctx = this.getSyncContext();
    if (!ctx) return;
    setupRealtimeSync(ctx);
    this.unsubscribeSnapshot = ctx.unsubscribeSnapshot;
  }

  async syncToCloud(): Promise<void> {
    if (!this.firestore || !this.currentUser || !this.isInitialized) {
      console.log('Cannot sync: Firebase not initialized', {
        firestore: !!this.firestore,
        currentUser: !!this.currentUser,
        isInitialized: this.isInitialized,
      });
      return;
    }

    const ctx = this.getSyncContext();
    if (!ctx) return;
    await syncToCloud(ctx);
    this.unsubscribeSnapshot = ctx.unsubscribeSnapshot;
  }

  async manualSync(): Promise<void> {
    await this.syncToCloud();
  }

  isSyncEnabled(): boolean {
    return this.isInitialized && this.currentUser !== null;
  }

  destroy(): void {
    if (this.unsubscribeSnapshot) {
      this.unsubscribeSnapshot();
    }
  }
}
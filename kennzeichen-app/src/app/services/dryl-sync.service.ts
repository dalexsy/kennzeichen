import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { createUserAppDataStore, type UserAppDataStore } from '@dryl/app-data';
import { LocalStorageService } from './local-storage';

const APP_KEY = 'kennzeichen';

type KennzeichenBlob = {
  version: 1;
  seenCodes: string[];
  updatedAt: string;
};

/**
 * Account-scoped plate progress via @dryl/app-data (dryl-auth user-app-data).
 * Cross-device sync = sign in with the same dryl account.
 */
@Injectable({ providedIn: 'root' })
export class DrylSyncService {
  private readonly localStorageService = inject(LocalStorageService);
  private readonly dataStore: UserAppDataStore = createUserAppDataStore(APP_KEY);
  private readonly syncStatus$ = new BehaviorSubject<
    'offline' | 'syncing' | 'synced' | 'error'
  >('offline');
  private readonly lastSyncTime$ = new BehaviorSubject<Date | null>(null);
  private readonly accountLabel$ = new BehaviorSubject<string | null>(null);
  private signedIn = false;
  private saveTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    this.localStorageService.onDataChanged$.subscribe(() => {
      if (this.signedIn) {
        this.queueSave();
      }
    });
    void this.bootstrap();
  }

  private store(): UserAppDataStore {
    return this.dataStore;
  }

  private async bootstrap(): Promise<void> {
    try {
      const user = await this.dataStore.authMe();
      if (!user?.id) {
        this.signedIn = false;
        this.syncStatus$.next('offline');
        this.accountLabel$.next(null);
        return;
      }
      this.signedIn = true;
      this.accountLabel$.next(user.username || user.id.slice(0, 8));
      await this.pullAndMerge(this.dataStore);
    } catch {
      this.signedIn = false;
      this.syncStatus$.next('error');
    }
  }

  private async pullAndMerge(store: UserAppDataStore): Promise<void> {
    this.syncStatus$.next('syncing');
    try {
      const remote = await store.loadRemote();
      const remoteCodes =
        remote && typeof remote === 'object' && Array.isArray((remote as KennzeichenBlob).seenCodes)
          ? (remote as KennzeichenBlob).seenCodes
          : [];
      const localCodes = this.localStorageService.getSeenCodes();
      const merged = Array.from(new Set([...localCodes, ...remoteCodes]));
      if (merged.length > localCodes.length) {
        this.localStorageService.setSeenCodes(merged);
      }
      await store.saveRemote({
        version: 1,
        seenCodes: merged,
        updatedAt: new Date().toISOString(),
      } satisfies KennzeichenBlob);
      this.lastSyncTime$.next(new Date());
      this.syncStatus$.next('synced');
    } catch {
      this.syncStatus$.next('error');
    }
  }

  private queueSave(): void {
    if (this.saveTimer) {
      clearTimeout(this.saveTimer);
    }
    this.saveTimer = setTimeout(() => {
      void this.pushLocal();
    }, 800);
  }

  private async pushLocal(): Promise<void> {
    if (!this.signedIn) {
      return;
    }
    this.syncStatus$.next('syncing');
    try {
      const blob: KennzeichenBlob = {
        version: 1,
        seenCodes: this.localStorageService.getSeenCodes(),
        updatedAt: new Date().toISOString(),
      };
      await this.dataStore.saveRemote(blob);
      this.lastSyncTime$.next(new Date());
      this.syncStatus$.next('synced');
    } catch {
      this.syncStatus$.next('error');
    }
  }

  getSyncStatus(): Observable<'offline' | 'syncing' | 'synced' | 'error'> {
    return this.syncStatus$.asObservable();
  }

  getLastSyncTime(): Observable<Date | null> {
    return this.lastSyncTime$.asObservable();
  }

  /** Shown in UI instead of Firebase short codes. */
  getShortCode(): Observable<string | null> {
    return this.accountLabel$.asObservable();
  }

  getUserId(): string | null {
    return this.accountLabel$.value;
  }

  exportUserId(): string | null {
    return this.getUserId();
  }

  /** Peer short-code import removed — sign in with dryl on each device. */
  async importUserId(_input: string): Promise<boolean> {
    return false;
  }

  async manualSync(): Promise<void> {
    const user = await this.dataStore.authMe();
    if (!user?.id) {
      this.signedIn = false;
      this.syncStatus$.next('offline');
      return;
    }
    this.signedIn = true;
    this.accountLabel$.next(user.username || user.id.slice(0, 8));
    await this.pullAndMerge(this.dataStore);
  }

  isSyncEnabled(): boolean {
    return this.signedIn;
  }

  destroy(): void {
    if (this.saveTimer) {
      clearTimeout(this.saveTimer);
    }
  }
}

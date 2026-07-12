import { Firestore, doc, setDoc, getDoc, onSnapshot, Unsubscribe } from 'firebase/firestore';
import { User } from 'firebase/auth';
import { BehaviorSubject } from 'rxjs';
import { LocalStorageService } from './local-storage';
import { loadUserIdFromShortCode } from './firebase-short-code';

export interface CloudSyncContext {
  firestore: Firestore;
  currentUser: User;
  localStorageService: LocalStorageService;
  syncStatus$: BehaviorSubject<'offline' | 'syncing' | 'synced' | 'error'>;
  lastSyncTime$: BehaviorSubject<Date | null>;
  isSyncingRef: { value: boolean };
  unsubscribeSnapshot: Unsubscribe | null;
}

export function getSyncUserId(currentUser: User): string {
  return localStorage.getItem('targetUserId') || currentUser.uid;
}

export async function importUserId(
  ctx: CloudSyncContext,
  input: string,
  onSyncRestart: () => void
): Promise<boolean> {
  try {
    let userId = input;

    if (input.length === 6) {
      console.log('Resolving short code:', input);
      const resolvedUserId = await loadUserIdFromShortCode(ctx.firestore, input.toUpperCase());
      if (!resolvedUserId) {
        console.error('Short code not found:', input);
        return false;
      }
      userId = resolvedUserId;
      console.log('Resolved to user ID:', userId);
    }

    localStorage.setItem('targetUserId', userId);

    const userDocRef = doc(ctx.firestore, 'users', userId);
    const docSnapshot = await getDoc(userDocRef);
    if (docSnapshot.exists()) {
      const cloudCodes = (docSnapshot.data()['seenCodes'] as string[]) || [];
      const localCodes = ctx.localStorageService.getSeenCodes();
      const mergedCodes = Array.from(new Set([...localCodes, ...cloudCodes]));
      if (mergedCodes.length > localCodes.length) {
        ctx.localStorageService.setSeenCodes(mergedCodes);
      }
    }

    if (ctx.currentUser) {
      onSyncRestart();
    }

    console.log('Target user ID imported for cross-device sync:', userId);
    return true;
  } catch (error) {
    console.error('Failed to import user ID:', error);
    return false;
  }
}

export function setupRealtimeSync(ctx: CloudSyncContext): void {
  if (!ctx.firestore || !ctx.currentUser) {
    console.log('Cannot setup realtime sync: firestore or user not available');
    return;
  }

  const syncUserId = getSyncUserId(ctx.currentUser);
  console.log('Setting up realtime sync for user:', syncUserId);
  const userDocRef = doc(ctx.firestore, 'users', syncUserId);

  if (ctx.unsubscribeSnapshot) {
    ctx.unsubscribeSnapshot();
  }

  ctx.unsubscribeSnapshot = onSnapshot(
    userDocRef,
    (docSnapshot) => {
      console.log('Realtime sync snapshot received');
      if (docSnapshot.exists() && !ctx.isSyncingRef.value) {
        const cloudData = docSnapshot.data();
        const cloudCodes = (cloudData['seenCodes'] as string[]) || [];
        const lastModified = cloudData['lastModified']?.toDate() || new Date(0);

        const localCodes = ctx.localStorageService.getSeenCodes();
        const mergedCodes = Array.from(new Set([...localCodes, ...cloudCodes]));

        if (mergedCodes.length > localCodes.length) {
          console.log(`Received ${mergedCodes.length - localCodes.length} new codes from cloud`);
          ctx.localStorageService.setSeenCodes(mergedCodes);
        }

        ctx.lastSyncTime$.next(lastModified);
        ctx.syncStatus$.next('synced');
      } else {
        console.log('Document does not exist or currently syncing');
      }
    },
    (error) => {
      console.error('Realtime sync error:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      ctx.syncStatus$.next('error');
    }
  );
}

export async function syncToCloud(ctx: CloudSyncContext): Promise<void> {
  if (!ctx.firestore || !ctx.currentUser) {
    console.log('Cannot sync: Firebase not initialized');
    return;
  }

  if (ctx.isSyncingRef.value) {
    console.log('Sync already in progress');
    return;
  }

  const syncUserId = getSyncUserId(ctx.currentUser);
  console.log('Starting sync to cloud for user:', syncUserId);

  try {
    ctx.isSyncingRef.value = true;
    ctx.syncStatus$.next('syncing');

    const userDocRef = doc(ctx.firestore, 'users', syncUserId);
    const localCodes = ctx.localStorageService.getSeenCodes();
    console.log('Local codes to sync:', localCodes.length);

    console.log('Fetching existing cloud data...');
    const docSnapshot = await getDoc(userDocRef);
    let finalCodes = localCodes;

    if (docSnapshot.exists()) {
      console.log('Cloud document exists');
      const cloudData = docSnapshot.data();
      const cloudCodes = (cloudData['seenCodes'] as string[]) || [];
      console.log('Cloud codes:', cloudCodes.length);

      finalCodes = Array.from(new Set([...localCodes, ...cloudCodes]));

      if (finalCodes.length > localCodes.length) {
        console.log(`Merged ${finalCodes.length - localCodes.length} codes from cloud`);
        ctx.localStorageService.setSeenCodes(finalCodes);
      }
    } else {
      console.log('No existing cloud document');
    }

    console.log('Saving data to cloud...');
    await setDoc(userDocRef, {
      seenCodes: finalCodes,
      lastModified: new Date(),
      deviceInfo: {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
      },
    });

    ctx.lastSyncTime$.next(new Date());
    ctx.syncStatus$.next('synced');
    console.log(`Synced ${finalCodes.length} codes to cloud successfully`);
  } catch (error) {
    console.error('Sync to cloud error:', error);
    console.error('Error code:', (error as { code?: string })?.code);
    console.error('Error message:', (error as { message?: string })?.message);
    ctx.syncStatus$.next('error');
  } finally {
    ctx.isSyncingRef.value = false;
  }
}
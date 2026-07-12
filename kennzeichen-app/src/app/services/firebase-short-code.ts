import { Firestore, doc, setDoc, getDoc } from 'firebase/firestore';
import { User } from 'firebase/auth';
import { BehaviorSubject } from 'rxjs';

export function generateShortCode(): string {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  let result = '';
  for (let i = 0; i < 3; i++) {
    result += letters.charAt(Math.floor(Math.random() * letters.length));
  }
  for (let i = 0; i < 3; i++) {
    result += numbers.charAt(Math.floor(Math.random() * numbers.length));
  }
  return result;
}

export async function saveShortCode(
  firestore: Firestore,
  userId: string,
  shortCode: string
): Promise<void> {
  try {
    await setDoc(doc(firestore, 'shortCodes', shortCode), {
      userId,
      createdAt: new Date(),
    });
  } catch (error) {
    console.error('Error saving short code:', error);
  }
}

export async function loadUserIdFromShortCode(
  firestore: Firestore,
  shortCode: string
): Promise<string | null> {
  try {
    const docRef = doc(firestore, 'shortCodes', shortCode);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data()['userId'];
    }
  } catch (error) {
    console.error('Error loading short code:', error);
  }
  return null;
}

export async function generateAndSaveShortCode(
  firestore: Firestore,
  currentUser: User,
  shortCode$: BehaviorSubject<string | null>
): Promise<void> {
  try {
    const existingShortCode = localStorage.getItem('userShortCode');
    if (existingShortCode) {
      shortCode$.next(existingShortCode);
      return;
    }

    let shortCode: string;
    let attempts = 0;
    do {
      shortCode = generateShortCode();
      attempts++;
      const existingUserId = await loadUserIdFromShortCode(firestore, shortCode);
      if (!existingUserId) break;
      if (attempts > 10) {
        console.error('Failed to generate unique short code after 10 attempts');
        return;
      }
    } while (true);

    await saveShortCode(firestore, currentUser.uid, shortCode);
    localStorage.setItem('userShortCode', shortCode);
    shortCode$.next(shortCode);
    console.log('Generated short code:', shortCode);
  } catch (error) {
    console.error('Error generating short code:', error);
  }
}
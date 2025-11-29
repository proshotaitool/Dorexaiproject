
import { doc, Firestore, updateDoc, increment } from 'firebase/firestore';

export const deductCredit = async (firestore: Firestore, userId: string): Promise<boolean> => {
  // Return true without deducting credits to make them unlimited for now.
  return true;

  /*
  // This is the original logic that deducts credits.
  // It is commented out to make credits unlimited as requested.

  if (!userId) return false;

  const userDocRef = doc(firestore, 'users', userId);
  try {
    await updateDoc(userDocRef, {
      credits: increment(-1),
    });
    return true;
  } catch (error) {
    console.error("Failed to deduct credit:", error);
    return false;
  }
  */
};


import { collection, addDoc, serverTimestamp, type Firestore } from 'firebase/firestore';
import type { User } from 'firebase/auth';

export const logAction = async (
  firestore: Firestore,
  user: User,
  action: string
) => {
  if (!firestore || !user) return;

  try {
    await addDoc(collection(firestore, 'audit-logs'), {
      userId: user.uid,
      userEmail: user.email,
      action: action,
      timestamp: serverTimestamp(),
    });
  } catch (error) {
    console.error("Failed to write to audit log:", error);
  }
};

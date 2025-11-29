export interface UserProfile {
    uid: string;
    email: string;
    name?: string;
    photoURL?: string;
    role?: 'user' | 'admin';
    credits?: number;
    favoriteTools?: string[];
    plan?: string;
    status?: string;
    joined?: { toDate: () => Date } | Date;
    avatarStyle?: string;
    avatarUrl?: string;
}

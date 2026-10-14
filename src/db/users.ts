// src/db/users.ts
import { db, isCloudSqlEnabled } from './index.ts';
import { users } from './schema.ts';
import { eq } from 'drizzle-orm';

export async function getOrCreateUser(uid: string, email: string, displayName?: string, photoUrl?: string) {
  if (!isCloudSqlEnabled || !db) {
    return {
      id: 1,
      uid,
      email,
      displayName: displayName || null,
      photoUrl: photoUrl || null,
      tier: 'free',
      preferences: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }
  try {
    const result = await db.insert(users)
      .values({
        uid,
        email,
        displayName: displayName || null,
        photoUrl: photoUrl || null,
      })
      .onConflictDoUpdate({
        target: users.uid,
        set: {
          email,
          displayName: displayName || undefined,
          photoUrl: photoUrl || undefined,
          updatedAt: new Date(),
        },
      })
      .returning();

    return result[0];
  } catch (error) {
    console.warn('Database query bypassed in getOrCreateUser:', error);
    return {
      id: 1,
      uid,
      email,
      displayName: displayName || null,
      photoUrl: photoUrl || null,
      tier: 'free',
      preferences: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }
}

export async function getUserProfile(uid: string) {
  if (!isCloudSqlEnabled || !db) {
    return null;
  }
  try {
    const result = await db.select().from(users).where(eq(users.uid, uid)).limit(1);
    return result[0] || null;
  } catch (error) {
    console.warn('Database query bypassed in getUserProfile:', error);
    return null;
  }
}

export async function updateUserPreferences(uid: string, preferences: Record<string, any>, diceCubeUnlocked?: string[]) {
  if (!isCloudSqlEnabled || !db) {
    return {
      id: 1,
      uid,
      preferences,
      diceCubeUnlocked: diceCubeUnlocked || [],
      updatedAt: new Date().toISOString()
    };
  }
  try {
    const updateData: Record<string, any> = {
      preferences,
      updatedAt: new Date(),
    };
    if (diceCubeUnlocked) {
      updateData.diceCubeUnlocked = diceCubeUnlocked;
    }

    const result = await db.update(users)
      .set(updateData)
      .where(eq(users.uid, uid))
      .returning();

    return result[0];
  } catch (error) {
    console.warn('Database query bypassed in updateUserPreferences:', error);
    return {
      id: 1,
      uid,
      preferences,
      diceCubeUnlocked: diceCubeUnlocked || [],
      updatedAt: new Date().toISOString()
    };
  }
}

export async function deleteUserData(uid: string): Promise<boolean> {
  if (!isCloudSqlEnabled || !db) {
    return true;
  }
  try {
    await db.delete(users).where(eq(users.uid, uid));
    return true;
  } catch (error) {
    console.warn('Database query bypassed in deleteUserData:', error);
    return false;
  }
}


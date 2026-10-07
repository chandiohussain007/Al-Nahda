import { UserRole } from '@prisma/client';

/** Minimal requester shape needed for privacy decisions. */
export interface PrivacyRequester {
  sub: string;
  role: UserRole;
}

type TeacherLike = { userId?: string; phoneNumber?: string | null };

/**
 * Strips `phoneNumber` from a teacher profile unless the requester is an ADMIN
 * or the profile owner itself. Owners keep their own number so the profile-edit
 * form can prefill it; students and every other role never receive it.
 */
export function stripTeacherPrivacy<T extends TeacherLike>(
  profile: T,
  requester: PrivacyRequester,
): Omit<T, 'phoneNumber'> {
  // Tolerate a missing relation: nothing to leak, nothing to strip.
  if (
    !profile ||
    requester.role === UserRole.ADMIN ||
    profile.userId === requester.sub
  ) {
    return profile;
  }

  const copy = { ...profile } as T & { phoneNumber?: string | null };
  delete copy.phoneNumber;
  return copy;
}

/** Array variant — maps {@link stripTeacherPrivacy} over a list. */
export function stripTeacherPrivacyList<T extends TeacherLike>(
  profiles: T[],
  requester: PrivacyRequester,
): Omit<T, 'phoneNumber'>[] {
  return profiles.map((profile) => stripTeacherPrivacy(profile, requester));
}
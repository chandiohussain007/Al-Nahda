import { UserRole } from '@prisma/client';
import { stripTeacherPrivacy, stripTeacherPrivacyList } from './privacy.js';

const profile = {
  id: 'tp-1',
  userId: 'teacher-user',
  fullName: 'Sheikh Yusuf',
  phoneNumber: '+92 300 1234567',
};

describe('stripTeacherPrivacy', () => {
  it('strips the phone number from a student-facing profile', () => {
    const out = stripTeacherPrivacy(profile, { sub: 'student-1', role: UserRole.STUDENT });

    expect(out).not.toHaveProperty('phoneNumber');
    expect(out).toHaveProperty('fullName', 'Sheikh Yusuf');
  });

  it('keeps the phone number for an admin requester', () => {
    const out = stripTeacherPrivacy(profile, { sub: 'admin-1', role: UserRole.ADMIN });

    expect(out).toHaveProperty('phoneNumber', '+92 300 1234567');
  });

  it('keeps the phone number for the owning teacher', () => {
    const out = stripTeacherPrivacy(profile, { sub: 'teacher-user', role: UserRole.TEACHER });

    expect(out).toHaveProperty('phoneNumber', '+92 300 1234567');
  });

  it('strips the phone number from a different teacher', () => {
    const out = stripTeacherPrivacy(profile, { sub: 'other-teacher', role: UserRole.TEACHER });

    expect(out).not.toHaveProperty('phoneNumber');
  });

  it('does not mutate the source profile', () => {
    stripTeacherPrivacy(profile, { sub: 'student-1', role: UserRole.STUDENT });

    expect(profile.phoneNumber).toBe('+92 300 1234567');
  });

  it('tolerates a missing profile', () => {
    const out = stripTeacherPrivacy(undefined as unknown as typeof profile, {
      sub: 'student-1',
      role: UserRole.STUDENT,
    });

    expect(out).toBeUndefined();
  });
});

describe('stripTeacherPrivacyList', () => {
  it('strips only the profiles the requester may not see', () => {
    const list = [
      { ...profile, id: 'a' },
      { ...profile, id: 'b', userId: 'student-1' },
    ];

    const out = stripTeacherPrivacyList(list, { sub: 'student-1', role: UserRole.STUDENT });

    expect(out).toHaveLength(2);
    expect(out[0]).not.toHaveProperty('phoneNumber');
    expect(out[1]).toHaveProperty('phoneNumber', '+92 300 1234567');
    expect(list[0]).toHaveProperty('phoneNumber', '+92 300 1234567');
  });
});
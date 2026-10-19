import { z } from 'zod';

import { gradeSchema } from './grade-schema';

/** Version of the privacy policy a parent accepts at sign-up (stored with the consent). */
export const PRIVACY_POLICY_VERSION = '2026-10';

export const GENDERS = ['girl', 'boy'] as const;
export const genderSchema = z.enum(GENDERS);
export type Gender = z.infer<typeof genderSchema>;

export const parentSignUpSchema = z.object({
  displayName: z.string().trim().min(1).max(40),
  email: z.email(),
  password: z.string().min(8).max(72),
  acceptsPrivacyPolicy: z.literal(true),
});
export type ParentSignUp = z.infer<typeof parentSignUpSchema>;

export const parentSignInSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});
export type ParentSignIn = z.infer<typeof parentSignInSchema>;

/** A child profile holds no real identity: a first name or nickname is enough. */
export const childProfileSchema = z.object({
  displayName: z.string().trim().min(1).max(30),
  gender: genderSchema,
  grade: gradeSchema,
  birthYear: z.number().int().min(2000).max(2100).nullable(),
});
export type ChildProfile = z.infer<typeof childProfileSchema>;

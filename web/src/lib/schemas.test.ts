import { describe, expect, it } from 'vitest';
import {
  IP_TERMS_MAX_WORDS,
  countWords,
  loginSchema,
  registerGraduateSchema,
  registerCompanySchema,
  projectSchema,
  applySchema,
  declineSchema,
  deliverableSchema,
  evaluationSchema,
} from './schemas';

describe('countWords', () => {
  it('counts whitespace-separated words', () => {
    expect(countWords('one two three')).toBe(3);
    expect(countWords('  padded   words  ')).toBe(2);
  });
  it('returns 0 for empty or whitespace-only text', () => {
    expect(countWords('')).toBe(0);
    expect(countWords('   ')).toBe(0);
  });
});

describe('loginSchema', () => {
  it('accepts a valid credential pair', () => {
    expect(loginSchema.safeParse({ email: 'a@b.com', password: 'x' }).success).toBe(true);
  });
  it('rejects an invalid email', () => {
    expect(loginSchema.safeParse({ email: 'nope', password: 'x' }).success).toBe(false);
  });
  it('rejects an empty password', () => {
    expect(loginSchema.safeParse({ email: 'a@b.com', password: '' }).success).toBe(false);
  });
});

describe('registerGraduateSchema', () => {
  it('accepts the minimum valid payload', () => {
    const r = registerGraduateSchema.safeParse({
      email: 'a@b.com',
      password: 'password1',
      fullName: 'Aline',
    });
    expect(r.success).toBe(true);
  });
  it('rejects a short password', () => {
    const r = registerGraduateSchema.safeParse({
      email: 'a@b.com',
      password: 'short',
      fullName: 'Aline',
    });
    expect(r.success).toBe(false);
  });
  it('requires a name', () => {
    const r = registerGraduateSchema.safeParse({
      email: 'a@b.com',
      password: 'password1',
      fullName: '',
    });
    expect(r.success).toBe(false);
  });
});

describe('registerCompanySchema', () => {
  it('accepts a valid payload', () => {
    expect(
      registerCompanySchema.safeParse({
        email: 'a@b.com',
        password: 'password1',
        companyName: 'Acme Co',
      }).success,
    ).toBe(true);
  });
  it('requires a company name', () => {
    expect(
      registerCompanySchema.safeParse({
        email: 'a@b.com',
        password: 'password1',
        companyName: '',
      }).success,
    ).toBe(false);
  });
});

describe('projectSchema', () => {
  const base = {
    title: 'Build a site',
    brief: 'Do the thing',
    requiredSkills: ['react'],
    applicationDeadline: '2026-01-01T00:00',
    submissionDeadline: '2026-02-01T00:00',
    deliverableFormat: 'LINK' as const,
    ipTerms: 'You own it.',
  };
  it('accepts a valid project', () => {
    expect(projectSchema.safeParse(base).success).toBe(true);
  });
  it('requires at least one skill', () => {
    expect(projectSchema.safeParse({ ...base, requiredSkills: [] }).success).toBe(false);
  });
  it('rejects IP terms over the word cap', () => {
    const tooLong = Array.from({ length: IP_TERMS_MAX_WORDS + 1 }, () => 'w').join(' ');
    expect(projectSchema.safeParse({ ...base, ipTerms: tooLong }).success).toBe(false);
  });
  it('requires the submission deadline to be after the application deadline', () => {
    const r = projectSchema.safeParse({
      ...base,
      applicationDeadline: '2026-02-01T00:00',
      submissionDeadline: '2026-01-01T00:00',
    });
    expect(r.success).toBe(false);
  });
  it('accepts an optional prize amount', () => {
    expect(projectSchema.safeParse({ ...base, prizeAmount: 50000 }).success).toBe(true);
  });
});

describe('applySchema', () => {
  it('requires terms to be accepted', () => {
    expect(applySchema.safeParse({ termsAccepted: true }).success).toBe(true);
    expect(applySchema.safeParse({ termsAccepted: false }).success).toBe(false);
  });
});

describe('declineSchema', () => {
  it('requires a reason', () => {
    expect(declineSchema.safeParse({ reason: 'not a fit' }).success).toBe(true);
    expect(declineSchema.safeParse({ reason: '' }).success).toBe(false);
  });
});

describe('deliverableSchema', () => {
  it('accepts a link with a note', () => {
    expect(
      deliverableSchema.safeParse({ linkUrl: 'https://x.com', note: 'done' }).success,
    ).toBe(true);
  });
  it('accepts a file with a note', () => {
    expect(
      deliverableSchema.safeParse({ fileUrl: 'cloud/id', note: 'done' }).success,
    ).toBe(true);
  });
  it('rejects when neither link nor file is provided', () => {
    expect(deliverableSchema.safeParse({ note: 'done' }).success).toBe(false);
  });
  it('rejects an invalid URL', () => {
    expect(
      deliverableSchema.safeParse({ linkUrl: 'not-a-url', note: 'done' }).success,
    ).toBe(false);
  });
});

describe('evaluationSchema', () => {
  it('accepts a valid evaluation', () => {
    expect(
      evaluationSchema.safeParse({
        score: 4,
        feedback: 'great',
        outcome: 'SELECTED_FOR_INTERVIEW',
      }).success,
    ).toBe(true);
  });
  it('rejects an out-of-range score', () => {
    expect(
      evaluationSchema.safeParse({ score: 6, feedback: 'x', outcome: 'NOT_SELECTED' })
        .success,
    ).toBe(false);
  });
  it('rejects an unknown outcome', () => {
    expect(
      evaluationSchema.safeParse({ score: 3, feedback: 'x', outcome: 'MAYBE' }).success,
    ).toBe(false);
  });
});

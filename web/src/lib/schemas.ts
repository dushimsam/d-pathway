import { z } from 'zod';

// Zod schemas mirror the backend DTOs field for field; the client validates
// before submit and surfaces server field errors after.

export const loginSchema = z.object({
  email: z.email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const registerGraduateSchema = z.object({
  email: z.email('Enter a valid email'),
  password: z.string().min(8, 'At least 8 characters'),
  fullName: z.string().min(1, 'Your name is required').max(255),
  education: z.string().max(255).optional(),
  skills: z.array(z.string()).max(30).optional(),
  location: z.string().max(255).optional(),
});
export type RegisterGraduateInput = z.infer<typeof registerGraduateSchema>;

export const registerCompanySchema = z.object({
  email: z.email('Enter a valid email'),
  password: z.string().min(8, 'At least 8 characters'),
  companyName: z.string().min(1, 'Company name is required').max(255),
  industry: z.string().max(255).optional(),
  title: z.string().max(255).optional(),
});
export type RegisterCompanyInput = z.infer<typeof registerCompanySchema>;

export const deliverableFormatEnum = z.enum(['REPOSITORY_LINK', 'FILE', 'LINK']);

export const projectSchema = z
  .object({
    title: z.string().min(1, 'Title is required').max(255),
    brief: z.string().min(1, 'A brief is required').max(10000),
    requiredSkills: z.array(z.string().min(1)).min(1, 'Add at least one skill'),
    applicationDeadline: z.string().min(1, 'Application deadline is required'),
    submissionDeadline: z.string().min(1, 'Submission deadline is required'),
    deliverableFormat: deliverableFormatEnum,
    ipTerms: z.string().min(1, 'IP terms are required').max(10000),
    prizeAmount: z
      .number()
      .int()
      .min(0)
      .max(100_000_000)
      .optional(),
    prizeCurrency: z.string().max(8).optional(),
  })
  .refine(
    (v) =>
      new Date(v.submissionDeadline).getTime() >
      new Date(v.applicationDeadline).getTime(),
    {
      message: 'Submission deadline must be after the application deadline',
      path: ['submissionDeadline'],
    },
  );
export type ProjectInput = z.infer<typeof projectSchema>;

export const applySchema = z.object({
  termsAccepted: z.literal(true, {
    message: 'You must accept the IP terms to apply',
  }),
  note: z.string().max(2000).optional(),
});
export type ApplyInput = z.infer<typeof applySchema>;

export const declineSchema = z.object({
  reason: z.string().min(1, 'A reason is required').max(2000),
});
export type DeclineInput = z.infer<typeof declineSchema>;

export const deliverableSchema = z
  .object({
    linkUrl: z.url('Enter a valid URL').optional().or(z.literal('')),
    fileUrl: z.string().optional(),
    filePublicId: z.string().optional(),
    note: z.string().min(1, 'A note is required').max(5000),
  })
  .refine((v) => Boolean(v.linkUrl) || Boolean(v.fileUrl), {
    message: 'Provide a link or upload a file',
    path: ['linkUrl'],
  });
export type DeliverableInput = z.infer<typeof deliverableSchema>;

export const evaluationSchema = z.object({
  score: z.number().int().min(1).max(5),
  feedback: z.string().min(1, 'Feedback is required'),
  outcome: z.enum(['SELECTED_FOR_INTERVIEW', 'NOT_SELECTED']),
});
export type EvaluationInput = z.infer<typeof evaluationSchema>;

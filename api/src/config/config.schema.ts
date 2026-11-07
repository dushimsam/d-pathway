import Joi from 'joi';

/** Boot fails fast if any required variable is missing or malformed. */
export const configValidationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'test', 'production')
    .default('development'),
  PORT: Joi.number().port().default(3001),
  CORS_ORIGIN: Joi.string().required(),

  DATABASE_URL: Joi.string().uri({ scheme: ['postgres', 'postgresql'] }).required(),
  REDIS_URL: Joi.string().uri({ scheme: ['redis', 'rediss'] }).required(),

  JWT_SECRET: Joi.string().min(16).required(),
  JWT_EXPIRES_IN: Joi.string().default('24h'),

  CLOUDINARY_CLOUD_NAME: Joi.string().required(),
  CLOUDINARY_API_KEY: Joi.string().required(),
  CLOUDINARY_API_SECRET: Joi.string().required(),
  // Root Cloudinary folder every upload is nested under (e.g. capstone/deliverables).
  CLOUDINARY_UPLOAD_FOLDER: Joi.string().default('capstone'),

  // Stripe (test mode). Optional so the app still boots before it's configured;
  // the wallet top-up endpoint fails clearly if the key is missing.
  STRIPE_SECRET_KEY: Joi.string().allow('').default(''),
  STRIPE_CURRENCY: Joi.string().lowercase().default('rwf'),

  // Resend for transactional email. Optional: when RESEND_API_KEY is empty the
  // mailer logs and no-ops, so the app runs fully without email configured.
  RESEND_API_KEY: Joi.string().allow('').default(''),
  MAIL_FROM: Joi.string().default('onboarding@resend.dev'),
})
  // process.env and docker-compose's POSTGRES_* carry many keys we don't model.
  .unknown(true);

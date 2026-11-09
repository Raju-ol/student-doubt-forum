// Keep the legacy switch compatible, but allow recovery to launch before
// making verification mandatory for every existing student's next post.
export const verificationRequired = () => process.env.EMAIL_ENABLED === '1' || process.env.EMAIL_VERIFICATION_REQUIRED === '1';
export const recoveryEnabled = () => verificationRequired() || process.env.EMAIL_RECOVERY_ENABLED === '1';

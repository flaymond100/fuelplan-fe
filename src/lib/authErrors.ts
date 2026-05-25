export function friendlyError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes('invalid login credentials') || m.includes('invalid credentials')) {
    return 'That email and password don\'t match. Double-check and try again.';
  }
  if (m.includes('email not confirmed')) {
    return 'Please confirm your email first. Check your inbox for the link we sent.';
  }
  if (m.includes('already registered') || m.includes('user already')) {
    return 'An account with this email already exists. Try signing in instead.';
  }
  if (m.includes('invalid') && m.includes('email')) {
    return 'That email address doesn\'t look right.';
  }
  if (m.includes('password')) {
    return 'Password must be at least 8 characters.';
  }
  if (m.includes('rate limit') || m.includes('too many')) {
    return 'Too many attempts. Please wait a moment and try again.';
  }
  return message || 'Something went wrong. Please try again.';
}

export function getAllowedEmails(): string[] {
  return (import.meta.env.VITE_ALLOWED_EMAILS || '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export function isEmailAllowed(email: string | undefined): boolean {
  if (!email) {
    return false;
  }

  const allowedEmails = getAllowedEmails();
  if (allowedEmails.length === 0) {
    return true;
  }

  return allowedEmails.includes(email.toLowerCase());
}

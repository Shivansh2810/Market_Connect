const DEFAULT_ADMIN_EMAILS = ['admin@marketconnect.com'];

const envEmails = import.meta.env?.VITE_ADMIN_EMAILS;

const adminEmailList = (envEmails ? envEmails.split(',') : DEFAULT_ADMIN_EMAILS)
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

export const isAdminEmail = (email = '') => {
  if (!email) return false;
  return adminEmailList.includes(email.trim().toLowerCase());
};

/**
 * Decide which dashboard route to send the user to.
 * @param {object|null} user - Authenticated user object.
 * @param {'buyer'|'seller'|''} preferredRole - Role picked during login (optional).
 * @returns {string} Route path.
 */
export const getDashboardPath = (user, preferredRole) => {
  const normalizedEmail = user?.email?.trim().toLowerCase();
  const role = user?.role;
  const desiredRole = preferredRole || role;

  if (isAdminEmail(normalizedEmail) || role === 'admin') {
    return '/admin';
  }

  if (role === 'seller') {
    return '/seller-dashboard';
  }

  if (role === 'buyer') {
    return '/dashboard';
  }

  if (role === 'both') {
    if (desiredRole === 'seller') {
      return '/seller-dashboard';
    }
    return '/dashboard';
  }

  if (desiredRole === 'seller') {
    return '/seller-dashboard';
  }

  return '/dashboard';
};



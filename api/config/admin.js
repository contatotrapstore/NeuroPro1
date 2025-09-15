// Admin Configuration - Shared between all backend services
const ADMIN_EMAILS = [
  'gouveiarx@gmail.com',
  'psitales@gmail.com',
  'psitales.sales@gmail.com'
];

// Check if a user is an admin
const isAdminUser = (email, userMetadata = {}) => {
  if (!email) return false;

  const isAdminEmail = ADMIN_EMAILS.includes(email.toLowerCase());
  const hasAdminRole = userMetadata?.role === 'admin';

  return isAdminEmail || hasAdminRole;
};

module.exports = {
  ADMIN_EMAILS,
  isAdminUser
};
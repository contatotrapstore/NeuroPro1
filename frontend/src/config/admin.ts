// Admin Configuration - Apenas os admins reais do projeto
export const ADMIN_EMAILS = [
  'gouveiarx@gmail.com', 
  'psitales@gmail.com'
] as const;

export const isAdminUser = (email?: string, userMetadata?: any): boolean => {
  if (!email) return false;
  
  const isAdminEmail = ADMIN_EMAILS.includes(email as any);
  const hasAdminRole = userMetadata?.role === 'admin';
  
  return isAdminEmail || hasAdminRole;
};
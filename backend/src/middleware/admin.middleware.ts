import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth.middleware';
import { supabaseAdmin } from '../config/supabase';

// Lista de emails com privilégios administrativos
const ADMIN_EMAILS = [
  'admin@neuroialab.com',
  'gouveiarx@gmail.com',
  'pstales@gmail.com'
];

export const requireAdmin = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Usuário não autenticado'
      });
    }

    // Verificar se o email está na lista de admins (prioridade)
    const isAdminEmail = ADMIN_EMAILS.includes(req.user.email);
    
    if (isAdminEmail) {
      console.log(`✅ Admin access granted for: ${req.user.email} (by email)`);
      next();
      return;
    }

    // Se não é admin por email, verificar metadata usando supabaseAdmin
    try {
      const { data: { user }, error } = await supabaseAdmin.auth.admin.getUserById(req.user.id);
      
      if (error || !user) {
        console.log(`❌ User not found via admin client for: ${req.user.email}`);
        return res.status(403).json({
          success: false,
          error: 'Acesso negado - usuário não encontrado'
        });
      }

      // Verificar se tem role de admin no metadata
      const isAdmin = user.user_metadata?.role === 'admin' || user.app_metadata?.role === 'admin';
      
      if (!isAdmin) {
        return res.status(403).json({
          success: false,
          error: 'Acesso negado - privilégios administrativos necessários'
        });
      }

      console.log(`✅ Admin access granted for: ${req.user.email} (by metadata)`);
      next();
    } catch (adminError) {
      console.error('Error checking admin via metadata:', adminError);
      // Se falhar na verificação de metadata, negar acesso
      return res.status(403).json({
        success: false,
        error: 'Acesso negado - não foi possível verificar privilégios administrativos'
      });
    }

  } catch (error) {
    console.error('Error in admin middleware:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
};

export const isAdmin = async (userId: string): Promise<boolean> => {
  try {
    const { data: { user }, error } = await supabaseAdmin.auth.admin.getUserById(userId);
    
    if (error || !user) {
      return false;
    }

    // Verificar se o email está na lista de admins
    const isAdminEmail = ADMIN_EMAILS.includes(user.email || '');
    
    // Verificar metadata como fallback
    const hasAdminRole = user.user_metadata?.role === 'admin' || user.app_metadata?.role === 'admin';
    
    return isAdminEmail || hasAdminRole;
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
};
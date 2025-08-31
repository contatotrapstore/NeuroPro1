import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth.middleware';
import { supabase } from '../config/supabase';

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

    // Verificar se o usuário é admin através do metadata
    const { data: { user }, error } = await supabase.auth.admin.getUserById(req.user.id);
    
    if (error || !user) {
      return res.status(403).json({
        success: false,
        error: 'Acesso negado - usuário não encontrado'
      });
    }

    // Verificar se tem role de admin
    const isAdmin = user.user_metadata?.role === 'admin' || user.app_metadata?.role === 'admin';
    
    if (!isAdmin) {
      return res.status(403).json({
        success: false,
        error: 'Acesso negado - privilégios administrativos necessários'
      });
    }

    next();
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
    const { data: { user }, error } = await supabase.auth.admin.getUserById(userId);
    
    if (error || !user) {
      return false;
    }

    return user.user_metadata?.role === 'admin' || user.app_metadata?.role === 'admin';
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
};
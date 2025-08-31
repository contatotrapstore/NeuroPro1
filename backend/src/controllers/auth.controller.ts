import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { supabase } from '../config/supabase';
import { sendSuccess, sendError, sendUnauthorized, sendNotFound, sendInternalError, sendValidationError } from '../utils/apiResponse';
import { ApiResponse } from '../types';

export class AuthController {
  // Get current user profile
  static async getProfile(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return sendUnauthorized(res, 'Usuário não autenticado');
      }

      // Get user data from Supabase Auth
      const { data: { user }, error } = await supabase.auth.admin.getUserById(req.user.id);
      
      if (error || !user) {
        return sendNotFound(res, 'Usuário não encontrado');
      }

      const userProfile = {
        id: user.id,
        email: user.email,
        name: user.user_metadata?.name || '',
        created_at: user.created_at,
        updated_at: user.updated_at,
        email_confirmed_at: user.email_confirmed_at
      };

      return sendSuccess(res, userProfile, 'Perfil do usuário recuperado com sucesso');
    } catch (error) {
      return sendInternalError(res, 'Erro interno do servidor', error);
    }
  }

  // Update user profile
  static async updateProfile(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return sendUnauthorized(res, 'Usuário não autenticado');
      }

      const { name } = req.body;

      if (!name || name.trim().length < 2) {
        return sendValidationError(res, 'Nome deve ter pelo menos 2 caracteres');
      }

      // Update user metadata
      const { data: { user }, error } = await supabase.auth.admin.updateUserById(
        req.user.id,
        {
          user_metadata: {
            name: name.trim()
          }
        }
      );

      if (error || !user) {
        return sendError(res, 'Erro ao atualizar perfil', 400);
      }

      const userProfile = {
        id: user.id,
        email: user.email,
        name: user.user_metadata?.name || '',
        created_at: user.created_at,
        updated_at: user.updated_at
      };

      return sendSuccess(res, userProfile, 'Perfil atualizado com sucesso');
    } catch (error) {
      return sendInternalError(res, 'Erro interno do servidor', error);
    }
  }

  // Get user subscriptions and access
  static async getUserAccess(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return sendUnauthorized(res, 'Usuário não autenticado');
      }

      // Get user subscriptions
      const { data: subscriptions, error: subError } = await supabase
        .from('user_subscriptions')
        .select(`
          *,
          assistants(*),
          user_packages(*)
        `)
        .eq('user_id', req.user.id)
        .eq('status', 'active')
        .gte('expires_at', new Date().toISOString());

      if (subError) {
        return sendInternalError(res, 'Erro ao buscar assinaturas', subError);
      }

      // Get user packages
      const { data: packages, error: pkgError } = await supabase
        .from('user_packages')
        .select('*')
        .eq('user_id', req.user.id)
        .eq('status', 'active')
        .gte('expires_at', new Date().toISOString());

      if (pkgError) {
        return sendInternalError(res, 'Erro ao buscar pacotes', pkgError);
      }

      const userAccess = {
        subscriptions: subscriptions || [],
        packages: packages || [],
        total_active_subscriptions: subscriptions?.length || 0,
        total_active_packages: packages?.length || 0
      };

      return sendSuccess(res, userAccess, 'Acesso do usuário recuperado com sucesso');
    } catch (error) {
      return sendInternalError(res, 'Erro interno do servidor', error);
    }
  }
}
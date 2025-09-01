import { Request, Response, NextFunction } from 'express';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!;

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    user_metadata?: any;
  };
  supabaseClient?: any;
}

export const authenticateToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    console.log('=== DEBUG AUTH MIDDLEWARE ===');
    console.log('URL:', req.url);
    console.log('Method:', req.method);
    
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
    
    console.log('Auth header presente:', !!authHeader);
    console.log('Token extraído:', token ? 'Presente' : 'Ausente');

    if (!token) {
      console.log('❌ Token não fornecido');
      return res.status(401).json({
        success: false,
        error: 'Token de acesso não fornecido'
      });
    }

    // CRIAR CLIENTE SUPABASE INDIVIDUAL COM TOKEN NOS HEADERS
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      },
      global: {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    });
    
    console.log('🔧 Cliente Supabase individual criado com token nos headers');
    
    // Verificar se o token é válido fazendo uma query simples
    const { data, error } = await userClient.auth.getUser();
    const user = data?.user;

    if (error || !user) {
      console.error('❌ Token verification failed:', error);
      return res.status(401).json({
        success: false,
        error: 'Token inválido ou expirado'
      });
    }

    console.log('✅ Usuário autenticado:', {
      id: user.id,
      email: user.email
    });

    // Add user info to request object
    req.user = {
      id: user.id,
      email: user.email!,
      user_metadata: user.user_metadata
    };

    // ADICIONAR O CLIENTE INDIVIDUAL À REQUISIÇÃO
    req.supabaseClient = userClient;
    
    console.log('✅ Cliente Supabase individual anexado à requisição');
    console.log('=== FIM DEBUG AUTH ===');
    next();
  } catch (error) {
    console.error('❌ Auth middleware error:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro interno de autenticação'
    });
  }
};

export const optionalAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      // Criar cliente individual para auth opcional também
      const optionalClient = createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      });
      
      const { data: { user } } = await optionalClient.auth.getUser();
      
      if (user) {
        req.user = {
          id: user.id,
          email: user.email!,
          user_metadata: user.user_metadata
        };
        req.supabaseClient = optionalClient;
      }
    }

    next();
  } catch (error) {
    console.error('Optional auth middleware error:', error);
    // Continue without authentication
    next();
  }
};
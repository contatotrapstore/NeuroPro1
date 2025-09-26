import { supabase } from '../services/supabase.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { function_name, params = [] } = req.body;
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ success: false, error: 'Token de autenticação necessário' });
    }

    if (!function_name) {
      return res.status(400).json({ success: false, error: 'Nome da função é obrigatório' });
    }

    // Set auth token
    supabase.auth.setSession({
      access_token: token,
      refresh_token: 'dummy_refresh_token'
    });

    console.log(`🔧 Calling RPC function: ${function_name} with params:`, params);

    let result;

    switch (function_name) {
      case 'get_institution_users':
        result = await supabase.rpc('get_institution_users', { p_institution_slug: params[0] });
        break;

      case 'approve_institution_user':
        result = await supabase.rpc('approve_institution_user', {
          p_institution_slug: params[0],
          p_user_id: params[1]
        });
        break;

      case 'reject_institution_user':
        result = await supabase.rpc('reject_institution_user', {
          p_institution_slug: params[0],
          p_user_id: params[1]
        });
        break;

      case 'get_institution_pending_count':
        result = await supabase.rpc('get_institution_pending_count', { p_institution_slug: params[0] });
        break;

      default:
        return res.status(400).json({ success: false, error: 'Função não encontrada' });
    }

    if (result.error) {
      console.error(`❌ RPC error for ${function_name}:`, result.error);
      return res.status(400).json({
        success: false,
        error: result.error.message || 'Erro na função RPC'
      });
    }

    console.log(`✅ RPC success for ${function_name}:`, result.data);

    // The RPC functions return JSON, so we need to parse it
    const responseData = typeof result.data === 'string'
      ? JSON.parse(result.data)
      : result.data;

    return res.status(200).json(responseData);

  } catch (error) {
    console.error('❌ Institution RPC error:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
}
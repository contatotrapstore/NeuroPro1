const { createClient } = require('@supabase/supabase-js');
const { applyCors } = require('../utils/cors');

/**
 * API de Autenticação Multi-tenant para Instituições
 * Gerencia login, verificação de acesso e contexto institucional
 */
module.exports = async function handler(req, res) {
  console.log('🏛️ Institution Auth API v1.0');

  // Apply CORS
  const corsHandled = applyCors(req, res);
  if (corsHandled) {
    return;
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return res.status(500).json({
        success: false,
        error: 'Configuração do servidor incompleta'
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse URL for institution slug
    const url = new URL(req.url, `http://${req.headers.host}`);
    const pathParts = url.pathname.split('/').filter(part => part);
    const institutionSlug = pathParts[1]; // /institutions/[slug]/auth

    if (!institutionSlug) {
      return res.status(400).json({
        success: false,
        error: 'Slug da instituição não informado'
      });
    }

    if (req.method === 'GET') {
      // Verificar se instituição existe e está ativa
      const { data: institution, error: institutionError } = await supabase
        .from('institutions')
        .select('id, name, slug, logo_url, primary_color, secondary_color, settings, is_active')
        .eq('slug', institutionSlug)
        .eq('is_active', true)
        .single();

      if (institutionError || !institution) {
        return res.status(404).json({
          success: false,
          error: 'Instituição não encontrada ou inativa'
        });
      }

      return res.status(200).json({
        success: true,
        data: {
          institution: {
            id: institution.id,
            name: institution.name,
            slug: institution.slug,
            logo_url: institution.logo_url,
            primary_color: institution.primary_color,
            secondary_color: institution.secondary_color,
            settings: institution.settings
          }
        }
      });
    }

    if (req.method === 'POST') {
      const { action, token, email, password } = req.body;

      if (!action) {
        return res.status(400).json({
          success: false,
          error: 'Ação não especificada'
        });
      }

      // Verificar se instituição existe
      const { data: institution, error: institutionError } = await supabase
        .from('institutions')
        .select('id, name, slug, is_active, settings')
        .eq('slug', institutionSlug)
        .eq('is_active', true)
        .single();

      if (institutionError || !institution) {
        return res.status(404).json({
          success: false,
          error: 'Instituição não encontrada'
        });
      }

      if (action === 'verify_access') {
        // Verificar se usuário tem acesso à instituição
        if (!token) {
          return res.status(400).json({
            success: false,
            error: 'Token de acesso necessário'
          });
        }

        try {
          // Decode JWT to get user ID
          const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
          const userId = payload.sub;

          if (!userId) {
            return res.status(401).json({
              success: false,
              error: 'Token inválido'
            });
          }

          // Verificar se usuário pertence à instituição
          const { data: institutionUser, error: userError } = await supabase
            .from('institution_users')
            .select(`
              *,
              institutions!inner(id, name, slug, logo_url, primary_color, settings)
            `)
            .eq('user_id', userId)
            .eq('institution_id', institution.id)
            .eq('is_active', true)
            .single();

          if (userError || !institutionUser) {
            return res.status(403).json({
              success: false,
              error: 'Usuário não tem acesso a esta instituição'
            });
          }

          // Verificar se é admin
          const { data: adminData } = await supabase
            .from('institution_admins')
            .select('permissions, is_active')
            .eq('user_id', userId)
            .eq('institution_id', institution.id)
            .eq('is_active', true)
            .single();

          // Obter assistentes disponíveis
          const { data: availableAssistants } = await supabase
            .from('institution_assistants')
            .select(`
              assistant_id,
              custom_name,
              custom_description,
              is_simulator,
              is_primary,
              display_order,
              assistants!inner(name, description, icon, color_theme, openai_assistant_id)
            `)
            .eq('institution_id', institution.id)
            .eq('is_active', true)
            .order('display_order', { ascending: true });

          return res.status(200).json({
            success: true,
            data: {
              user_access: {
                role: institutionUser.role,
                is_admin: !!adminData,
                permissions: adminData?.permissions || {},
                joined_at: institutionUser.joined_at
              },
              institution: institutionUser.institutions,
              available_assistants: availableAssistants?.map(ia => ({
                id: ia.assistant_id,
                name: ia.custom_name || ia.assistants.name,
                description: ia.custom_description || ia.assistants.description,
                icon: ia.assistants.icon,
                color_theme: ia.assistants.color_theme,
                openai_assistant_id: ia.assistants.openai_assistant_id,
                is_simulator: ia.is_simulator,
                is_primary: ia.is_primary,
                display_order: ia.display_order
              })) || []
            }
          });

        } catch (error) {
          console.error('Error verifying access:', error);
          return res.status(401).json({
            success: false,
            error: 'Token inválido'
          });
        }
      }

      if (action === 'login') {
        // Login específico da instituição
        if (!email || !password) {
          return res.status(400).json({
            success: false,
            error: 'Email e senha são obrigatórios'
          });
        }

        try {
          // Primeiro, fazer login normal
          const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email,
            password
          });

          if (authError) {
            return res.status(401).json({
              success: false,
              error: 'Credenciais inválidas'
            });
          }

          const userId = authData.user.id;

          // Verificar se usuário tem acesso à instituição
          const { data: institutionUser, error: accessError } = await supabase
            .from('institution_users')
            .select('role, is_active, joined_at')
            .eq('user_id', userId)
            .eq('institution_id', institution.id)
            .eq('is_active', true)
            .single();

          if (accessError || !institutionUser) {
            // Fazer logout se não tem acesso
            await supabase.auth.signOut();

            return res.status(403).json({
              success: false,
              error: 'Usuário não tem acesso a esta instituição'
            });
          }

          // Verificar limites de licença
          const licenseCheck = await supabase.rpc('institution_has_active_license', {
            institution_slug: institutionSlug
          });

          if (!licenseCheck.data) {
            return res.status(402).json({
              success: false,
              error: 'Instituição sem licença ativa'
            });
          }

          return res.status(200).json({
            success: true,
            data: {
              user: authData.user,
              session: authData.session,
              institution_context: {
                role: institutionUser.role,
                institution_id: institution.id,
                institution_slug: institution.slug,
                joined_at: institutionUser.joined_at
              }
            }
          });

        } catch (error) {
          console.error('Institution login error:', error);
          return res.status(500).json({
            success: false,
            error: 'Erro interno no login'
          });
        }
      }

      return res.status(400).json({
        success: false,
        error: 'Ação não reconhecida'
      });
    }

    return res.status(405).json({
      success: false,
      error: 'Método não permitido'
    });

  } catch (error) {
    console.error('Institution Auth API Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
};
/**
 * API de Gestão de Assinaturas de Usuários das Instituições
 * Endpoint: /api/admin-institution-user-subscriptions
 */
module.exports = async function handler(req, res) {
  console.log('📋 Admin Institution User Subscriptions API v1.0');
  console.log('Method:', req.method);
  console.log('Environment:', process.env.VERCEL_ENV || process.env.NODE_ENV || 'unknown');

  // ============================================
  // CORS HEADERS
  // ============================================
  const allowedOrigins = [
    'https://www.neuroialab.com.br',
    'https://neuroialab.com.br',
    'https://neuroai-lab.vercel.app',
    'http://localhost:5173',
    'http://localhost:3000',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:3000'
  ];

  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Max-Age', '86400');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // ============================================
    // ADMIN CONFIGURATION
    // ============================================
    const ADMIN_EMAILS = [
      'gouveiarx@gmail.com',
      'psitales@gmail.com',
      'psitales.sales@gmail.com'
    ];

    const isAdminUser = (email, userMetadata = {}) => {
      if (!email) return false;
      const isAdminEmail = ADMIN_EMAILS.includes(email.toLowerCase());
      const hasAdminRole = userMetadata?.role === 'admin';
      return isAdminEmail || hasAdminRole;
    };

    // ============================================
    // SUPABASE INITIALIZATION
    // ============================================
    const { createClient } = require('@supabase/supabase-js');

    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ||
                              process.env.SUPABASE_SERVICE_KEY ||
                              process.env.VITE_SUPABASE_SERVICE_KEY ||
                              process.env.SUPABASE_KEY ||
                              process.env.VITE_SUPABASE_KEY;

    const supabaseKey = supabaseServiceKey || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error('❌ Missing Supabase configuration');
      return res.status(500).json({
        success: false,
        error: 'Configuração do servidor incompleta'
      });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // ============================================
    // AUTHENTICATION
    // ============================================
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Token de acesso não fornecido'
      });
    }

    // Create user-specific client to validate token
    const userClient = createClient(supabaseUrl, supabaseKey, {
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

    // Get user from token using Supabase auth
    const { data: { user }, error: userError } = await userClient.auth.getUser();

    if (userError || !user) {
      return res.status(401).json({
        success: false,
        error: 'Token inválido ou expirado'
      });
    }

    const userId = user.id;
    const userEmail = user.email;

    // Verificar se é admin master
    if (!isAdminUser(userEmail)) {
      return res.status(403).json({
        success: false,
        error: 'Acesso restrito a administradores master'
      });
    }

    console.log(`👨‍💼 Admin ${userEmail} accessing institution user subscriptions API`);

    // ============================================
    // REQUEST HANDLING
    // ============================================
    const url = new URL(req.url, `http://${req.headers.host}`);
    const institutionId = url.searchParams.get('institution_id');
    const targetUserId = url.searchParams.get('user_id');

    if (!institutionId) {
      return res.status(400).json({
        success: false,
        error: 'ID da instituição é obrigatório'
      });
    }

    if (req.method === 'GET') {
      // Get user subscription status for institution
      try {
        if (!targetUserId) {
          return res.status(400).json({
            success: false,
            error: 'ID do usuário é obrigatório'
          });
        }

        // Get user's current subscription status
        const { data: subscriptionData, error: subscriptionError } = await supabase
          .from('institution_users')
          .select(`
            id,
            user_id,
            role,
            is_active,
            enrolled_at,
            last_access
          `)
          .eq('institution_id', institutionId)
          .eq('user_id', targetUserId)
          .single();

        if (subscriptionError && subscriptionError.code !== 'PGRST116') {
          console.error('Error fetching subscription status:', subscriptionError);
          return res.status(500).json({
            success: false,
            error: 'Erro ao buscar status da assinatura'
          });
        }

        // Get available assistants for the institution
        const { data: availableAssistants, error: assistantsError } = await supabase
          .from('institution_assistants')
          .select(`
            assistant_id,
            custom_name,
            is_enabled,
            is_default,
            assistants!inner(name, icon)
          `)
          .eq('institution_id', institutionId)
          .eq('is_enabled', true)
          .order('display_order', { ascending: true });

        if (assistantsError) {
          console.error('Error fetching available assistants:', assistantsError);
        }

        return res.status(200).json({
          success: true,
          data: {
            subscription: subscriptionData || null,
            available_assistants: availableAssistants || [],
            has_subscription: !!subscriptionData && subscriptionData.is_active
          }
        });

      } catch (error) {
        console.error('Error getting subscription status:', error);
        return res.status(500).json({
          success: false,
          error: 'Erro interno ao buscar assinatura'
        });
      }
    }

    if (req.method === 'POST') {
      // Create or update user subscription
      try {
        const { user_id, action } = req.body; // action: 'activate' | 'deactivate'

        if (!user_id || !action) {
          return res.status(400).json({
            success: false,
            error: 'user_id e action são obrigatórios'
          });
        }

        if (!['activate', 'deactivate'].includes(action)) {
          return res.status(400).json({
            success: false,
            error: 'Ação deve ser "activate" ou "deactivate"'
          });
        }

        // Check if user exists in institution
        const { data: existingUser, error: existingUserError } = await supabase
          .from('institution_users')
          .select('id, is_active')
          .eq('institution_id', institutionId)
          .eq('user_id', user_id)
          .single();

        if (existingUserError && existingUserError.code !== 'PGRST116') {
          console.error('Error checking existing user:', existingUserError);
          return res.status(500).json({
            success: false,
            error: 'Erro ao verificar usuário existente'
          });
        }

        if (action === 'activate') {
          if (existingUser) {
            // Update existing user to active
            const { data, error } = await supabase
              .from('institution_users')
              .update({
                is_active: true,
                updated_at: new Date().toISOString()
              })
              .eq('id', existingUser.id)
              .select();

            if (error) {
              console.error('Error activating subscription:', error);
              return res.status(500).json({
                success: false,
                error: 'Erro ao ativar assinatura'
              });
            }

            return res.status(200).json({
              success: true,
              data: {
                updated: data?.[0],
                message: 'Assinatura ativada com sucesso'
              }
            });
          } else {
            // Create new subscription
            const { data, error } = await supabase
              .from('institution_users')
              .insert({
                user_id: user_id,
                institution_id: institutionId,
                role: 'user',
                is_active: true,
                enrolled_at: new Date().toISOString()
              })
              .select();

            if (error) {
              console.error('Error creating subscription:', error);
              return res.status(500).json({
                success: false,
                error: 'Erro ao criar assinatura'
              });
            }

            return res.status(201).json({
              success: true,
              data: {
                created: data?.[0],
                message: 'Assinatura criada com sucesso'
              }
            });
          }
        } else if (action === 'deactivate') {
          if (!existingUser) {
            return res.status(404).json({
              success: false,
              error: 'Usuário não possui assinatura nesta instituição'
            });
          }

          // Deactivate subscription
          const { data, error } = await supabase
            .from('institution_users')
            .update({
              is_active: false,
              updated_at: new Date().toISOString()
            })
            .eq('id', existingUser.id)
            .select();

          if (error) {
            console.error('Error deactivating subscription:', error);
            return res.status(500).json({
              success: false,
              error: 'Erro ao desativar assinatura'
            });
          }

          return res.status(200).json({
            success: true,
            data: {
              updated: data?.[0],
              message: 'Assinatura desativada com sucesso'
            }
          });
        }

      } catch (error) {
        console.error('Error managing subscription:', error);
        return res.status(500).json({
          success: false,
          error: 'Erro interno ao gerenciar assinatura'
        });
      }
    }

    return res.status(405).json({
      success: false,
      error: 'Método não permitido'
    });

  } catch (error) {
    console.error('Admin Institution User Subscriptions API Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      details: error.message
    });
  }
};
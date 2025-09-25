/**
 * API de Gestão de Usuários de Instituições
 * Endpoint: /api/admin-institution-users
 */
module.exports = async function handler(req, res) {
  console.log('👥 Admin Institution Users API v1.0');
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

    console.log(`👨‍💼 Admin ${userEmail} accessing institution users API`);

    // ============================================
    // REQUEST HANDLING
    // ============================================
    const url = new URL(req.url, `http://${req.headers.host}`);
    const institutionId = url.searchParams.get('institution_id');

    if (!institutionId) {
      return res.status(400).json({
        success: false,
        error: 'ID da instituição é obrigatório'
      });
    }

    if (req.method === 'GET') {
      // List users for institution
      try {
        // Buscar usuários da instituição com dados do auth.users
        const { data: institutionUsers, error: usersError } = await supabase
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
          .order('enrolled_at', { ascending: false });

        if (usersError) {
          console.error('Error fetching institution users:', usersError);
          return res.status(500).json({
            success: false,
            error: 'Erro ao buscar usuários da instituição'
          });
        }

        // Buscar dados dos usuários na tabela auth.users
        // NOTA: Como não temos acesso direto ao auth.users, vamos buscar pela view profiles se existir
        // ou usar dados básicos
        const usersWithDetails = [];
        if (institutionUsers && institutionUsers.length > 0) {
          // Tentar buscar todos os emails em uma única query
          const userIds = institutionUsers.map(u => u.user_id);

          // Tentar buscar da view profiles primeiro (se existir)
          let profiles = [];
          try {
            const { data: profilesData, error: profilesError } = await supabase
              .from('profiles')
              .select('id, email, created_at')
              .in('id', userIds);

            if (!profilesError && profilesData) {
              profiles = profilesData;
            }
          } catch (error) {
            console.log('Profiles view not available, using fallback');
          }

          // Mapear os dados
          for (const institutionUser of institutionUsers) {
            const profile = profiles.find(p => p.id === institutionUser.user_id);

            if (profile) {
              usersWithDetails.push({
                ...institutionUser,
                email: profile.email,
                created_at: profile.created_at
              });
            } else {
              // Fallback: usar ID parcial como identificador
              usersWithDetails.push({
                ...institutionUser,
                email: `user-${institutionUser.user_id.slice(0, 8)}@instituicao.com`
              });
            }
          }
        }

        return res.status(200).json({
          success: true,
          data: {
            users: usersWithDetails,
            count: usersWithDetails.length
          }
        });

      } catch (error) {
        console.error('Error listing institution users:', error);
        return res.status(500).json({
          success: false,
          error: 'Erro interno ao buscar usuários'
        });
      }
    }

    if (req.method === 'PUT') {
      // Update user status
      try {
        const { user_id, is_active } = req.body;

        if (!user_id || typeof is_active !== 'boolean') {
          return res.status(400).json({
            success: false,
            error: 'user_id e is_active são obrigatórios'
          });
        }

        const { data, error } = await supabase
          .from('institution_users')
          .update({
            is_active,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user_id)
          .eq('institution_id', institutionId)
          .select();

        if (error) {
          console.error('Error updating user status:', error);
          return res.status(500).json({
            success: false,
            error: 'Erro ao atualizar status do usuário'
          });
        }

        console.log(`✅ User ${user_id} status updated to ${is_active ? 'active' : 'inactive'}`);

        return res.status(200).json({
          success: true,
          data: {
            updated: data?.[0] || null,
            message: `Usuário ${is_active ? 'ativado' : 'desativado'} com sucesso`
          }
        });

      } catch (error) {
        console.error('Error updating user status:', error);
        return res.status(500).json({
          success: false,
          error: 'Erro interno ao atualizar usuário'
        });
      }
    }

    if (req.method === 'POST') {
      // Add new user to institution
      try {
        const { email, role = 'user' } = req.body;

        if (!email) {
          return res.status(400).json({
            success: false,
            error: 'Email é obrigatório'
          });
        }

        // Buscar usuário por email
        // Como não temos acesso direto ao auth.users, vamos verificar se existe na tabela profiles
        // ou assumir que o email é válido e buscar o ID correspondente
        let foundUser = null;

        try {
          // Tentar buscar em profiles primeiro
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('id')
            .eq('email', email)
            .single();

          if (!profileError && profileData) {
            foundUser = { id: profileData.id, email: email };
          }
        } catch (error) {
          console.log('Unable to find user in profiles, email might not exist');
        }

        if (!foundUser) {
          return res.status(404).json({
            success: false,
            error: 'Usuário não encontrado no sistema'
          });
        }

        // Verificar se já está vinculado à instituição
        const { data: existingLink } = await supabase
          .from('institution_users')
          .select('id')
          .eq('user_id', foundUser.id)
          .eq('institution_id', institutionId)
          .single();

        if (existingLink) {
          return res.status(400).json({
            success: false,
            error: 'Usuário já está vinculado a esta instituição'
          });
        }

        // Adicionar usuário à instituição
        const { data, error } = await supabase
          .from('institution_users')
          .insert({
            user_id: foundUser.id,
            institution_id: institutionId,
            role,
            is_active: true,
            enrolled_at: new Date().toISOString()
          })
          .select();

        if (error) {
          console.error('Error adding user to institution:', error);
          return res.status(500).json({
            success: false,
            error: 'Erro ao adicionar usuário à instituição'
          });
        }

        console.log(`✅ User ${email} added to institution ${institutionId}`);

        return res.status(201).json({
          success: true,
          data: {
            created: data?.[0] || null,
            message: 'Usuário adicionado à instituição com sucesso'
          }
        });

      } catch (error) {
        console.error('Error adding user to institution:', error);
        return res.status(500).json({
          success: false,
          error: 'Erro interno ao adicionar usuário'
        });
      }
    }

    return res.status(405).json({
      success: false,
      error: 'Método não permitido'
    });

  } catch (error) {
    console.error('Admin Institution Users API Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      details: error.message
    });
  }
};
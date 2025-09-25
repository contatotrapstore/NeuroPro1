const { createClient } = require('@supabase/supabase-js');
const { ADMIN_EMAILS, isAdminUser } = require('./config/admin');
const { applyCors } = require('./utils/cors');

/**
 * API de Gestão de Instituições para Admin Master
 * CRUD completo de instituições e estatísticas globais
 */
module.exports = async function handler(req, res) {
  console.log('🏛️ Admin Institutions API v1.0');

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

    // Get user from auth token
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Token de acesso não fornecido'
      });
    }

    // Create user-specific client to validate token
    const userClient = createClient(supabaseUrl, supabaseServiceKey, {
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

    // Parse URL for routing
    const url = new URL(req.url, `http://${req.headers.host}`);
    const pathParts = url.pathname.split('/').filter(part => part);
    const institutionId = pathParts[2]; // /admin/institutions/[id]

    if (req.method === 'GET') {
      if (!institutionId) {
        // Check for action parameter
        const action = url.searchParams.get('action');

        if (action === 'list') {
          // Simple list for dropdowns/selectors
          const { data: institutions, error: institutionsError } = await supabase
            .from('institutions')
            .select('id, name, slug, primary_color, logo_url, is_active, created_at')
            .order('name', { ascending: true });

          if (institutionsError) {
            console.error('Error fetching institutions list:', institutionsError);
            return res.status(500).json({
              success: false,
              error: 'Erro ao buscar lista de instituições'
            });
          }

          return res.status(200).json({
            success: true,
            data: {
              institutions: institutions || []
            }
          });
        }

        // Dashboard action - detailed view with stats
        if (action === 'dashboard') {
          const { time_range = 'month' } = url.searchParams;

          try {
            // Buscar estatísticas reais das instituições
            const { data: institutions, error: instError } = await supabase
              .from('institutions')
              .select('id, name, slug, is_active, created_at');

            if (instError) {
              console.error('Error fetching institutions for dashboard:', instError);
              return res.status(500).json({
                success: false,
                error: 'Erro ao buscar dados do dashboard'
              });
            }

            const totalInstitutions = institutions?.length || 0;
            const activeInstitutions = institutions?.filter(i => i.is_active).length || 0;
            const inactiveInstitutions = totalInstitutions - activeInstitutions;

            // Buscar instituição mais recente
            const newestInstitution = institutions?.length > 0 ?
              institutions.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]?.name :
              null;

            // Buscar total de usuários institucionais
            const { count: totalUsers } = await supabase
              .from('institution_users')
              .select('id', { count: 'exact' })
              .eq('is_active', true);

            return res.status(200).json({
              success: true,
              data: {
                overview: {
                  total_institutions: totalInstitutions,
                  active_institutions: activeInstitutions,
                  inactive_institutions: inactiveInstitutions,
                  total_institutional_users: totalUsers || 0,
                  newest_institution: newestInstitution
                },
                institutions_stats: [],
                top_assistants_by_institution: {},
                monthly_trends: {
                  users_growth: 0,
                  conversations_growth: 0,
                  institutions_growth: 0
                },
                activity_metrics: {
                  conversations_per_period: [],
                  top_institutions_by_usage: []
                }
              }
            });
          } catch (error) {
            console.error('Dashboard error:', error);
            return res.status(500).json({
              success: false,
              error: 'Erro interno ao buscar dados do dashboard'
            });
          }
        }

        // Default listing with pagination and stats
        const { page = 1, limit = 20, search, status_filter } = url.searchParams;
        const offset = (parseInt(page) - 1) * parseInt(limit);

        let query = supabase
          .from('institutions')
          .select('*');

        // Filtros
        if (status_filter === 'active') {
          query = query.eq('is_active', true);
        } else if (status_filter === 'inactive') {
          query = query.eq('is_active', false);
        }

        if (search) {
          query = query.or(`name.ilike.%${search}%,slug.ilike.%${search}%`);
        }

        const { data: institutions, error: institutionsError } = await query
          .order('created_at', { ascending: false })
          .range(offset, offset + parseInt(limit) - 1);

        if (institutionsError) {
          console.error('Error fetching institutions:', institutionsError);
          return res.status(500).json({
            success: false,
            error: 'Erro ao buscar instituições'
          });
        }

        // Buscar estatísticas de cada instituição
        const institutionsWithStats = await Promise.all(
          (institutions || []).map(async (institution) => {
            const [usersCount, conversationsCount] = await Promise.all([
              // Contagem de usuários
              supabase
                .from('institution_users')
                .select('id', { count: 'exact' })
                .eq('institution_id', institution.id)
                .eq('is_active', true),

              // Contagem aproximada de conversas
              supabase
                .from('institution_users')
                .select('user_id')
                .eq('institution_id', institution.id)
                .eq('is_active', true)
                .then(async (result) => {
                  if (!result.data?.length) return { count: 0 };

                  const userIds = result.data.map(u => u.user_id);
                  return supabase
                    .from('conversations')
                    .select('id', { count: 'exact' })
                    .in('user_id', userIds);
                })
            ]);

            return {
              ...institution,
              stats: {
                total_users: usersCount.count || 0,
                total_conversations: conversationsCount.count || 0,
                license_status: 'unlimited', // ABPSI has unlimited access
                license_expires: null
              }
            };
          })
        );

        // Contagem total para paginação
        let countQuery = supabase
          .from('institutions')
          .select('id', { count: 'exact' });

        if (status_filter === 'active') {
          countQuery = countQuery.eq('is_active', true);
        } else if (status_filter === 'inactive') {
          countQuery = countQuery.eq('is_active', false);
        }

        const { count: totalInstitutions } = await countQuery;

        return res.status(200).json({
          success: true,
          data: {
            institutions: institutionsWithStats,
            pagination: {
              page: parseInt(page),
              limit: parseInt(limit),
              total: totalInstitutions || 0,
              pages: Math.ceil((totalInstitutions || 0) / parseInt(limit))
            }
          }
        });
      } else {
        // Obter instituição específica com detalhes
        const { data: institution, error: institutionError } = await supabase
          .from('institutions')
          .select(`
            *,
            institution_subscriptions(
              id, plan_type, payment_status, valid_until, max_users, monthly_fee, settings
            )
          `)
          .eq('id', institutionId)
          .single();

        if (institutionError || !institution) {
          return res.status(404).json({
            success: false,
            error: 'Instituição não encontrada'
          });
        }

        // Buscar estatísticas detalhadas
        const [
          usersStats,
          assistantsStats,
          conversationsStats,
          adminsStats
        ] = await Promise.all([
          // Estatísticas de usuários
          supabase
            .from('institution_users')
            .select('role, is_active')
            .eq('institution_id', institutionId)
            .then(result => {
              const users = result.data || [];
              return {
                total: users.length,
                active: users.filter(u => u.is_active).length,
                by_role: users.reduce((acc, user) => {
                  if (user.is_active) {
                    acc[user.role] = (acc[user.role] || 0) + 1;
                  }
                  return acc;
                }, {})
              };
            }),

          // Estatísticas de assistentes
          supabase
            .from('institution_assistants')
            .select('id', { count: 'exact' })
            .eq('institution_id', institutionId)
            .eq('is_active', true),

          // Estatísticas de conversas
          supabase
            .from('institution_users')
            .select('user_id')
            .eq('institution_id', institutionId)
            .eq('is_active', true)
            .then(async (result) => {
              if (!result.data?.length) return { count: 0 };

              const userIds = result.data.map(u => u.user_id);
              return supabase
                .from('conversations')
                .select('id', { count: 'exact' })
                .in('user_id', userIds);
            }),

          // Estatísticas de admins
          supabase
            .from('institution_admins')
            .select('id', { count: 'exact' })
            .eq('institution_id', institutionId)
            .eq('is_active', true)
        ]);

        return res.status(200).json({
          success: true,
          data: {
            institution,
            stats: {
              users: usersStats,
              assistants: assistantsStats.count || 0,
              conversations: conversationsStats.count || 0,
              admins: adminsStats.count || 0
            }
          }
        });
      }
    }

    if (req.method === 'POST') {
      // Criar nova instituição
      const {
        name,
        slug,
        logo_url,
        primary_color = '#000000',
        secondary_color,
        settings = {},
        max_users,
        license_config
      } = req.body;

      if (!name || !slug) {
        return res.status(400).json({
          success: false,
          error: 'Nome e slug são obrigatórios'
        });
      }

      // Validar slug (apenas letras minúsculas, números e hífens)
      if (!/^[a-z0-9-]+$/.test(slug)) {
        return res.status(400).json({
          success: false,
          error: 'Slug deve conter apenas letras minúsculas, números e hífens'
        });
      }

      // Verificar se slug já existe
      const { data: existingSlug } = await supabase
        .from('institutions')
        .select('id')
        .eq('slug', slug)
        .single();

      if (existingSlug) {
        return res.status(400).json({
          success: false,
          error: 'Slug já está em uso'
        });
      }

      // Criar instituição
      const { data: newInstitution, error: createError } = await supabase
        .from('institutions')
        .insert({
          name,
          slug,
          logo_url,
          primary_color,
          secondary_color,
          settings,
          max_users,
          is_active: true
        })
        .select()
        .single();

      if (createError) {
        console.error('Error creating institution:', createError);
        return res.status(500).json({
          success: false,
          error: 'Erro ao criar instituição'
        });
      }

      // Criar licença inicial se fornecida
      if (license_config) {
        const { data: license, error: licenseError } = await supabase
          .from('institution_subscriptions')
          .insert({
            institution_id: newInstitution.id,
            plan_type: license_config.plan_type || 'trial',
            max_users: license_config.max_users,
            monthly_fee: license_config.monthly_fee || 0,
            valid_from: new Date().toISOString().split('T')[0],
            valid_until: license_config.valid_until,
            payment_status: 'active',
            payment_provider: 'manual',
            payment_reference: `INITIAL_${newInstitution.slug.toUpperCase()}`,
            settings: license_config.settings || {}
          })
          .select()
          .single();

        if (licenseError) {
          console.warn('Warning creating license:', licenseError);
        }
      }

      return res.status(201).json({
        success: true,
        data: {
          message: 'Instituição criada com sucesso',
          institution: newInstitution
        }
      });
    }

    if (req.method === 'PUT') {
      // Atualizar instituição
      if (!institutionId) {
        return res.status(400).json({
          success: false,
          error: 'ID da instituição é obrigatório'
        });
      }

      const {
        name,
        logo_url,
        primary_color,
        secondary_color,
        settings,
        max_users,
        is_active
      } = req.body;

      // Verificar se instituição existe
      const { data: existingInstitution, error: checkError } = await supabase
        .from('institutions')
        .select('id, slug')
        .eq('id', institutionId)
        .single();

      if (checkError || !existingInstitution) {
        return res.status(404).json({
          success: false,
          error: 'Instituição não encontrada'
        });
      }

      // Preparar dados para atualização
      const updateData = { updated_at: new Date().toISOString() };

      if (name !== undefined) updateData.name = name;
      if (logo_url !== undefined) updateData.logo_url = logo_url;
      if (primary_color !== undefined) updateData.primary_color = primary_color;
      if (secondary_color !== undefined) updateData.secondary_color = secondary_color;
      if (settings !== undefined) updateData.settings = settings;
      if (max_users !== undefined) updateData.max_users = max_users;
      if (is_active !== undefined) updateData.is_active = is_active;

      // Atualizar instituição
      const { data: updatedInstitution, error: updateError } = await supabase
        .from('institutions')
        .update(updateData)
        .eq('id', institutionId)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating institution:', updateError);
        return res.status(500).json({
          success: false,
          error: 'Erro ao atualizar instituição'
        });
      }

      return res.status(200).json({
        success: true,
        data: {
          message: 'Instituição atualizada com sucesso',
          institution: updatedInstitution
        }
      });
    }

    if (req.method === 'DELETE') {
      // Desativar instituição (soft delete)
      if (!institutionId) {
        return res.status(400).json({
          success: false,
          error: 'ID da instituição é obrigatório'
        });
      }

      // Verificar se instituição existe
      const { data: existingInstitution, error: checkError } = await supabase
        .from('institutions')
        .select('id, name, slug, is_active')
        .eq('id', institutionId)
        .single();

      if (checkError || !existingInstitution) {
        return res.status(404).json({
          success: false,
          error: 'Instituição não encontrada'
        });
      }

      // Desativar instituição
      const { data: deactivatedInstitution, error: deactivateError } = await supabase
        .from('institutions')
        .update({
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', institutionId)
        .select()
        .single();

      if (deactivateError) {
        console.error('Error deactivating institution:', deactivateError);
        return res.status(500).json({
          success: false,
          error: 'Erro ao desativar instituição'
        });
      }

      return res.status(200).json({
        success: true,
        data: {
          message: 'Instituição desativada com sucesso',
          institution: deactivatedInstitution
        }
      });
    }

    return res.status(405).json({
      success: false,
      error: 'Método não permitido'
    });

  } catch (error) {
    console.error('Admin Institutions API Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
};
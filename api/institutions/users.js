const { createClient } = require('@supabase/supabase-js');
const { applyCors } = require('../utils/cors');

/**
 * API de Gestão de Usuários para Instituições
 * Permite SubAdmins gerenciarem usuários de suas instituições
 */
module.exports = async function handler(req, res) {
  console.log('👥 Institution Users API v1.0');

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

    let adminUserId;
    try {
      const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
      adminUserId = payload.sub;
    } catch (error) {
      return res.status(401).json({
        success: false,
        error: 'Token inválido'
      });
    }

    // Parse URL for institution slug
    const url = new URL(req.url, `http://${req.headers.host}`);
    const pathParts = url.pathname.split('/').filter(part => part);
    const institutionSlug = pathParts[1]; // /institutions/[slug]/users

    if (!institutionSlug) {
      return res.status(400).json({
        success: false,
        error: 'Slug da instituição não informado'
      });
    }

    // Verificar se instituição existe
    const { data: institution, error: institutionError } = await supabase
      .from('institutions')
      .select('id, name, slug, is_active')
      .eq('slug', institutionSlug)
      .eq('is_active', true)
      .single();

    if (institutionError || !institution) {
      return res.status(404).json({
        success: false,
        error: 'Instituição não encontrada'
      });
    }

    // Verificar se usuário é admin da instituição
    const { data: adminAccess, error: adminError } = await supabase
      .from('institution_admins')
      .select('permissions, is_active')
      .eq('user_id', adminUserId)
      .eq('institution_id', institution.id)
      .eq('is_active', true)
      .single();

    if (adminError || !adminAccess) {
      return res.status(403).json({
        success: false,
        error: 'Acesso administrativo necessário'
      });
    }

    if (req.method === 'GET') {
      // Listar usuários da instituição
      const { page = 1, limit = 20, role_filter, search, status_filter } = url.searchParams;
      const offset = (parseInt(page) - 1) * parseInt(limit);

      // Verificar permissão para visualizar usuários
      if (!adminAccess.permissions.manage_users && !adminAccess.permissions.view_users) {
        return res.status(403).json({
          success: false,
          error: 'Sem permissão para visualizar usuários'
        });
      }

      let query = supabase
        .from('institution_users_detailed')
        .select('*')
        .eq('institution_id', institution.id);

      // Filtros
      if (role_filter && role_filter !== 'all') {
        query = query.eq('role', role_filter);
      }

      if (status_filter === 'active') {
        query = query.eq('is_active', true);
      } else if (status_filter === 'inactive') {
        query = query.eq('is_active', false);
      }

      if (search) {
        query = query.or(`user_name.ilike.%${search}%,user_email.ilike.%${search}%`);
      }

      const { data: users, error: usersError } = await query
        .order('joined_at', { ascending: false })
        .range(offset, offset + parseInt(limit) - 1);

      if (usersError) {
        console.error('Error fetching users:', usersError);
        return res.status(500).json({
          success: false,
          error: 'Erro ao buscar usuários'
        });
      }

      // Contagem total
      let countQuery = supabase
        .from('institution_users')
        .select('id', { count: 'exact' })
        .eq('institution_id', institution.id);

      if (role_filter && role_filter !== 'all') {
        countQuery = countQuery.eq('role', role_filter);
      }

      const { count: totalUsers } = await countQuery;

      return res.status(200).json({
        success: true,
        data: {
          users: users?.map(user => ({
            id: user.id,
            user_id: user.user_id,
            email: user.user_email,
            name: user.user_name,
            role: user.role,
            is_active: user.is_active,
            joined_at: user.joined_at,
            last_login: user.last_sign_in_at,
            email_confirmed: !!user.email_confirmed_at
          })) || [],
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: totalUsers || 0,
            pages: Math.ceil((totalUsers || 0) / parseInt(limit))
          }
        }
      });
    }

    if (req.method === 'POST') {
      // Adicionar novo usuário à instituição
      if (!adminAccess.permissions.manage_users) {
        return res.status(403).json({
          success: false,
          error: 'Sem permissão para gerenciar usuários'
        });
      }

      const { email, role = 'student', send_invitation = false } = req.body;

      if (!email) {
        return res.status(400).json({
          success: false,
          error: 'Email é obrigatório'
        });
      }

      if (!['student', 'teacher'].includes(role)) {
        return res.status(400).json({
          success: false,
          error: 'Role deve ser student ou teacher'
        });
      }

      // Verificar limites de licença
      const canAddUsers = await supabase.rpc('institution_can_add_users', {
        institution_slug: institutionSlug,
        additional_users: 1
      });

      if (!canAddUsers.data) {
        return res.status(402).json({
          success: false,
          error: 'Limite de usuários da licença atingido'
        });
      }

      // Verificar se usuário já existe no sistema
      const { data: existingUser } = await supabase
        .from('auth.users')
        .select('id, email')
        .eq('email', email)
        .single();

      let userId = existingUser?.id;

      if (!existingUser) {
        // Se usuário não existe, criar convite ou criar usuário
        if (send_invitation) {
          // Implementar lógica de convite via email
          // Por enquanto, retornamos erro pedindo para o usuário se cadastrar primeiro
          return res.status(400).json({
            success: false,
            error: 'Sistema de convites ainda não implementado. Usuário deve se cadastrar primeiro no sistema.'
          });
        } else {
          return res.status(400).json({
            success: false,
            error: 'Usuário não encontrado no sistema. Ele deve se cadastrar primeiro.'
          });
        }
      }

      // Verificar se usuário já pertence à instituição
      const { data: existingMembership } = await supabase
        .from('institution_users')
        .select('id, is_active')
        .eq('user_id', userId)
        .eq('institution_id', institution.id)
        .single();

      if (existingMembership) {
        if (existingMembership.is_active) {
          return res.status(400).json({
            success: false,
            error: 'Usuário já pertence à instituição'
          });
        } else {
          // Reativar usuário
          const { data: updatedUser, error: updateError } = await supabase
            .from('institution_users')
            .update({
              role,
              is_active: true,
              updated_at: new Date().toISOString()
            })
            .eq('id', existingMembership.id)
            .select()
            .single();

          if (updateError) {
            return res.status(500).json({
              success: false,
              error: 'Erro ao reativar usuário'
            });
          }

          return res.status(200).json({
            success: true,
            data: {
              message: 'Usuário reativado com sucesso',
              user: updatedUser
            }
          });
        }
      }

      // Adicionar usuário à instituição
      const { data: newMembership, error: membershipError } = await supabase
        .from('institution_users')
        .insert({
          institution_id: institution.id,
          user_id: userId,
          role,
          is_active: true,
          joined_at: new Date().toISOString()
        })
        .select()
        .single();

      if (membershipError) {
        console.error('Error creating membership:', membershipError);
        return res.status(500).json({
          success: false,
          error: 'Erro ao adicionar usuário à instituição'
        });
      }

      return res.status(201).json({
        success: true,
        data: {
          message: 'Usuário adicionado com sucesso',
          membership: newMembership
        }
      });
    }

    if (req.method === 'PUT') {
      // Atualizar usuário
      if (!adminAccess.permissions.manage_users) {
        return res.status(403).json({
          success: false,
          error: 'Sem permissão para gerenciar usuários'
        });
      }

      const { user_id, role, is_active } = req.body;

      if (!user_id) {
        return res.status(400).json({
          success: false,
          error: 'ID do usuário é obrigatório'
        });
      }

      // Verificar se usuário pertence à instituição
      const { data: existingUser, error: userError } = await supabase
        .from('institution_users')
        .select('*')
        .eq('user_id', user_id)
        .eq('institution_id', institution.id)
        .single();

      if (userError || !existingUser) {
        return res.status(404).json({
          success: false,
          error: 'Usuário não encontrado na instituição'
        });
      }

      // Não permitir alterar outros admins
      const { data: isTargetAdmin } = await supabase
        .from('institution_admins')
        .select('id')
        .eq('user_id', user_id)
        .eq('institution_id', institution.id)
        .eq('is_active', true)
        .single();

      if (isTargetAdmin) {
        return res.status(403).json({
          success: false,
          error: 'Não é possível alterar outros administradores'
        });
      }

      // Preparar dados para atualização
      const updateData = { updated_at: new Date().toISOString() };

      if (role !== undefined && ['student', 'teacher'].includes(role)) {
        updateData.role = role;
      }

      if (is_active !== undefined) {
        updateData.is_active = is_active;
      }

      // Atualizar usuário
      const { data: updatedUser, error: updateError } = await supabase
        .from('institution_users')
        .update(updateData)
        .eq('id', existingUser.id)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating user:', updateError);
        return res.status(500).json({
          success: false,
          error: 'Erro ao atualizar usuário'
        });
      }

      return res.status(200).json({
        success: true,
        data: {
          message: 'Usuário atualizado com sucesso',
          user: updatedUser
        }
      });
    }

    if (req.method === 'DELETE') {
      // Remover usuário da instituição
      if (!adminAccess.permissions.manage_users) {
        return res.status(403).json({
          success: false,
          error: 'Sem permissão para gerenciar usuários'
        });
      }

      const { user_id } = req.body;

      if (!user_id) {
        return res.status(400).json({
          success: false,
          error: 'ID do usuário é obrigatório'
        });
      }

      // Verificar se usuário existe na instituição
      const { data: existingUser, error: userError } = await supabase
        .from('institution_users')
        .select('*')
        .eq('user_id', user_id)
        .eq('institution_id', institution.id)
        .single();

      if (userError || !existingUser) {
        return res.status(404).json({
          success: false,
          error: 'Usuário não encontrado na instituição'
        });
      }

      // Não permitir remover outros admins
      const { data: isTargetAdmin } = await supabase
        .from('institution_admins')
        .select('id')
        .eq('user_id', user_id)
        .eq('institution_id', institution.id)
        .eq('is_active', true)
        .single();

      if (isTargetAdmin) {
        return res.status(403).json({
          success: false,
          error: 'Não é possível remover outros administradores'
        });
      }

      // Não permitir se remover
      if (user_id === adminUserId) {
        return res.status(403).json({
          success: false,
          error: 'Não é possível remover a si mesmo'
        });
      }

      // Desativar usuário (soft delete)
      const { error: deactivateError } = await supabase
        .from('institution_users')
        .update({
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingUser.id);

      if (deactivateError) {
        console.error('Error deactivating user:', deactivateError);
        return res.status(500).json({
          success: false,
          error: 'Erro ao remover usuário'
        });
      }

      return res.status(200).json({
        success: true,
        data: {
          message: 'Usuário removido da instituição com sucesso'
        }
      });
    }

    return res.status(405).json({
      success: false,
      error: 'Método não permitido'
    });

  } catch (error) {
    console.error('Institution Users API Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
};
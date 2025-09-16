const { createClient } = require('@supabase/supabase-js');
const { ADMIN_EMAILS, isAdminUser } = require('./config/admin');

module.exports = async function handler(req, res) {
  console.log('🚀 Simple Upload function started');
  console.log('Request method:', req.method);
  console.log('Request URL:', req.url);

  // CORS Headers
  const allowedOrigins = [
    'https://neuroai-lab.vercel.app',
    'https://neuro-pro-frontend.vercel.app',
    'https://www.neuroialab.com.br',
    'https://neuroialab.com.br',
    'http://localhost:5173',
    'http://localhost:3000'
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

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    console.log('✅ Simple Upload preflight handled');
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Método não permitido'
    });
  }

  try {
    const { imageBase64, fileName, assistantId } = req.body;

    console.log('📤 Simple upload request:', {
      hasImageBase64: !!imageBase64,
      fileName: fileName,
      assistantId: assistantId,
      imageSize: imageBase64 ? imageBase64.length : 0
    });

    if (!imageBase64 || !fileName || !assistantId) {
      return res.status(400).json({
        success: false,
        error: 'Campos obrigatórios: imageBase64, fileName, assistantId'
      });
    }

    // Initialize Supabase with Service Role Key for admin operations
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    console.log('🔑 Simple Upload Supabase Configuration Check:', {
      hasUrl: !!supabaseUrl,
      hasServiceKey: !!supabaseServiceKey
    });

    if (!supabaseUrl || !supabaseServiceKey) {
      return res.status(500).json({
        success: false,
        error: 'Configuração do servidor incompleta - Service Role Key necessária'
      });
    }

    // Extract and validate user token
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Token de acesso não fornecido'
      });
    }

    // Create Service Role Supabase client for admin operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Set the user session manually for RLS context
    await supabase.auth.setSession({
      access_token: token,
      refresh_token: token // Usando token temporariamente
    });

    // Get user from token and verify admin role
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error('User authentication error:', userError);
      return res.status(401).json({
        success: false,
        error: 'Token inválido'
      });
    }

    // Check admin role with explicit email verification
    const adminEmails = ['gouveiarx@gmail.com', 'psitales@gmail.com', 'admin@neuroialab.com'];
    const isAdmin = adminEmails.includes(user.email) || user.user_metadata?.role === 'admin';

    console.log('🔍 Simple Upload Admin Check:', {
      userEmail: user.email,
      userMetadata: user.user_metadata,
      isAdmin: isAdmin,
      adminEmails: adminEmails
    });

    if (!isAdmin) {
      console.log('❌ Simple Upload access denied for:', user.email);
      return res.status(403).json({
        success: false,
        error: 'Acesso negado. Apenas administradores podem fazer upload de ícones.'
      });
    }

    console.log('✅ Simple Upload access granted for admin:', user.email);

    // Verify if assistant exists first
    const { data: existingAssistant, error: checkError } = await supabase
      .from('assistants')
      .select('id, name')
      .eq('id', assistantId)
      .maybeSingle();

    if (checkError) {
      console.error('Error checking assistant:', checkError);
      return res.status(500).json({
        success: false,
        error: 'Erro ao verificar assistente',
        details: checkError.message
      });
    }

    if (!existingAssistant) {
      console.error('Assistant not found for ID:', assistantId);
      return res.status(404).json({
        success: false,
        error: 'Assistente não encontrado'
      });
    }

    console.log('✅ Assistant found:', existingAssistant.name);

    // Convert base64 to buffer
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');

    // Detect content type from base64 data
    let contentType = 'image/png'; // default
    if (imageBase64.startsWith('data:image/jpeg')) {
      contentType = 'image/jpeg';
    } else if (imageBase64.startsWith('data:image/jpg')) {
      contentType = 'image/jpeg';
    } else if (imageBase64.startsWith('data:image/svg+xml')) {
      contentType = 'image/svg+xml';
    } else if (imageBase64.startsWith('data:image/webp')) {
      contentType = 'image/webp';
    }

    console.log('☁️ Uploading to Supabase Storage:', {
      fileName: fileName,
      bufferSize: buffer.length,
      contentType: contentType,
      bucket: 'assistant-icons'
    });

    // Upload to Supabase Storage using authenticated client
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('assistant-icons')
      .upload(fileName, buffer, {
        contentType: contentType,
        upsert: true
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return res.status(500).json({
        success: false,
        error: 'Erro ao fazer upload do ícone',
        details: uploadError.message
      });
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('assistant-icons')
      .getPublicUrl(fileName);

    const iconUrl = urlData.publicUrl;

    console.log('✅ Upload to storage completed:', {
      fileName: fileName,
      iconUrl: iconUrl
    });

    // Update assistant with new icon URL using authenticated client
    console.log('🔄 Updating assistant with new icon...', {
      assistantId,
      iconUrl,
      userEmail: user.email
    });

    const { data: updateResult, error: updateError } = await supabase
      .from('assistants')
      .update({
        icon_url: iconUrl,
        icon_type: 'image'
        // updated_by temporariamente removido para evitar erro de permissão
      })
      .eq('id', assistantId)
      .select();

    if (updateError) {
      console.error('Database update error:', updateError);
      return res.status(500).json({
        success: false,
        error: 'Erro ao atualizar assistente com novo ícone',
        details: updateError.message
      });
    }

    // Check if update was successful
    if (!updateResult || updateResult.length === 0) {
      console.error('No assistant was updated - possible permission issue');
      return res.status(500).json({
        success: false,
        error: 'Nenhum assistente foi atualizado - possível problema de permissão'
      });
    }

    const updatedAssistant = updateResult[0]; // Get first result

    // Log action in audit trail using authenticated client (non-blocking)
    try {
      await supabase
        .from('admin_audit_log')
        .insert({
          admin_id: user.id,
          action: 'update',
          entity_type: 'assistant',
          entity_id: assistantId,
          new_data: { icon_url: iconUrl, icon_type: 'image' },
          changes: { icon: { old: 'svg', new: 'image' } },
          ip_address: req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || 'unknown',
          user_agent: req.headers['user-agent']
        });
      console.log('✅ Audit log created successfully for user:', user.email);
    } catch (auditError) {
      console.warn('⚠️ Failed to create audit log (non-critical):', auditError.message);
      // Don't fail the upload if audit log fails
    }

    console.log('✅ Assistant updated successfully:', {
      assistantId: assistantId,
      fileName: fileName,
      iconUrl: iconUrl,
      userEmail: user.email
    });

    return res.status(200).json({
      success: true,
      data: {
        iconUrl,
        fileName,
        assistantId: assistantId
      },
      message: 'Ícone do assistente atualizado com sucesso'
    });

  } catch (error) {
    console.error('💥 Simple upload function error:', error);
    console.error('Error stack:', error.stack);

    // Handle specific error types
    let errorMessage = 'Erro interno do servidor';
    let statusCode = 500;

    if (error.message?.includes('Invalid JWT')) {
      errorMessage = 'Token de autenticação inválido';
      statusCode = 401;
    } else if (error.message?.includes('JWT expired')) {
      errorMessage = 'Token de autenticação expirado';
      statusCode = 401;
    } else if (error.message?.includes('Row Level Security')) {
      errorMessage = 'Erro de permissão no banco de dados';
      statusCode = 403;
    } else if (error.message?.includes('not found')) {
      errorMessage = 'Recurso não encontrado';
      statusCode = 404;
    }

    return res.status(statusCode).json({
      success: false,
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? {
        originalError: error.message,
        stack: error.stack
      } : undefined
    });
  }
};
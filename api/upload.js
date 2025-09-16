const { createClient } = require('@supabase/supabase-js');
const formidable = require('formidable');
const { ADMIN_EMAILS, isAdminUser } = require('./config/admin');

// Helper function to send response with CORS headers
const sendResponse = (res, status, data) => {
  // CORS headers are already set at the beginning of the handler
  return res.status(status).json(data);
};

module.exports = async function handler(req, res) {
  console.log('🚀 Upload function started');
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
    console.log('✅ Upload preflight handled');
    return res.status(200).end();
  }

  try {
    // Initialize Supabase
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
    
    console.log('🔑 Upload Supabase Configuration Check:', {
      hasUrl: !!supabaseUrl,
      hasServiceKey: !!supabaseServiceKey,
      serviceKeyValid: supabaseServiceKey && supabaseServiceKey !== 'YOUR_SERVICE_ROLE_KEY_HERE',
      hasAnonKey: !!supabaseAnonKey
    });

    // Detailed environment check for debugging
    console.log('📋 Environment Debug:', {
      hasServiceKey: !!supabaseServiceKey,
      keyLength: supabaseServiceKey ? supabaseServiceKey.length : 0,
      isPlaceholder: supabaseServiceKey === 'YOUR_SERVICE_ROLE_KEY_HERE',
      keyPreview: supabaseServiceKey ? `${supabaseServiceKey.substring(0, 10)}...` : 'undefined'
    });
    
    if (!supabaseUrl || !supabaseAnonKey) {
      return sendResponse(res, 500, {
        success: false,
        error: 'Configuração do servidor incompleta'
      });
    }

    // We'll use user authentication with RLS policies instead of Service Role Key
    console.log('✅ Upload will use user authentication with RLS policies');

    // Extract user token for authentication
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return sendResponse(res, 401, {
        success: false,
        error: 'Token de acesso não fornecido'
      });
    }

    // Create user-specific client for auth
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

    // Get user from token and verify admin role
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    
    if (userError || !user) {
      return sendResponse(res, 401, {
        success: false,
        error: 'Token inválido'
      });
    }

    // Check admin role using centralized configuration
    const isAdmin = isAdminUser(user.email, user.user_metadata);

    console.log('🔍 Upload Admin Check:', {
      userEmail: user.email,
      userMetadata: user.user_metadata,
      isAdmin: isAdmin,
      adminEmails: ADMIN_EMAILS
    });

    if (!isAdmin) {
      console.log('❌ Upload access denied for:', user.email);
      return sendResponse(res, 403, {
        success: false,
        error: 'Acesso negado. Apenas administradores podem fazer upload.',
        debug: {
          userEmail: user.email,
          isAdmin: isAdmin
        }
      });
    }

    console.log('✅ Upload access granted for admin:', user.email);

    // Parse the URL for routing
    const url = new URL(req.url, `http://${req.headers.host}`);
    const pathParts = url.pathname.split('/').filter(part => part);
    
    console.log('Upload path parts:', pathParts);

    // Handle both /api/upload and /upload routes
    const isApiRoute = pathParts[0] === 'api';
    const uploadIndex = isApiRoute ? 1 : 0;
    const iconIndex = isApiRoute ? 2 : 1;
    const idIndex = isApiRoute ? 3 : 2;
    const expectedLength = isApiRoute ? 4 : 3;

    if (req.method === 'POST' && pathParts[uploadIndex] === 'upload') {
      // POST /[api/]upload/assistant-icon/:id - Upload icon for assistant

      if (pathParts[iconIndex] === 'assistant-icon' && pathParts.length === expectedLength) {
        const assistantId = pathParts[idIndex];

        console.log('📤 Starting assistant icon upload:', {
          assistantId: assistantId,
          userEmail: user.email,
          timestamp: new Date().toISOString()
        });

        // Parse the multipart form data
        const form = formidable({
          maxFileSize: 5 * 1024 * 1024, // 5MB max
          allowEmptyFiles: false,
          filter: function ({name, originalFilename, mimetype}) {
            // Only allow images
            return (
              name === "icon" && 
              mimetype && 
              (mimetype.includes("image") || mimetype === "image/svg+xml")
            );
          }
        });

        try {
          const [fields, files] = await form.parse(req);
          const iconFile = Array.isArray(files.icon) ? files.icon[0] : files.icon;

          console.log('📁 File parsing result:', {
            fields: Object.keys(fields),
            files: Object.keys(files),
            iconFile: iconFile ? {
              originalFilename: iconFile.originalFilename,
              mimetype: iconFile.mimetype,
              size: iconFile.size
            } : 'null'
          });

          if (!iconFile) {
            console.log('❌ No icon file provided');
            return sendResponse(res, 400, {
              success: false,
              error: 'Nenhum arquivo de ícone fornecido'
            });
          }

          // Read file buffer
          const fs = require('fs');
          const fileBuffer = fs.readFileSync(iconFile.filepath);
          
          // Generate unique filename
          const fileExtension = iconFile.originalFilename.split('.').pop();
          const fileName = `assistant-${assistantId}-${Date.now()}.${fileExtension}`;

          console.log('☁️ Uploading to Supabase Storage:', {
            fileName: fileName,
            contentType: iconFile.mimetype,
            fileSize: fileBuffer.length,
            bucket: 'assistant-icons'
          });

          // Upload to Supabase Storage using user authentication
          const { data: uploadData, error: uploadError } = await userClient
            .storage
            .from('assistant-icons')
            .upload(fileName, fileBuffer, {
              contentType: iconFile.mimetype,
              upsert: false
            });

          if (uploadError) {
            console.error('Upload error:', uploadError);
            return sendResponse(res, 500, {
              success: false,
              error: 'Erro ao fazer upload do ícone',
              details: uploadError.message
            });
          }

          // Get public URL
          const { data: urlData } = userClient
            .storage
            .from('assistant-icons')
            .getPublicUrl(fileName);

          const iconUrl = urlData.publicUrl;

          // Update assistant with new icon URL using user authentication
          const { data: assistant, error: updateError } = await userClient
            .from('assistants')
            .update({
              icon_url: iconUrl,
              icon_type: 'image',
              updated_by: user.id
            })
            .eq('id', assistantId)
            .select()
            .single();

          if (updateError) {
            console.error('Database update error:', updateError);
            return sendResponse(res, 500, {
              success: false,
              error: 'Erro ao atualizar assistente com novo ícone'
            });
          }

          // Log action in audit trail using user authentication
          await userClient
            .from('admin_audit_log')
            .insert({
              admin_id: user.id,
              action: 'update',
              entity_type: 'assistant',
              entity_id: assistantId,
              new_data: { icon_url: iconUrl, icon_type: 'image' },
              changes: { icon: { old: 'svg', new: 'image' } },
              ip_address: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
              user_agent: req.headers['user-agent']
            });

          // Clean up temporary file
          fs.unlinkSync(iconFile.filepath);

          console.log('✅ Upload completed successfully:', {
            assistantId: assistantId,
            fileName: fileName,
            iconUrl: iconUrl,
            userEmail: user.email
          });

          return sendResponse(res, 200, {
            success: true,
            data: {
              assistant,
              iconUrl,
              fileName
            },
            message: 'Ícone do assistente atualizado com sucesso'
          });

        } catch (parseError) {
          console.error('Form parse error:', parseError);
          return sendResponse(res, 400, {
            success: false,
            error: 'Erro ao processar upload',
            details: parseError.message
          });
        }
      }
      
      else {
        return sendResponse(res, 404, {
          success: false,
          error: 'Endpoint de upload não encontrado'
        });
      }
    }

    else {
      return sendResponse(res, 405, {
        success: false,
        error: 'Método não permitido'
      });
    }

  } catch (error) {
    console.error('💥 Upload function error:', error);
    console.error('Error stack:', error.stack);
    
    return sendResponse(res, 500, {
      success: false,
      error: 'Erro interno do servidor',
      details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};
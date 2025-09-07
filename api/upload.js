const { createClient } = require('@supabase/supabase-js');
const formidable = require('formidable');

module.exports = async function handler(req, res) {
  console.log('🚀 Upload function started');
  console.log('Request method:', req.method);
  console.log('Request URL:', req.url);
  
  // CORS Headers
  const allowedOrigins = [
    'https://neuroai-lab.vercel.app',
    'https://neuro-pro-frontend.vercel.app',
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
    
    if (!supabaseUrl || !supabaseAnonKey) {
      return res.status(500).json({
        success: false,
        error: 'Configuração do servidor incompleta'
      });
    }

    // Check if Service Role Key is properly configured
    if (!supabaseServiceKey || supabaseServiceKey === 'YOUR_SERVICE_ROLE_KEY_HERE') {
      console.error('❌ Upload: Service Role Key not configured properly');
      return res.status(500).json({
        success: false,
        error: 'Service Role Key não configurada. Configure a chave no arquivo .env',
        debug: {
          serviceKeySet: !!supabaseServiceKey,
          isPlaceholder: supabaseServiceKey === 'YOUR_SERVICE_ROLE_KEY_HERE'
        }
      });
    }
    
    // Use service key for admin operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    console.log('✅ Upload Supabase admin client initialized with Service Role Key');

    // Extract user token for authentication
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
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
      return res.status(401).json({
        success: false,
        error: 'Token inválido'
      });
    }

    // Check admin role
    const ADMIN_EMAILS = [
      'admin@neuroialab.com',
      'admin@neuroia.lab', // Email usado no frontend
      'gouveiarx@gmail.com',
      'psitales@gmail.com' // Correção do email
    ];
    
    const hasAdminRole = user.user_metadata?.role === 'admin';
    const isInAdminList = ADMIN_EMAILS.includes(user.email?.toLowerCase());
    const isAdmin = hasAdminRole || isInAdminList;
    
    if (!isAdmin) {
      return res.status(403).json({
        success: false,
        error: 'Acesso negado. Apenas administradores podem fazer upload.'
      });
    }

    // Parse the URL for routing
    const url = new URL(req.url, `http://${req.headers.host}`);
    const pathParts = url.pathname.split('/').filter(part => part);
    
    console.log('Upload path parts:', pathParts);

    if (req.method === 'POST' && pathParts.length >= 2 && pathParts[0] === 'upload') {
      // POST /upload/assistant-icon/:id - Upload icon for assistant
      
      if (pathParts[1] === 'assistant-icon' && pathParts.length === 3) {
        const assistantId = pathParts[2];
        
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
          
          if (!iconFile) {
            return res.status(400).json({
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
          
          // Upload to Supabase Storage
          const { data: uploadData, error: uploadError } = await supabase
            .storage
            .from('assistant-icons')
            .upload(fileName, fileBuffer, {
              contentType: iconFile.mimetype,
              upsert: false
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
          const { data: urlData } = supabase
            .storage
            .from('assistant-icons')
            .getPublicUrl(fileName);

          const iconUrl = urlData.publicUrl;

          // Update assistant with new icon URL
          const { data: assistant, error: updateError } = await supabase
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
            return res.status(500).json({
              success: false,
              error: 'Erro ao atualizar assistente com novo ícone'
            });
          }

          // Log action in audit trail
          await supabase
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

          return res.json({
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
          return res.status(400).json({
            success: false,
            error: 'Erro ao processar upload',
            details: parseError.message
          });
        }
      }
      
      else {
        return res.status(404).json({
          success: false,
          error: 'Endpoint de upload não encontrado'
        });
      }
    }

    else {
      return res.status(405).json({
        success: false,
        error: 'Método não permitido'
      });
    }

  } catch (error) {
    console.error('💥 Upload function error:', error);
    console.error('Error stack:', error.stack);
    
    return res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};
const { createClient } = require('@supabase/supabase-js');
const formidable = require('formidable');
const fs = require('fs');
const OpenAI = require('openai');

// Tipos de arquivo permitidos
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'text/plain',
  'text/markdown',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/csv',
  'application/json'
];

const ALLOWED_EXTENSIONS = ['.pdf', '.txt', '.md', '.doc', '.docx', '.csv', '.json'];

// Tamanho máximo: 20MB (limite da OpenAI)
const MAX_FILE_SIZE = 20 * 1024 * 1024;

// Helper function to send response with CORS headers
const sendResponse = (res, status, data) => {
  return res.status(status).json(data);
};

module.exports = async function handler(req, res) {
  console.log('📁 Chat Upload function started');
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

  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Initialize Supabase
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
    const openaiApiKey = process.env.OPENAI_API_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return sendResponse(res, 500, {
        success: false,
        error: 'Configuração do servidor incompleta'
      });
    }

    // Validate service role key is configured (not placeholder)
    if (!supabaseServiceKey || supabaseServiceKey.includes('YOUR_SERVICE_ROLE_KEY')) {
      console.error('❌ SUPABASE_SERVICE_ROLE_KEY não configurada ou é placeholder!');
      return sendResponse(res, 500, {
        success: false,
        error: 'Configuração do servidor incompleta - service key não configurada'
      });
    }

    // Extract user token for authentication
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return sendResponse(res, 401, {
        success: false,
        error: 'Token de acesso não fornecido'
      });
    }

    // Create user-specific client
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

    // Verify user
    const { data: { user }, error: userError } = await userClient.auth.getUser();

    if (userError || !user) {
      return sendResponse(res, 401, {
        success: false,
        error: 'Token inválido ou expirado'
      });
    }

    const userId = user.id;
    console.log('✅ User authenticated:', userId);

    // Parse URL path
    const url = new URL(req.url, `http://${req.headers.host}`);
    const pathParts = url.pathname.split('/').filter(Boolean);

    // POST /api/chat-upload - Upload a file
    if (req.method === 'POST') {
      console.log('📤 Processing file upload');

      // Parse form data
      const form = formidable({
        maxFileSize: MAX_FILE_SIZE,
        keepExtensions: true
      });

      const [fields, files] = await new Promise((resolve, reject) => {
        form.parse(req, (err, fields, files) => {
          if (err) reject(err);
          else resolve([fields, files]);
        });
      });

      // Get file and conversation_id
      const uploadedFile = files.file?.[0] || files.file;
      const conversationId = fields.conversation_id?.[0] || fields.conversation_id;

      if (!uploadedFile) {
        return sendResponse(res, 400, {
          success: false,
          error: 'Nenhum arquivo enviado'
        });
      }

      console.log('📄 File received:', {
        name: uploadedFile.originalFilename,
        type: uploadedFile.mimetype,
        size: uploadedFile.size
      });

      // Validate file type
      if (!ALLOWED_MIME_TYPES.includes(uploadedFile.mimetype)) {
        return sendResponse(res, 400, {
          success: false,
          error: `Tipo de arquivo não permitido. Tipos aceitos: PDF, TXT, MD, DOC, DOCX, CSV, JSON`
        });
      }

      // Validate file extension
      const fileExt = '.' + uploadedFile.originalFilename.split('.').pop().toLowerCase();
      if (!ALLOWED_EXTENSIONS.includes(fileExt)) {
        return sendResponse(res, 400, {
          success: false,
          error: `Extensão de arquivo não permitida: ${fileExt}`
        });
      }

      // Validate file size
      if (uploadedFile.size > MAX_FILE_SIZE) {
        return sendResponse(res, 400, {
          success: false,
          error: `Arquivo muito grande. Tamanho máximo: 20MB`
        });
      }

      // Read file content
      const fileContent = fs.readFileSync(uploadedFile.filepath);
      const fileName = uploadedFile.originalFilename;
      const timestamp = Date.now();
      const uniqueFileName = `${timestamp}-${fileName}`;

      // 1. Upload to Supabase Storage (backup)
      let supabasePath = null;
      try {
        // Use service role for storage upload
        const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

        const storagePath = `${userId}/${conversationId || 'general'}/${uniqueFileName}`;

        const { data: storageData, error: storageError } = await serviceClient.storage
          .from('chat-files')
          .upload(storagePath, fileContent, {
            contentType: uploadedFile.mimetype,
            upsert: false
          });

        if (storageError) {
          console.error('⚠️ Supabase storage error (non-fatal):', storageError);
        } else {
          supabasePath = storageData.path;
          console.log('✅ File uploaded to Supabase Storage:', supabasePath);
        }
      } catch (storageErr) {
        console.error('⚠️ Supabase storage exception (non-fatal):', storageErr.message);
      }

      // 2. Upload to OpenAI Files API
      let openaiFileId = null;
      if (openaiApiKey && !openaiApiKey.includes('placeholder')) {
        try {
          const openai = new OpenAI({ apiKey: openaiApiKey });

          // Use fs.createReadStream - compatível com Node.js
          const openaiFile = await openai.files.create({
            file: fs.createReadStream(uploadedFile.filepath),
            purpose: 'assistants'
          });

          openaiFileId = openaiFile.id;
          console.log('✅ File uploaded to OpenAI:', openaiFileId);
        } catch (openaiErr) {
          console.error('❌ OpenAI file upload error:', openaiErr.message);
          // Clean up Supabase file if OpenAI fails
          if (supabasePath) {
            const serviceClient = createClient(supabaseUrl, supabaseServiceKey);
            await serviceClient.storage.from('chat-files').remove([supabasePath]);
          }
          return sendResponse(res, 500, {
            success: false,
            error: 'Erro ao processar arquivo com a IA'
          });
        }
      } else {
        console.warn('⚠️ OpenAI API key not configured, skipping OpenAI upload');
      }

      // 3. Save reference in database
      const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

      const { data: fileRecord, error: dbError } = await serviceClient
        .from('chat_files')
        .insert({
          user_id: userId,
          conversation_id: conversationId || null,
          file_name: fileName,
          file_type: uploadedFile.mimetype,
          file_size: uploadedFile.size,
          openai_file_id: openaiFileId,
          supabase_path: supabasePath,
          direction: 'upload',
          status: openaiFileId ? 'ready' : 'pending'
        })
        .select()
        .single();

      if (dbError) {
        console.error('❌ Database error:', dbError);
        return sendResponse(res, 500, {
          success: false,
          error: 'Erro ao salvar referência do arquivo'
        });
      }

      // Clean up temp file
      try {
        fs.unlinkSync(uploadedFile.filepath);
      } catch (cleanupErr) {
        console.warn('⚠️ Could not delete temp file:', cleanupErr.message);
      }

      console.log('✅ File upload complete:', fileRecord.id);

      return sendResponse(res, 200, {
        success: true,
        data: {
          file_id: fileRecord.id,
          file_name: fileName,
          file_type: uploadedFile.mimetype,
          file_size: uploadedFile.size,
          openai_file_id: openaiFileId,
          status: fileRecord.status
        }
      });
    }

    // GET /api/chat-upload/download/:fileId - Download a file generated by assistant
    else if (req.method === 'GET' && pathParts.includes('download')) {
      const fileId = pathParts[pathParts.length - 1];

      if (!fileId || fileId === 'download') {
        return sendResponse(res, 400, {
          success: false,
          error: 'ID do arquivo não fornecido'
        });
      }

      console.log('📥 Processing file download:', fileId);

      // Check if it's an OpenAI file ID
      if (fileId.startsWith('file-')) {
        // Download from OpenAI
        if (!openaiApiKey || openaiApiKey.includes('placeholder')) {
          return sendResponse(res, 500, {
            success: false,
            error: 'OpenAI não configurado'
          });
        }

        try {
          const openai = new OpenAI({ apiKey: openaiApiKey });
          const fileContent = await openai.files.content(fileId);

          // Get file info
          const fileInfo = await openai.files.retrieve(fileId);

          // Set headers for download
          res.setHeader('Content-Type', 'application/octet-stream');
          res.setHeader('Content-Disposition', `attachment; filename="${fileInfo.filename}"`);

          // Stream the content
          const buffer = Buffer.from(await fileContent.arrayBuffer());
          return res.send(buffer);
        } catch (openaiErr) {
          console.error('❌ OpenAI download error:', openaiErr.message);
          return sendResponse(res, 500, {
            success: false,
            error: 'Erro ao baixar arquivo da IA'
          });
        }
      }

      // Otherwise, look up in database
      const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

      const { data: fileRecord, error: dbError } = await serviceClient
        .from('chat_files')
        .select('*')
        .eq('id', fileId)
        .eq('user_id', userId)
        .single();

      if (dbError || !fileRecord) {
        return sendResponse(res, 404, {
          success: false,
          error: 'Arquivo não encontrado'
        });
      }

      // If has OpenAI file ID, download from OpenAI
      if (fileRecord.openai_file_id) {
        try {
          const openai = new OpenAI({ apiKey: openaiApiKey });
          const fileContent = await openai.files.content(fileRecord.openai_file_id);

          res.setHeader('Content-Type', fileRecord.file_type || 'application/octet-stream');
          res.setHeader('Content-Disposition', `attachment; filename="${fileRecord.file_name}"`);

          const buffer = Buffer.from(await fileContent.arrayBuffer());
          return res.send(buffer);
        } catch (openaiErr) {
          console.error('⚠️ OpenAI download failed, trying Supabase:', openaiErr.message);
        }
      }

      // Fallback to Supabase Storage
      if (fileRecord.supabase_path) {
        const { data: fileData, error: storageError } = await serviceClient.storage
          .from('chat-files')
          .download(fileRecord.supabase_path);

        if (storageError) {
          return sendResponse(res, 500, {
            success: false,
            error: 'Erro ao baixar arquivo'
          });
        }

        res.setHeader('Content-Type', fileRecord.file_type || 'application/octet-stream');
        res.setHeader('Content-Disposition', `attachment; filename="${fileRecord.file_name}"`);

        const buffer = Buffer.from(await fileData.arrayBuffer());
        return res.send(buffer);
      }

      return sendResponse(res, 404, {
        success: false,
        error: 'Arquivo não disponível para download'
      });
    }

    else {
      return sendResponse(res, 405, {
        success: false,
        error: 'Método não permitido'
      });
    }

  } catch (error) {
    console.error('💥 Chat upload error:', error);
    return sendResponse(res, 500, {
      success: false,
      error: 'Erro interno do servidor'
    });
  }
};

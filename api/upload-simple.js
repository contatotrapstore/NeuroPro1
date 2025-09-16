const { createClient } = require('@supabase/supabase-js');

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

    // Initialize Supabase
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

    console.log('🔑 Simple Upload Supabase Configuration Check:', {
      hasUrl: !!supabaseUrl,
      hasAnonKey: !!supabaseAnonKey
    });

    if (!supabaseUrl || !supabaseAnonKey) {
      return res.status(500).json({
        success: false,
        error: 'Configuração do servidor incompleta'
      });
    }

    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Convert base64 to buffer
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');

    console.log('☁️ Uploading to Supabase Storage:', {
      fileName: fileName,
      bufferSize: buffer.length,
      bucket: 'assistant-icons'
    });

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('assistant-icons')
      .upload(fileName, buffer, {
        contentType: 'image/png',
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

    const publicUrl = urlData.publicUrl;

    console.log('✅ Upload completed successfully:', {
      fileName: fileName,
      publicUrl: publicUrl
    });

    return res.status(200).json({
      success: true,
      url: publicUrl,
      fileName: fileName,
      message: 'Upload realizado com sucesso'
    });

  } catch (error) {
    console.error('💥 Simple upload function error:', error);
    console.error('Error stack:', error.stack);

    return res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};
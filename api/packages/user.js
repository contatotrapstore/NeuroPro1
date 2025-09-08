import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL || 'https://avgoyfartmzepdgzhroc.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  // Enable CORS
  const allowedOrigins = [
    'https://neuroai-lab.vercel.app',
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
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    // Get user from auth token
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        error: 'Token de autorização não encontrado'
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return res.status(401).json({
        success: false,
        error: 'Token inválido ou expirado'
      });
    }

    if (req.method === 'GET') {
      // Get user packages with included assistants
      const { data: packages, error } = await supabase
        .from('user_packages')
        .select(`
          *,
          user_package_assistants (
            assistants (
              id,
              name,
              description,
              icon,
              specialization
            )
          )
        `)
        .eq('user_id', user.id)
        .eq('status', 'active');

      if (error) {
        console.error('Database error:', error);
        return res.status(500).json({
          success: false,
          error: 'Erro ao buscar pacotes'
        });
      }

      // Transform data to include assistants directly
      const transformedPackages = packages?.map(pkg => ({
        ...pkg,
        assistants: pkg.user_package_assistants?.map(upa => upa.assistants) || []
      })) || [];

      return res.status(200).json({
        success: true,
        data: transformedPackages
      });
    }

    if (req.method === 'POST') {
      // Create new package
      const { assistantIds, plan } = req.body;

      if (!assistantIds || !Array.isArray(assistantIds) || !plan) {
        return res.status(400).json({
          success: false,
          error: 'assistantIds (array) e plan são obrigatórios'
        });
      }

      // Validate package size
      if (![3, 6].includes(assistantIds.length)) {
        return res.status(400).json({
          success: false,
          error: 'Pacotes devem ter exatamente 3 ou 6 assistentes'
        });
      }

      // Calculate expiration date
      const now = new Date();
      const expiresAt = new Date(now);
      if (plan === 'monthly') {
        expiresAt.setMonth(now.getMonth() + 1);
      } else if (plan === 'semester') {
        expiresAt.setMonth(now.getMonth() + 6);
      }

      // Create package
      const { data: newPackage, error: packageError } = await supabase
        .from('user_packages')
        .insert({
          user_id: user.id,
          plan,
          assistant_count: assistantIds.length,
          status: 'active',
          expires_at: expiresAt.toISOString(),
          created_at: now.toISOString()
        })
        .select()
        .single();

      if (packageError) {
        console.error('Package creation error:', packageError);
        return res.status(500).json({
          success: false,
          error: 'Erro ao criar pacote'
        });
      }

      // Add assistants to package
      const packageAssistants = assistantIds.map(assistantId => ({
        package_id: newPackage.id,
        assistant_id: assistantId
      }));

      const { error: assistantsError } = await supabase
        .from('user_package_assistants')
        .insert(packageAssistants);

      if (assistantsError) {
        console.error('Package assistants error:', assistantsError);
        // Try to cleanup the package
        await supabase
          .from('user_packages')
          .delete()
          .eq('id', newPackage.id);

        return res.status(500).json({
          success: false,
          error: 'Erro ao associar assistentes ao pacote'
        });
      }

      return res.status(201).json({
        success: true,
        data: newPackage
      });
    }

    return res.status(405).json({
      success: false,
      error: 'Método não permitido'
    });

  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
}
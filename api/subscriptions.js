import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL || 'https://avgoyfartmzepdgzhroc.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  // Enable CORS
  const allowedOrigins = [
    'https://neuroai-lab.vercel.app',
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
      // Get user subscriptions
      const { data: subscriptions, error } = await supabase
        .from('user_subscriptions')
        .select(`
          *,
          assistants (
            id,
            name,
            description,
            icon,
            specialization
          )
        `)
        .eq('user_id', user.id)
        .eq('status', 'active');

      if (error) {
        console.error('Database error:', error);
        return res.status(500).json({
          success: false,
          error: 'Erro ao buscar assinaturas'
        });
      }

      return res.status(200).json({
        success: true,
        data: subscriptions || []
      });
    }

    if (req.method === 'POST') {
      // Create new subscription
      const { assistantId, plan } = req.body;

      if (!assistantId || !plan) {
        return res.status(400).json({
          success: false,
          error: 'assistantId e plan são obrigatórios'
        });
      }

      // Check if subscription already exists
      const { data: existing } = await supabase
        .from('user_subscriptions')
        .select('id')
        .eq('user_id', user.id)
        .eq('assistant_id', assistantId)
        .eq('status', 'active')
        .single();

      if (existing) {
        return res.status(400).json({
          success: false,
          error: 'Assinatura já existe para este assistente'
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

      const { data: subscription, error } = await supabase
        .from('user_subscriptions')
        .insert({
          user_id: user.id,
          assistant_id: assistantId,
          plan,
          status: 'active',
          expires_at: expiresAt.toISOString(),
          created_at: now.toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('Database error:', error);
        return res.status(500).json({
          success: false,
          error: 'Erro ao criar assinatura'
        });
      }

      return res.status(201).json({
        success: true,
        data: subscription
      });
    }

    if (req.method === 'DELETE') {
      // Parse URL for routing
      const url = new URL(req.url, `http://${req.headers.host}`);
      const pathParts = url.pathname.split('/').filter(part => part);
      
      console.log('DELETE path parts:', pathParts);

      if (pathParts.length === 2) {
        // DELETE /subscriptions/:id - Cancel individual subscription
        const subscriptionId = pathParts[1];

        // Verify subscription belongs to user
        const { data: subscription, error: fetchError } = await supabase
          .from('user_subscriptions')
          .select('*')
          .eq('id', subscriptionId)
          .eq('user_id', user.id)
          .single();

        if (fetchError || !subscription) {
          return res.status(404).json({
            success: false,
            error: 'Assinatura não encontrada'
          });
        }

        // Update subscription status to cancelled
        const { error: updateError } = await supabase
          .from('user_subscriptions')
          .update({
            status: 'cancelled',
            cancelled_at: new Date().toISOString()
          })
          .eq('id', subscriptionId);

        if (updateError) {
          console.error('Database error:', updateError);
          return res.status(500).json({
            success: false,
            error: 'Erro ao cancelar assinatura'
          });
        }

        return res.json({
          success: true,
          message: 'Assinatura cancelada com sucesso'
        });
      }

      else if (pathParts.length === 3 && pathParts[1] === 'packages') {
        // DELETE /subscriptions/packages/:id - Cancel package subscription
        const packageId = pathParts[2];

        // Verify package belongs to user
        const { data: userPackage, error: fetchError } = await supabase
          .from('user_packages')
          .select('*')
          .eq('id', packageId)
          .eq('user_id', user.id)
          .single();

        if (fetchError || !userPackage) {
          return res.status(404).json({
            success: false,
            error: 'Pacote não encontrado'
          });
        }

        // Update package status to cancelled
        const { error: updateError } = await supabase
          .from('user_packages')
          .update({
            status: 'cancelled',
            cancelled_at: new Date().toISOString()
          })
          .eq('id', packageId);

        if (updateError) {
          console.error('Database error:', updateError);
          return res.status(500).json({
            success: false,
            error: 'Erro ao cancelar pacote'
          });
        }

        return res.json({
          success: true,
          message: 'Pacote cancelado com sucesso'
        });
      }

      else {
        return res.status(404).json({
          success: false,
          error: 'Rota não encontrada'
        });
      }
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
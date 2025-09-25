const { ADMIN_EMAILS, isAdminUser } = require('../../config/admin');
const { applyCors } = require('../../utils/cors');

/**
 * API para exportação de relatórios em diferentes formatos
 * Rota: /api/admin/reports/export
 */
module.exports = async function handler(req, res) {
  console.log('📤 Report Export API v1.0');

  // Apply CORS
  const corsHandled = applyCors(req, res);
  if (corsHandled) {
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Método não permitido'
    });
  }

  try {
    // Get user from auth token
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Token de acesso não fornecido'
      });
    }

    let userId, userEmail;
    try {
      const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
      userId = payload.sub;
      userEmail = payload.email;
    } catch (error) {
      return res.status(401).json({
        success: false,
        error: 'Token inválido'
      });
    }

    // Verificar se é admin master
    if (!isAdminUser(userEmail)) {
      return res.status(403).json({
        success: false,
        error: 'Acesso restrito a administradores master'
      });
    }

    const {
      data,
      format = 'json',
      report_type = 'summary',
      period = 'month'
    } = req.body;

    if (!data || !Array.isArray(data)) {
      return res.status(400).json({
        success: false,
        error: 'Dados do relatório são obrigatórios'
      });
    }

    console.log(`📤 Exporting ${data.length} reports as ${format.toUpperCase()}`);

    // Gerar timestamp para o arquivo
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
    const filename = `relatorio-instituicoes-${period}-${timestamp}`;

    switch (format.toLowerCase()) {
      case 'json':
        return exportAsJSON(res, data, filename);

      case 'csv':
        return exportAsCSV(res, data, filename, report_type);

      case 'pdf':
        return exportAsPDF(res, data, filename, report_type, period);

      default:
        return res.status(400).json({
          success: false,
          error: 'Formato não suportado. Use: json, csv ou pdf'
        });
    }

  } catch (error) {
    console.error('Report Export API Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
};

// ============================================
// EXPORT AS JSON
// ============================================
function exportAsJSON(res, data, filename) {
  const jsonData = JSON.stringify({
    exported_at: new Date().toISOString(),
    total_institutions: data.length,
    reports: data
  }, null, 2);

  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}.json"`);
  res.setHeader('Content-Length', Buffer.byteLength(jsonData, 'utf8'));

  return res.status(200).send(jsonData);
}

// ============================================
// EXPORT AS CSV
// ============================================
function exportAsCSV(res, data, filename, reportType) {
  let csvContent = '';

  if (reportType === 'summary') {
    // CSV Header for summary report
    csvContent = 'Instituição,Slug,Usuários Totais,Usuários Ativos,Novos Usuários,Total Conversas,Crescimento %,Assistente Mais Usado,Duração Média Sessão,Retenção %,Total Sessões\n';

    // CSV Data
    data.forEach(report => {
      const row = [
        escapeCSV(report.institution_name),
        escapeCSV(report.institution_slug),
        report.stats.total_users,
        report.stats.active_users,
        report.stats.new_users,
        report.stats.total_conversations,
        report.stats.conversations_growth,
        escapeCSV(report.stats.most_used_assistant),
        report.stats.avg_session_duration,
        report.stats.user_retention,
        report.stats.total_sessions
      ].join(',');

      csvContent += row + '\n';
    });

  } else if (reportType === 'detailed') {
    // CSV Header for detailed report
    csvContent = 'Instituição,Slug,Período,Usuários Totais,Usuários Ativos,Novos Usuários,Total Conversas,Crescimento %,Total Sessões,Duração Média,Retenção %,Muito Ativos,Ativos,Ocasionais,Inativos\n';

    // CSV Data
    data.forEach(report => {
      const row = [
        escapeCSV(report.institution_name),
        escapeCSV(report.institution_slug),
        escapeCSV(report.period),
        report.stats.total_users,
        report.stats.active_users,
        report.stats.new_users,
        report.stats.total_conversations,
        report.stats.conversations_growth,
        report.stats.total_sessions,
        report.stats.avg_session_duration,
        report.stats.user_retention,
        report.stats.user_activity_distribution.very_active,
        report.stats.user_activity_distribution.active,
        report.stats.user_activity_distribution.occasional,
        report.stats.user_activity_distribution.inactive
      ].join(',');

      csvContent += row + '\n';
    });

  } else if (reportType === 'audit') {
    // CSV Header for audit report
    csvContent = 'Instituição,Data/Hora,Tipo Evento,Email Usuário,Ação,Detalhes,IP\n';

    // CSV Data
    data.forEach(report => {
      report.audit_logs.forEach(log => {
        const row = [
          escapeCSV(report.institution_name),
          log.timestamp,
          escapeCSV(log.event_type),
          escapeCSV(log.user_email),
          escapeCSV(log.action),
          escapeCSV(log.details),
          log.ip_address || ''
        ].join(',');

        csvContent += row + '\n';
      });
    });
  }

  // Set UTF-8 BOM for proper encoding in Excel
  const bom = '\uFEFF';
  const csvWithBom = bom + csvContent;

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}.csv"`);
  res.setHeader('Content-Length', Buffer.byteLength(csvWithBom, 'utf8'));

  return res.status(200).send(csvWithBom);
}

// ============================================
// EXPORT AS PDF
// ============================================
function exportAsPDF(res, data, filename, reportType, period) {
  // Simplified PDF generation (in a real implementation, you'd use a library like PDFKit or Puppeteer)
  // For now, we'll create an HTML document that can be printed/saved as PDF

  let htmlContent = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Relatório de Instituições - ${period}</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            line-height: 1.6;
            color: #333;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 2px solid #333;
        }
        .header h1 {
            color: #2563eb;
            margin: 0;
        }
        .header p {
            margin: 5px 0;
            color: #666;
        }
        .summary {
            display: flex;
            justify-content: space-between;
            margin: 20px 0;
            padding: 15px;
            background: #f8f9fa;
            border-radius: 8px;
        }
        .summary-item {
            text-align: center;
        }
        .summary-item h3 {
            margin: 0;
            color: #2563eb;
            font-size: 24px;
        }
        .summary-item p {
            margin: 5px 0 0 0;
            color: #666;
            font-size: 14px;
        }
        .institution {
            margin: 30px 0;
            padding: 20px;
            border: 1px solid #ddd;
            border-radius: 8px;
            page-break-inside: avoid;
        }
        .institution h2 {
            margin: 0 0 15px 0;
            color: #1f2937;
            border-bottom: 1px solid #eee;
            padding-bottom: 10px;
        }
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin: 15px 0;
        }
        .stat-item {
            padding: 10px;
            background: #f8f9fa;
            border-radius: 6px;
            text-align: center;
        }
        .stat-item .value {
            font-size: 20px;
            font-weight: bold;
            color: #2563eb;
        }
        .stat-item .label {
            font-size: 12px;
            color: #666;
            text-transform: uppercase;
        }
        .footer {
            margin-top: 40px;
            text-align: center;
            font-size: 12px;
            color: #666;
            border-top: 1px solid #ddd;
            padding-top: 20px;
        }
        @media print {
            body { margin: 0; }
            .institution { page-break-inside: avoid; }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>Relatório de Instituições</h1>
        <p>Tipo: ${getReportTypeLabel(reportType)} • Período: ${getPeriodLabel(period)}</p>
        <p>Gerado em: ${new Date().toLocaleString('pt-BR')}</p>
    </div>

    <div class="summary">
        <div class="summary-item">
            <h3>${data.length}</h3>
            <p>Instituições</p>
        </div>
        <div class="summary-item">
            <h3>${data.reduce((sum, r) => sum + r.stats.total_users, 0)}</h3>
            <p>Total Usuários</p>
        </div>
        <div class="summary-item">
            <h3>${data.reduce((sum, r) => sum + r.stats.total_conversations, 0)}</h3>
            <p>Total Conversas</p>
        </div>
        <div class="summary-item">
            <h3>${Math.round(data.reduce((sum, r) => sum + r.stats.avg_session_duration, 0) / data.length)}min</h3>
            <p>Duração Média</p>
        </div>
    </div>
`;

  // Add individual institution reports
  data.forEach(report => {
    htmlContent += `
    <div class="institution">
        <h2>${report.institution_name}</h2>
        <p style="color: #666; margin: 0 0 15px 0;">/${report.institution_slug} • ${report.period}</p>

        <div class="stats-grid">
            <div class="stat-item">
                <div class="value">${report.stats.total_users}</div>
                <div class="label">Usuários Totais</div>
            </div>
            <div class="stat-item">
                <div class="value">${report.stats.active_users}</div>
                <div class="label">Usuários Ativos</div>
            </div>
            <div class="stat-item">
                <div class="value">${report.stats.new_users}</div>
                <div class="label">Novos Usuários</div>
            </div>
            <div class="stat-item">
                <div class="value">${report.stats.total_conversations}</div>
                <div class="label">Total Conversas</div>
            </div>
            <div class="stat-item">
                <div class="value">${report.stats.conversations_growth > 0 ? '+' : ''}${report.stats.conversations_growth}%</div>
                <div class="label">Crescimento</div>
            </div>
            <div class="stat-item">
                <div class="value">${report.stats.avg_session_duration}min</div>
                <div class="label">Duração Média</div>
            </div>
            <div class="stat-item">
                <div class="value">${report.stats.user_retention}%</div>
                <div class="label">Retenção</div>
            </div>
            <div class="stat-item">
                <div class="value">${report.stats.total_sessions}</div>
                <div class="label">Total Sessões</div>
            </div>
        </div>

        <p><strong>Assistente Mais Usado:</strong> ${report.stats.most_used_assistant}</p>
    </div>
    `;
  });

  htmlContent += `
    <div class="footer">
        <p>Relatório gerado pelo Sistema NeuroIA Lab • ${new Date().toLocaleString('pt-BR')}</p>
        <p>Este documento contém informações confidenciais e deve ser tratado com segurança apropriada.</p>
    </div>
</body>
</html>
  `;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}.html"`);
  res.setHeader('Content-Length', Buffer.byteLength(htmlContent, 'utf8'));

  return res.status(200).send(htmlContent);
}

// ============================================
// HELPER FUNCTIONS
// ============================================
function escapeCSV(field) {
  if (field === null || field === undefined) return '';

  const stringField = String(field);

  // Se contém vírgula, aspas duplas ou quebra de linha, precisa escapar
  if (stringField.includes(',') || stringField.includes('"') || stringField.includes('\n')) {
    return '"' + stringField.replace(/"/g, '""') + '"';
  }

  return stringField;
}

function getReportTypeLabel(type) {
  const labels = {
    summary: 'Resumo Executivo',
    detailed: 'Relatório Detalhado',
    audit: 'Auditoria e Logs'
  };
  return labels[type] || type;
}

function getPeriodLabel(period) {
  const labels = {
    week: 'Última Semana',
    month: 'Último Mês',
    quarter: 'Último Trimestre',
    year: 'Último Ano'
  };
  return labels[period] || period;
}
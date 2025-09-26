export interface InstitutionStaticData {
  slug: string;
  name: string;
  logo_url: string;
  primary_color: string;
  secondary_color?: string;
  website_url?: string;
  contact_email?: string;
  settings?: {
    welcome_message?: string;
    subtitle?: string;
    theme?: {
      gradient?: string;
    };
    contact?: {
      email?: string;
      phone?: string;
      website?: string;
    };
    branding?: {
      show_neurolab_footer?: boolean;
    };
  };
}

export const INSTITUTION_STATIC_DATA: Record<string, InstitutionStaticData> = {
  abpsi: {
    slug: 'abpsi',
    name: 'ABPSI',
    logo_url: '/assets/institutions/abpsi/logo.png', // Logo local da ABPSI
    primary_color: '#c39c49',
    secondary_color: '#d4af6a',
    website_url: 'https://abpsicanalise.org',
    contact_email: 'contato@abpsicanalise.org',
    settings: {
      welcome_message: 'Entre com suas credenciais ABPSI',
      subtitle: 'Portal de Inteligência Artificial para Psicanálise',
      theme: {
        gradient: 'linear-gradient(135deg, #c39c4915 0%, #c39c4905 100%)'
      },
      contact: {
        email: 'contato@abpsicanalise.org',
        phone: '(11) 3256-2288',
        website: 'https://abpsicanalise.org'
      },
      branding: {
        show_neurolab_footer: true
      }
    }
  }
};

export const getInstitutionStaticData = (slug: string): InstitutionStaticData | null => {
  return INSTITUTION_STATIC_DATA[slug] || null;
};
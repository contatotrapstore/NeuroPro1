export interface InstitutionStaticData {
  slug: string;
  name: string;
  logo_url: string;
  primary_color: string;
  secondary_color?: string;
  website_url?: string;
  contact_email?: string;
}

export const INSTITUTION_STATIC_DATA: Record<string, InstitutionStaticData> = {
  abpsi: {
    slug: 'abpsi',
    name: 'ABPSI',
    logo_url: '/assets/institutions/abpsi/logo.png', // Logo local da ABPSI
    primary_color: '#c39c49',
    secondary_color: '#d4af6a',
    website_url: 'https://abpsicanalise.org',
    contact_email: 'contato@abpsicanalise.org'
  }
};

export const getInstitutionStaticData = (slug: string): InstitutionStaticData | null => {
  return INSTITUTION_STATIC_DATA[slug] || null;
};
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
    logo_url: 'https://abpsi.org.br/wp-content/uploads/2023/04/logo-abpsi-horizontal-colorida-1.png',
    primary_color: '#c39c49',
    secondary_color: '#d4af6a',
    website_url: 'https://abpsi.org.br',
    contact_email: 'contato@abpsi.org.br'
  }
};

export const getInstitutionStaticData = (slug: string): InstitutionStaticData | null => {
  return INSTITUTION_STATIC_DATA[slug] || null;
};
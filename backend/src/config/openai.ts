import OpenAI from 'openai';

if (!process.env.OPENAI_API_KEY) {
  throw new Error('Missing OPENAI_API_KEY environment variable');
}

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  organization: process.env.OPENAI_ORGANIZATION || undefined,
});

// NeuroIA Lab Psychology Assistants IDs
export const ASSISTANTS = {
  PSICOPLANO: 'asst_8kNKRg68rR8zguhYzdlMEvQc',
  NEUROCASE: 'asst_Ohn9w46OmgwLJhxw08jSbM2f',
  GUIA_ETICO: 'asst_hH374jNSOTSqrsbC9Aq5MKo3',
  SESSAOMAP: 'asst_jlRLzTb4OrBKYWLtjscO3vJN',
  CLINREPLAY: 'asst_ZuPRuYG9eqxmb6tIIcBNSSWd',
  COGNITIMAP: 'asst_WdzCxpQ3s04GqyDKfUsmxWRg',
  MINDROUTE: 'asst_Gto0pHqdCHdM7iBtdB9XUvkU',
  THERATRACK: 'asst_9RGTNpAvpwBtNps5krM051km',
  NEUROLAUDO: 'asst_FHXh63UfotWmtzfwdAORvH1s',
  PSICOTEST: 'asst_ZtY1hAFirpsA3vRdCuuOEebf',
  THERAFOCUS: 'asst_bdfbravG0rjZfp40SFue89ge',
  PSICOBASE: 'asst_nqL5L0hIfOMe2wNQn9wambGr',
  MINDHOME: 'asst_62QzPGQdr9KJMqqJIRVI787r',
  CLINPRICE: 'asst_NoCnwSoviZBasOxgbac9USkg'
} as const;
export type TemplateType = 'sex-nda' | 'nda' | 'creative' | 'collab' | 'conversation';

export interface Template {
  id: TemplateType;
  name: string;
  description: string;
  generateScript: (walletA: string, walletB: string, timestamp: string, geoHash: string) => string;
  ageGate: boolean;
}

export const templates: Record<TemplateType, Template> = {
  'sex-nda': {
    id: 'sex-nda',
    name: 'Sex-NDA',
    description: 'For consenting adults to establish privacy boundaries',
    ageGate: true,
    generateScript: (walletA, walletB, timestamp, geoHash) =>
      `I, ${walletA}, and I, ${walletB}, confirm we are consenting adults. We voluntarily agree to private, consensual adult activity. Details of our interaction are confidential and must not be shared without **both** of our explicit consent. Either of us may pause or withdraw consent at any time. Timestamp: ${timestamp}. Location: ${geoHash}.`,
  },
  'nda': {
    id: 'nda',
    name: 'Non-Disclosure Agreement',
    description: 'Standard confidentiality agreement',
    ageGate: false,
    generateScript: (walletA, walletB, timestamp, geoHash) =>
      `We, ${walletA} and ${walletB}, agree information exchanged is confidential and may not be disclosed without both parties' cryptographic consent. Timestamp: ${timestamp}. Location: ${geoHash}.`,
  },
  'creative': {
    id: 'creative',
    name: 'Creative License',
    description: 'Grant permission for creative works',
    ageGate: false,
    generateScript: (walletA, walletB, timestamp, geoHash) =>
      `I, ${walletA}, grant ${walletB} permission to use my creative works for the agreed purpose under the specified terms, revocable by mutual consent. Timestamp: ${timestamp}. Location: ${geoHash}.`,
  },
  'collab': {
    id: 'collab',
    name: 'Collaboration Agreement',
    description: 'Terms for collaborative projects',
    ageGate: false,
    generateScript: (walletA, walletB, timestamp, geoHash) =>
      `We, ${walletA} and ${walletB}, agree to collaborate on the specified project with shared ownership and mutual consent required for any material changes. Timestamp: ${timestamp}. Location: ${geoHash}.`,
  },
  'conversation': {
    id: 'conversation',
    name: 'Private Conversation',
    description: 'General privacy agreement for conversations',
    ageGate: false,
    generateScript: (walletA, walletB, timestamp, geoHash) =>
      `We, ${walletA} and ${walletB}, agree that our conversation is private and confidential. Neither party may record, share, or disclose the contents without explicit dual consent. Timestamp: ${timestamp}. Location: ${geoHash}.`,
  },
};

export function getTemplate(id: TemplateType): Template {
  return templates[id];
}

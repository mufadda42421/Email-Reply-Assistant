export type ToneType = 'Professional' | 'Friendly' | 'Casual' | 'Formal' | 'Persuasive' | 'Apologetic';

export type LengthType = 'Short' | 'Medium' | 'Detailed';

export interface ReplyOption {
  id: string;
  label: string;
  subject: string;
  body: string;
  toneNote: string;
}

export interface UserPreferences {
  defaultTone: ToneType;
  defaultLength: LengthType;
  defaultLanguage: string;
  apiProxyUrl: string;
}

export interface ImprovementResult {
  improvedEmail: string;
  explanation: string;
  keyChanges: string[];
}

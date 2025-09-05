export type Stance = 'For' | 'Against';
export type MessageSender = 'user' | 'ai';
export type Winner = 'user' | 'ai' | 'draw';

export interface GroundingSource {
  uri: string;
  title: string;
}

export interface Message {
  id: string;
  text: string;
  sender: MessageSender;
  sources?: GroundingSource[];
}

export interface DebateSettings {
  topic: string;
  userStance: Stance;
  aiPersona: string;
}

export interface DebateState {
  settings: DebateSettings;
  messages: Message[];
  aiStance: Stance;
  isAiTyping: boolean;
}

export interface DebateRecord extends DebateState {
  id: string;
  timestamp: string;
  winner: Winner;
  judgement: string;
}

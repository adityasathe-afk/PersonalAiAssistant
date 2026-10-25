export type Role = 'user' | 'assistant';

export interface ChatMessageItem {
  id: string;
  role: Role;
  content: string;
  timestamp: number;
  isStreaming?: boolean;
  audioPlaying?: boolean;
}

export type PersonaMode = 'standard' | 'roast' | 'code' | 'tough_love' | 'homie';

export interface SavedRoast {
  id: string;
  userPrompt: string;
  metalAssReply: string;
  timestamp: number;
  category: string;
}

export interface UserProfile {
  name: string;
  goals: string;
  habitsToCallOut: string;
}

export interface AccountabilityGoal {
  id: string;
  title: string;
  targetDate?: string;
  completed: boolean;
  notes?: string;
}

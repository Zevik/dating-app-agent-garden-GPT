import manifest from '@/../adk/tools.manifest.json';

interface ToolTransport {
  type: 'http';
  method: 'POST';
  url: string;
}

interface ToolDefinition {
  name: string;
  input_schema: { $ref: string };
  output_schema: { $ref: string };
  transport: ToolTransport;
}

const tools: Record<string, ToolDefinition> = Object.fromEntries(manifest.tools.map((tool) => [tool.name, tool]));

async function postJson<TInput extends Record<string, unknown>, TOutput>(toolName: string, payload: TInput): Promise<TOutput> {
  const tool = tools[toolName];
  if (!tool) {
    throw new Error(`tool ${toolName} לא קיים במניפסט`);
  }

  const response = await fetch(tool.transport.url, {
    method: tool.transport.method,
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`שגיאה מהסוכן ${toolName}: ${response.status} ${text}`);
  }

  return (await response.json()) as TOutput;
}

export type ReadUserProfileInput = { userId: string };
export interface ReadUserProfileOutput {
  user: {
    userId: string;
    name?: string;
    age: number;
    gender?: 'male' | 'female' | 'other';
    seeking?: 'male' | 'female' | 'other';
    location?: { lat: number; lng: number };
    city?: string;
    bio?: string;
    interests?: string[];
    prefs: { ageMin: number; ageMax: number; maxDistanceKm: number };
    plan?: 'free' | 'premium' | 'vip';
  };
}

export type QueryCandidatesInput = { userId: string; filters?: { gender?: string; ageMin?: number; ageMax?: number; maxDistanceKm?: number; limit?: number } };
export interface Candidate {
  userId: string;
  name?: string;
  age: number;
  city?: string;
  distanceKm?: number;
  interests?: string[];
  photos?: string[];
}
export type QueryCandidatesOutput = { candidates: Candidate[] };

export type ScoreCandidateInput = { sourceUser: string; candidate: Candidate };
export type ScoreCandidateOutput = { score: { value: number; reasons?: string[] } };

export type CreateOrQueueMatchInput = { userA: string; userB: string; score?: number };
export type CreateOrQueueMatchOutput = { matchId: string; state: 'pending' | 'active' | 'closed' };

export type GetActiveMatchInput = { userId: string };
export type GetActiveMatchOutput = { matchId: string | null; state?: string | null };

export type CloseMatchInput = { matchId: string; reason?: string };
export type CloseMatchOutput = { ok: boolean };

export type ModerateTextInput = { text: string; context?: string };
export type ModerateTextOutput = { allowed: boolean; labels?: string[] };

export type StoreMessageInput = { matchId: string; from: string; text: string };
export type StoreMessageOutput = { messageId: string; status?: 'sent' | 'delivered' | 'read' };

export type ExtractSharedInterestsInput = { userA: string; userB: string };
export type ExtractSharedInterestsOutput = { shared: string[] };

export type EmbedTextInput = { text: string };
export type EmbedTextOutput = { vector: number[] };

export type StoreEmbeddingInput = { userId: string; vector: number[] };
export type StoreEmbeddingOutput = { ok: boolean };

export type SendPushInput = { token: string; title: string; body: string; data?: Record<string, string | number | boolean> };
export type SendPushOutput = { ok: boolean };

export const agentTools = {
  readUserProfile: (payload: ReadUserProfileInput) => postJson<ReadUserProfileInput, ReadUserProfileOutput>('readUserProfile', payload),
  queryCandidates: (payload: QueryCandidatesInput) => postJson<QueryCandidatesInput, QueryCandidatesOutput>('queryCandidates', payload),
  scoreCandidate: (payload: ScoreCandidateInput) => postJson<ScoreCandidateInput, ScoreCandidateOutput>('scoreCandidate', payload),
  createOrQueueMatch: (payload: CreateOrQueueMatchInput) =>
    postJson<CreateOrQueueMatchInput, CreateOrQueueMatchOutput>('createOrQueueMatch', payload),
  getActiveMatch: (payload: GetActiveMatchInput) => postJson<GetActiveMatchInput, GetActiveMatchOutput>('getActiveMatch', payload),
  closeMatch: (payload: CloseMatchInput) => postJson<CloseMatchInput, CloseMatchOutput>('closeMatch', payload),
  moderateText: (payload: ModerateTextInput) => postJson<ModerateTextInput, ModerateTextOutput>('moderateText', payload),
  storeMessage: (payload: StoreMessageInput) => postJson<StoreMessageInput, StoreMessageOutput>('storeMessage', payload),
  extractSharedInterests: (payload: ExtractSharedInterestsInput) =>
    postJson<ExtractSharedInterestsInput, ExtractSharedInterestsOutput>('extractSharedInterests', payload),
  embedText: (payload: EmbedTextInput) => postJson<EmbedTextInput, EmbedTextOutput>('embedText', payload),
  storeEmbedding: (payload: StoreEmbeddingInput) => postJson<StoreEmbeddingInput, StoreEmbeddingOutput>('storeEmbedding', payload),
  sendPush: (payload: SendPushInput) => postJson<SendPushInput, SendPushOutput>('sendPush', payload)
};

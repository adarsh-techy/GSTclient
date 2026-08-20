import { apiClient } from '../core/client';

export interface AdvisorMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface AdvisorToolCall {
  tool: string;
  period?: string | null;
}

export interface AdvisorReply {
  reply: string;
  toolsUsed: AdvisorToolCall[];
}

export async function advisorStatus(): Promise<boolean> {
  try {
    const { data } = await apiClient.get<{ enabled: boolean }>('/advisor/status');
    return !!data.enabled;
  } catch {
    return false;
  }
}

export async function advisorChat(
  messages: AdvisorMessage[],
  opts: { period?: string; companyLabel?: string } = {},
): Promise<AdvisorReply> {
  const { data } = await apiClient.post<AdvisorReply>('/advisor/chat', {
    messages,
    period: opts.period,
    companyLabel: opts.companyLabel,
  });
  return { reply: data.reply, toolsUsed: data.toolsUsed ?? [] };
}

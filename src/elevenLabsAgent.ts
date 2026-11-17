import { Conversation } from '@elevenlabs/client';

export class ElevenLabsAgentManager {
  private conversation: any = null;
  private isConnecting: boolean = false;

  public async startAgentConversation(
    agentId: string,
    onStatusChange?: (status: 'connected' | 'connecting' | 'disconnected') => void,
    onMessage?: (message: { source: 'user' | 'ai'; message: string }) => void,
    onModeChange?: (mode: { mode: 'speaking' | 'listening' }) => void
  ) {
    if (this.conversation) {
      await this.endConversation();
    }

    try {
      this.isConnecting = true;
      onStatusChange?.('connecting');

      // Request mic permission
      await navigator.mediaDevices.getUserMedia({ audio: true });

      this.conversation = await Conversation.startSession({
        agentId: agentId || 'cjVigY5qzO86Huf0OWal',
        onConnect: () => {
          this.isConnecting = false;
          onStatusChange?.('connected');
        },
        onDisconnect: () => {
          this.isConnecting = false;
          onStatusChange?.('disconnected');
          this.conversation = null;
        },
        onError: (err) => {
          console.error('ElevenLabs Agent Error:', err);
          this.isConnecting = false;
          onStatusChange?.('disconnected');
        },
        onModeChange: (mode) => {
          onModeChange?.(mode);
        },
        onMessage: (msg) => {
          onMessage?.(msg);
        }
      });

      return this.conversation;
    } catch (err) {
      console.error('Failed to start ElevenLabs agent session:', err);
      this.isConnecting = false;
      onStatusChange?.('disconnected');
      return null;
    }
  }

  public async endConversation() {
    if (this.conversation) {
      try {
        await this.conversation.endSession();
      } catch (e) {
        console.warn('Error closing session:', e);
      }
      this.conversation = null;
    }
  }
}

export const elevenLabsAgent = new ElevenLabsAgentManager();

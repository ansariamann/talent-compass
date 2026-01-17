import { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, 
  Send, 
  Loader2, 
  AlertCircle,
  Bot,
  Minimize2,
  Maximize2,
  MessageSquare,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isLoading?: boolean;
  error?: string;
}

interface CopilotPanelProps {
  context?: {
    candidateId?: string;
    candidateName?: string;
    applicationId?: string;
  };
}

const suggestedQuestions = [
  "Summarize this resume",
  "Why was this candidate flagged?",
  "What are their key strengths?",
  "Compare to similar candidates",
];

export function CopilotPanel({ context }: CopilotPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      const scrollContainer = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages]);

  const handleSubmit = async (query: string) => {
    if (!query.trim() || isLoading) return;

    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: query,
      timestamp: new Date(),
    };

    const assistantId = `msg-${Date.now() + 1}`;
    const loadingMessage: Message = {
      id: assistantId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isLoading: true,
    };

    setMessages(prev => [...prev, userMessage, loadingMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Simulate API call - in real app, this would call copilotApi.query
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Mock response based on query
      const mockResponses: Record<string, string> = {
        'why was this candidate flagged': `Based on the system analysis, this candidate was flagged as a **potential duplicate** because:

1. Email domain matches another candidate (cand_012)
2. Similar work history at "StartupXYZ"
3. Resume parsing detected 78% content similarity

**Recommended action:** Review both profiles to confirm or dismiss the duplicate flag.`,
        'summarize this resume': `**Alex Johnson** is a full-stack developer with 5 years of experience.

**Key Strengths:**
- Strong Python/React expertise
- AWS Solutions Architect certified
- Experience scaling customer-facing platforms

**Recent Role:** Senior Developer at StartupXYZ (2021-present)
- Led development of customer-facing platform
- Built microservices architecture at previous role

**Education:** BS Computer Science, MIT (2019)`,
        'default': `I've analyzed the available information. Here's what I found:

This candidate has a solid background with relevant experience for the current open positions. Their skills align well with client requirements.

*Note: This is AI-generated insight based on available data.*`,
      };

      const lowerQuery = query.toLowerCase();
      let response = mockResponses['default'];
      
      for (const [key, value] of Object.entries(mockResponses)) {
        if (lowerQuery.includes(key)) {
          response = value;
          break;
        }
      }

      setMessages(prev => prev.map(msg => 
        msg.id === assistantId 
          ? { ...msg, content: response, isLoading: false }
          : msg
      ));
    } catch (error) {
      setMessages(prev => prev.map(msg => 
        msg.id === assistantId 
          ? { ...msg, error: 'Failed to get response. Please try again.', isLoading: false }
          : msg
      ));
    } finally {
      setIsLoading(false);
    }
  };

  // Minimized view
  if (isMinimized) {
    return (
      <div className="h-full flex flex-col bg-card border-l border-border">
        <button
          onClick={() => setIsMinimized(false)}
          className="flex flex-col items-center gap-2 p-4 hover:bg-muted/50 transition-colors h-full"
        >
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          <div className="flex flex-col items-center gap-1">
            <Maximize2 className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground [writing-mode:vertical-lr] rotate-180">
              HR Copilot
            </span>
          </div>
          {messages.length > 0 && (
            <Badge variant="secondary" className="mt-2">
              {messages.filter(m => m.role === 'user').length}
            </Badge>
          )}
        </button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-card border-l border-border">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">HR Copilot</h3>
              <p className="text-xs text-muted-foreground">AI-powered insights (read-only)</p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="icon-sm"
            onClick={() => setIsMinimized(true)}
            className="text-muted-foreground hover:text-foreground"
          >
            <Minimize2 className="w-4 h-4" />
          </Button>
        </div>

        {context?.candidateName && (
          <div className="mt-3 px-3 py-2 rounded-lg bg-muted/50 text-sm">
            <span className="text-muted-foreground">Context: </span>
            <span className="font-medium">{context.candidateName}</span>
          </div>
        )}
      </div>

      {/* Disclaimer */}
      <div className="px-4 py-2 bg-muted/30 border-b border-border">
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          <Bot className="w-3 h-3" />
          AI-generated insights are advisory only
        </p>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        {messages.length === 0 ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Ask me anything about this candidate or application.
            </p>
            <div className="space-y-2">
              {suggestedQuestions.map(q => (
                <button
                  key={q}
                  onClick={() => handleSubmit(q)}
                  className="w-full text-left px-3 py-2 rounded-lg text-sm bg-muted/50 hover:bg-muted transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map(msg => (
              <div 
                key={msg.id}
                className={cn(
                  "rounded-lg p-3",
                  msg.role === 'user' 
                    ? "bg-primary/10 ml-8" 
                    : "ai-message"
                )}
              >
                {msg.isLoading ? (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm">Analyzing...</span>
                  </div>
                ) : msg.error ? (
                  <div className="flex items-center gap-2 text-status-error">
                    <AlertCircle className="w-4 h-4" />
                    <span className="text-sm">{msg.error}</span>
                  </div>
                ) : (
                  <div className="text-sm prose prose-sm prose-invert max-w-none">
                    {msg.content.split('\n').map((line, i) => (
                      <p key={i} className={cn(
                        line.startsWith('**') ? 'font-semibold' : '',
                        line.startsWith('-') ? 'ml-4' : '',
                        'mb-1 last:mb-0'
                      )}>
                        {line.replace(/\*\*/g, '')}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Input */}
      <div className="p-4 border-t border-border">
        <form 
          onSubmit={(e) => { e.preventDefault(); handleSubmit(input); }}
          className="flex gap-2"
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about this candidate..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button 
            type="submit" 
            size="icon" 
            disabled={!input.trim() || isLoading}
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}

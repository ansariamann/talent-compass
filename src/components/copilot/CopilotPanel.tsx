import { useState, useRef, useEffect } from 'react';
import { Sparkles, Send, Loader2, AlertCircle, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

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
  "Why was this candidate flagged?",
  "Summarize this resume",
  "What makes this candidate stand out?",
  "Compare to similar candidates",
];

export function CopilotPanel({ context }: CopilotPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scroll to bottom on new messages
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = async (query: string) => {
    if (!query.trim() || isLoading) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: query,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // Add loading message
    const loadingId = crypto.randomUUID();
    setMessages(prev => [...prev, {
      id: loadingId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isLoading: true,
    }]);

    try {
      // Mock API call - replace with actual copilotApi.query()
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Mock response
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
      let response = mockResponses.default;
      
      for (const [key, value] of Object.entries(mockResponses)) {
        if (lowerQuery.includes(key)) {
          response = value;
          break;
        }
      }

      // Replace loading message with actual response
      setMessages(prev => prev.map(msg => 
        msg.id === loadingId 
          ? { ...msg, content: response, isLoading: false }
          : msg
      ));
    } catch (error) {
      // Replace loading message with error
      setMessages(prev => prev.map(msg => 
        msg.id === loadingId 
          ? { ...msg, content: '', isLoading: false, error: 'Failed to get response. Please try again.' }
          : msg
      ));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-card border-l border-border">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold">HR Copilot</h3>
            <p className="text-xs text-muted-foreground">AI-powered insights (read-only)</p>
          </div>
        </div>

        {context?.candidateName && (
          <div className="mt-3 px-3 py-2 rounded-lg bg-muted/50 text-sm">
            <span className="text-muted-foreground">Context: </span>
            <span className="font-medium">{context.candidateName}</span>
          </div>
        )}
      </div>

      {/* Disclaimer */}
      <div className="mx-4 mt-4 p-3 rounded-lg bg-status-info/5 border border-status-info/20 flex gap-2">
        <Info className="w-4 h-4 text-status-info shrink-0 mt-0.5" />
        <p className="text-xs text-muted-foreground">
          Copilot provides AI-generated insights only. It cannot modify data or trigger actions.
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
            variant="ghost"
            className="flex-1"
            disabled={isLoading}
          />
          <Button 
            type="submit" 
            size="icon" 
            disabled={!input.trim() || isLoading}
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}

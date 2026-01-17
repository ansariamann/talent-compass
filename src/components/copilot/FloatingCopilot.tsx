import { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, 
  Send, 
  Loader2, 
  AlertCircle,
  Bot,
  X,
  MessageSquare,
  Minimize2,
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

interface FloatingCopilotProps {
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

export function FloatingCopilot({ context }: FloatingCopilotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      const scrollContainer = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages]);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

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
      await new Promise(resolve => setTimeout(resolve, 1500));

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
    } catch {
      setMessages(prev => prev.map(msg => 
        msg.id === assistantId 
          ? { ...msg, error: 'Failed to get response. Please try again.', isLoading: false }
          : msg
      ));
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setIsOpen(true)}
        className={cn(
          "fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full",
          "bg-gradient-to-br from-primary to-primary/80 shadow-lg shadow-primary/25",
          "flex items-center justify-center transition-all duration-300",
          "hover:scale-110 hover:shadow-xl hover:shadow-primary/30",
          "focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 focus:ring-offset-background",
          isOpen && "scale-0 opacity-0"
        )}
      >
        <Sparkles className="w-6 h-6 text-primary-foreground" />
        {messages.length > 0 && (
          <Badge 
            variant="secondary" 
            className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
          >
            {messages.filter(m => m.role === 'user').length}
          </Badge>
        )}
      </button>

      {/* Chat panel */}
      <div
        className={cn(
          "fixed bottom-6 right-6 z-50 w-96 h-[32rem] rounded-2xl overflow-hidden",
          "bg-card border border-border shadow-2xl",
          "flex flex-col transition-all duration-300 origin-bottom-right",
          isOpen ? "scale-100 opacity-100" : "scale-0 opacity-0 pointer-events-none"
        )}
      >
        {/* Header */}
        <div className="p-4 border-b border-border bg-muted/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">HR Copilot</h3>
                <p className="text-xs text-muted-foreground">AI-powered insights</p>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="icon-sm"
              onClick={handleClose}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {context?.candidateName && (
            <div className="mt-3 px-3 py-2 rounded-lg bg-background/50 text-sm">
              <span className="text-muted-foreground">Context: </span>
              <span className="font-medium">{context.candidateName}</span>
            </div>
          )}
        </div>

        {/* Disclaimer */}
        <div className="px-4 py-2 bg-muted/20 border-b border-border">
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
                Ask me anything about candidates or applications.
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
                      : "bg-muted/50"
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
        <div className="p-4 border-t border-border bg-muted/20">
          <form 
            onSubmit={(e) => { e.preventDefault(); handleSubmit(input); }}
            className="flex gap-2"
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about candidates..."
              disabled={isLoading}
              className="flex-1 bg-background"
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

      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm md:hidden"
          onClick={handleClose}
        />
      )}
    </>
  );
}

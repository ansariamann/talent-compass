import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, Search, Loader2, MapPin, Wallet, AlertCircle } from 'lucide-react';
import { useCandidateByEmail } from '@/hooks/useCandidates';
import type { Candidate } from '@/types/ats';

interface EmailLookupProps {
  onCandidateFound?: (candidate: Candidate) => void;
}

export function EmailLookup({ onCandidateFound }: EmailLookupProps) {
  const [email, setEmail] = useState('');
  const [searchEmail, setSearchEmail] = useState('');

  const { data: candidate, isLoading, error } = useCandidateByEmail(searchEmail);

  const handleSearch = () => {
    if (email && email.includes('@')) {
      setSearchEmail(email);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Mail className="w-5 h-5" />
          Email Lookup
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            type="email"
            placeholder="Enter email address..."
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1"
          />
          <Button onClick={handleSearch} disabled={isLoading || !email.includes('@')}>
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Search className="w-4 h-4" />
            )}
          </Button>
        </div>

        {searchEmail && !isLoading && error && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
            <AlertCircle className="w-4 h-4" />
            No candidate found with this email
          </div>
        )}

        {candidate && (
          <div 
            className="p-4 border rounded-lg hover:bg-accent/50 transition-colors cursor-pointer"
            onClick={() => onCandidateFound?.(candidate)}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="font-medium">{candidate.name}</p>
                <p className="text-sm text-muted-foreground">{candidate.email}</p>
                {candidate.location && (
                  <div className="flex items-center gap-1 mt-1 text-sm text-muted-foreground">
                    <MapPin className="w-3 h-3" />
                    {candidate.location}
                  </div>
                )}
                {(candidate.ctcCurrent || candidate.ctcExpected) && (
                  <div className="flex items-center gap-1 mt-1 text-sm text-muted-foreground">
                    <Wallet className="w-3 h-3" />
                    {candidate.ctcCurrent && `Current: ₹${candidate.ctcCurrent.toLocaleString()}`}
                    {candidate.ctcCurrent && candidate.ctcExpected && ' | '}
                    {candidate.ctcExpected && `Expected: ₹${candidate.ctcExpected.toLocaleString()}`}
                  </div>
                )}
              </div>
              <Badge>{candidate.currentStatus}</Badge>
            </div>
            {candidate.skills.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-3">
                {candidate.skills.slice(0, 5).map((skill) => (
                  <Badge key={skill} variant="secondary" className="text-xs">
                    {skill}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
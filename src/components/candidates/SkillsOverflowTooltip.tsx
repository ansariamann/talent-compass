import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface SkillsOverflowTooltipProps {
  skills: string[];
  visibleCount?: number;
  className?: string;
}

/**
 * Display skills with a badge for overflow and tooltip showing additional skills
 */
export function SkillsOverflowTooltip({
  skills,
  visibleCount = 3,
  className = "",
}: SkillsOverflowTooltipProps) {
  const [isOpen, setIsOpen] = useState(false);
  const visibleSkills = skills.slice(0, visibleCount);
  const hiddenSkills = skills.slice(visibleCount, visibleCount + 5);
  const remainingCount = skills.length - visibleCount - 5;

  if (skills.length === 0) {
    return <span className="text-xs text-muted-foreground">No skills</span>;
  }

  if (skills.length <= visibleCount) {
    return (
      <div className={`flex flex-wrap gap-1 ${className}`}>
        {skills.map((skill) => (
          <Badge key={skill} variant="secondary" className="text-xs">
            {skill}
          </Badge>
        ))}
      </div>
    );
  }

  return (
    <div className={`flex flex-wrap gap-1 items-center ${className}`}>
      {visibleSkills.map((skill) => (
        <Badge key={skill} variant="secondary" className="text-xs">
          {skill}
        </Badge>
      ))}

      <TooltipProvider>
        <Tooltip open={isOpen} onOpenChange={setIsOpen}>
          <TooltipTrigger asChild>
            <Badge
              variant="outline"
              className="text-xs cursor-pointer hover:bg-primary/10 hover:border-primary/50 transition-colors"
            >
              +{skills.length - visibleCount}
            </Badge>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-xs">
            <div className="space-y-3">
              {hiddenSkills.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2">
                    Next {hiddenSkills.length} skills:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {hiddenSkills.map((skill) => (
                      <Badge
                        key={skill}
                        variant="secondary"
                        className="text-xs"
                      >
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {remainingCount > 0 && (
                <p className="text-xs text-muted-foreground pt-2 border-t border-border">
                  +{remainingCount} more skills. View profile for complete list.
                </p>
              )}

              <p className="text-xs text-muted-foreground font-medium pt-2 border-t border-border">
                Total: {skills.length} skills
              </p>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}

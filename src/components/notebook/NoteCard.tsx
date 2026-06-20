import * as React from "react";
import { Pin } from "lucide-react";
import { Card } from "./Card";
import { Badge } from "./Badge";
import { cn } from "@/lib/utils";

export interface NoteCardProps {
  title: string;
  body: string;
  tags?: string[];
  pinned?: boolean;
  date?: string;
  tilt?: "left" | "right" | "none";
  className?: string;
  onClick?: () => void;
}

export function NoteCard({ title, body, tags, pinned, date, tilt = "right", className, onClick }: NoteCardProps) {
  return (
    <Card tilt={tilt} taped className={cn("cursor-pointer", className)} onClick={onClick}>
      <div className="flex items-start justify-between gap-2">
        <h4 className="font-hand text-2xl leading-tight">{title}</h4>
        {pinned && <Pin className="h-4 w-4 text-accent shrink-0" fill="currentColor" />}
      </div>
      <p className="mt-2 font-body text-[15px] text-ink/90 line-clamp-4 whitespace-pre-wrap">{body}</p>
      {(tags?.length || date) && (
        <div className="mt-4 flex items-center justify-between gap-2 flex-wrap">
          <div className="flex flex-wrap gap-1.5">
            {tags?.map((t) => (
              <Badge key={t} tone="soft">#{t}</Badge>
            ))}
          </div>
          {date && <span className="text-xs text-ink-soft">{date}</span>}
        </div>
      )}
    </Card>
  );
}

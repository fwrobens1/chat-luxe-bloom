import { formatDistanceToNow } from 'date-fns';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  profiles?: {
    username: string;
    avatar_url?: string;
  };
}

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  showAvatar?: boolean;
}

export const MessageBubble = ({ message, isOwn, showAvatar = true }: MessageBubbleProps) => {
  const username = message.profiles?.username || 'Unknown User';
  const initials = username.substring(0, 2).toUpperCase();
  const timeAgo = formatDistanceToNow(new Date(message.created_at), { addSuffix: true });

  return (
    <div className={cn(
      "flex gap-3 group animate-fade-in",
      isOwn ? "flex-row-reverse" : "flex-row"
    )}>
      {showAvatar && (
        <Avatar className="h-8 w-8 flex-shrink-0">
          <AvatarFallback className={cn(
            "text-xs font-semibold",
            isOwn ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
          )}>
            {initials}
          </AvatarFallback>
        </Avatar>
      )}
      
      <div className={cn(
        "flex flex-col max-w-xs md:max-w-md lg:max-w-lg",
        isOwn ? "items-end" : "items-start"
      )}>
        {showAvatar && !isOwn && (
          <span className="text-xs text-muted-foreground mb-1 px-1">
            {username}
          </span>
        )}
        
        <div className={cn(
          "message-bubble relative",
          isOwn ? "message-bubble-own" : "message-bubble-other"
        )}>
          <p className="text-sm leading-relaxed break-words">
            {message.content}
          </p>
          
          <div className={cn(
            "text-xs opacity-0 group-hover:opacity-70 transition-opacity duration-200 mt-1",
            isOwn ? "text-white/70" : "text-muted-foreground"
          )}>
            {timeAgo}
          </div>
        </div>
      </div>
    </div>
  );
};
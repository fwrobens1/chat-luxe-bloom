import { useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useChat } from '@/hooks/useChat';
import { MessageBubble } from './MessageBubble';
import { ChatInput } from './ChatInput';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { LogOut, MessageSquare, Users } from 'lucide-react';

export const ChatRoom = () => {
  const { user, signOut } = useAuth();
  const { messages, currentRoom, loading, sendMessage } = useChat();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Group messages by user for better UI
  const groupedMessages = messages.reduce((groups: any[], message, index) => {
    const prevMessage = messages[index - 1];
    const isSameUser = prevMessage && prevMessage.user_id === message.user_id;
    const isWithinTimeFrame = prevMessage && 
      new Date(message.created_at).getTime() - new Date(prevMessage.created_at).getTime() < 300000; // 5 minutes

    const shouldGroup = isSameUser && isWithinTimeFrame;

    if (shouldGroup) {
      groups[groups.length - 1].messages.push(message);
    } else {
      groups.push({
        user_id: message.user_id,
        username: message.profiles?.username || 'Unknown User',
        messages: [message]
      });
    }

    return groups;
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-chat-bg">
        <div className="text-center animate-fade-in">
          <div className="animate-pulse-glow mb-4">
            <MessageSquare className="h-12 w-12 text-primary mx-auto" />
          </div>
          <p className="text-muted-foreground">Loading chat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-chat-bg">
      {/* Header */}
      <div className="glass-surface border-b border-glass-border p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-primary rounded-xl flex items-center justify-center">
                <MessageSquare className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="font-semibold text-foreground">
                  {currentRoom?.name || 'Chat Room'}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {currentRoom?.description || 'Welcome to the chat!'}
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              Online
            </Badge>
            
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                  {user?.email?.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm text-foreground hidden md:inline">
                {user?.email?.split('@')[0]}
              </span>
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={signOut}
              className="glass-surface border-glass-border hover:bg-chat-surface-hover"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div 
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto scroll-smooth-chat px-4 py-6"
      >
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center animate-fade-in">
            <div className="w-20 h-20 bg-gradient-primary rounded-2xl flex items-center justify-center mb-4 animate-pulse-glow">
              <MessageSquare className="h-10 w-10 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Welcome to {currentRoom?.name}!
            </h3>
            <p className="text-muted-foreground mb-4">
              Be the first to start the conversation
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {groupedMessages.map((group, groupIndex) => (
              <div key={groupIndex} className="space-y-2">
                {group.messages.map((message: any, messageIndex: number) => (
                  <MessageBubble
                    key={message.id}
                    message={message}
                    isOwn={message.user_id === user?.id}
                    showAvatar={messageIndex === 0}
                  />
                ))}
              </div>
            ))}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Chat Input */}
      <ChatInput onSendMessage={sendMessage} />
    </div>
  );
};
import { useState, KeyboardEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send } from 'lucide-react';

interface ChatInputProps {
  onSendMessage: (content: string) => void;
  disabled?: boolean;
}

export const ChatInput = ({ onSendMessage, disabled }: ChatInputProps) => {
  const [message, setMessage] = useState('');

  const handleSend = () => {
    if (message.trim() && !disabled) {
      onSendMessage(message.trim());
      setMessage('');
    }
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="p-4 glass-surface border-t border-glass-border">
      <div className="flex gap-3 items-end">
        <div className="flex-1">
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            className="chat-input"
            disabled={disabled}
            maxLength={1000}
          />
        </div>
        <Button
          onClick={handleSend}
          disabled={!message.trim() || disabled}
          className="bg-gradient-primary hover:opacity-90 transition-all duration-300 rounded-full h-12 w-12 p-0"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
import { MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useChat } from '@/contexts/ChatContext';
import { cn } from '@/lib/utils';

const ChatFloatingButton = () => {
  const { toggleChat, isOpen, messages } = useChat();
  
  // Count unread messages (assistant messages that came after the chat was closed)
  const unreadCount = messages.filter(m => !m.isUser).length;

  return (
    <Button
      onClick={toggleChat}
      size="lg"
      className={cn(
        "fixed bottom-6 right-6 z-40 h-14 w-14 rounded-full shadow-glow",
        "interactive hover:shadow-glow hover:scale-105",
        isOpen && "bg-muted text-muted-foreground"
      )}
      variant={isOpen ? "outline" : "default"}
    >
      <MessageCircle className="h-6 w-6" />
      {unreadCount > 0 && !isOpen && (
        <div className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center font-medium">
          {unreadCount > 9 ? '9+' : unreadCount}
        </div>
      )}
    </Button>
  );
};

export default ChatFloatingButton;
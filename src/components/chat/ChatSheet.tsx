import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { useChat } from '@/contexts/ChatContext';
import ChatInterface from './ChatInterface';

const ChatSheet = () => {
  const { isOpen, toggleChat } = useChat();

  return (
    <Sheet open={isOpen} onOpenChange={toggleChat}>
      <SheetContent side="right" className="w-full sm:w-[400px] p-0 flex flex-col">
        <SheetHeader className="sr-only">
          <SheetTitle>AI Chat Assistant</SheetTitle>
        </SheetHeader>
        <ChatInterface />
      </SheetContent>
    </Sheet>
  );
};

export default ChatSheet;
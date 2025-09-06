import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { ChatRoom } from '@/components/chat/ChatRoom';

const Index = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-chat-bg flex items-center justify-center">
        <div className="animate-pulse-glow">
          <div className="h-12 w-12 bg-gradient-primary rounded-xl"></div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return <ChatRoom />;
};

export default Index;

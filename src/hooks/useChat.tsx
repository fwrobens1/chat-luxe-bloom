import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

interface Message {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  chat_room_id: string;
  profiles?: {
    username: string;
    avatar_url?: string;
  };
}

interface ChatRoom {
  id: string;
  name: string;
  description?: string;
  created_at: string;
}

export const useChat = (roomId?: string) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [currentRoom, setCurrentRoom] = useState<ChatRoom | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch chat rooms
  const fetchChatRooms = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('chat_rooms')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;

      setChatRooms(data || []);
      
      // Set current room to the first one if none specified or find the specified one
      if (data && data.length > 0) {
        const targetRoom = roomId 
          ? data.find(room => room.id === roomId) 
          : data[0];
        
        if (targetRoom) {
          setCurrentRoom(targetRoom);
        }
      }
    } catch (error) {
      console.error('Error fetching chat rooms:', error);
      toast({
        title: "Error",
        description: "Failed to load chat rooms",
        variant: "destructive"
      });
    }
  }, [roomId]);

  // Fetch messages for current room
  const fetchMessages = useCallback(async (roomId: string) => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          profiles:user_id (
            username,
            avatar_url
          )
        `)
        .eq('chat_room_id', roomId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      setMessages(data || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast({
        title: "Error",
        description: "Failed to load messages",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, []);

  // Send a message
  const sendMessage = useCallback(async (content: string) => {
    if (!user || !currentRoom) {
      toast({
        title: "Error",
        description: "You must be logged in to send messages",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          content,
          user_id: user.id,
          chat_room_id: currentRoom.id
        });

      if (error) throw error;

    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive"
      });
    }
  }, [user, currentRoom]);

  // Set up real-time subscriptions
  useEffect(() => {
    if (!currentRoom) return;

    // Subscribe to new messages
    const messagesChannel = supabase
      .channel('messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `chat_room_id=eq.${currentRoom.id}`
        },
        async (payload) => {
          // Fetch the complete message with profile data
          const { data } = await supabase
            .from('messages')
            .select(`
              *,
              profiles:user_id (
                username,
                avatar_url
              )
            `)
            .eq('id', payload.new.id)
            .single();

          if (data) {
            setMessages(prev => [...prev, data]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(messagesChannel);
    };
  }, [currentRoom]);

  // Initialize data
  useEffect(() => {
    fetchChatRooms();
  }, [fetchChatRooms]);

  // Fetch messages when room changes
  useEffect(() => {
    if (currentRoom) {
      setLoading(true);
      fetchMessages(currentRoom.id);
    }
  }, [currentRoom, fetchMessages]);

  return {
    messages,
    chatRooms,
    currentRoom,
    loading,
    sendMessage,
    setCurrentRoom
  };
};
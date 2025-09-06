-- Enable Row Level Security on existing tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Chat rooms are viewable by everyone" ON public.chat_rooms;
DROP POLICY IF EXISTS "Authenticated users can create chat rooms" ON public.chat_rooms;
DROP POLICY IF EXISTS "Messages are viewable by everyone" ON public.messages;
DROP POLICY IF EXISTS "Authenticated users can create messages" ON public.messages;
DROP POLICY IF EXISTS "Users can update their own messages" ON public.messages;
DROP POLICY IF EXISTS "Users can delete their own messages" ON public.messages;

-- Create policies for profiles
CREATE POLICY "Users can read all profiles" 
ON public.profiles 
FOR SELECT 
USING (true);

CREATE POLICY "Users can update own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = id);

-- Create policies for chat rooms
CREATE POLICY "Anyone can read chat rooms" 
ON public.chat_rooms 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can create chat rooms" 
ON public.chat_rooms 
FOR INSERT 
WITH CHECK (auth.uid() = created_by);

-- Create policies for messages
CREATE POLICY "Anyone can read messages" 
ON public.messages 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can send messages" 
ON public.messages 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own messages" 
ON public.messages 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own messages" 
ON public.messages 
FOR DELETE 
USING (auth.uid() = user_id);

-- Enable realtime for all tables
ALTER TABLE public.profiles REPLICA IDENTITY FULL;
ALTER TABLE public.chat_rooms REPLICA IDENTITY FULL;
ALTER TABLE public.messages REPLICA IDENTITY FULL;

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- Create a default public chat room
INSERT INTO public.chat_rooms (name, description) 
VALUES ('General', 'Welcome to the general chat room!');

-- Create function to automatically create user profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, username)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
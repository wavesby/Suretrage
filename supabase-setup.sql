-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  is_admin BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create user_preferences table
CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  preferences JSONB DEFAULT '{}'::jsonb,
  selected_bookmakers TEXT[] DEFAULT '{}',
  default_stake DECIMAL DEFAULT 100,
  sms_notifications BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id)
);

-- Create bookmaker_odds table
CREATE TABLE IF NOT EXISTS bookmaker_odds (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id TEXT NOT NULL,
  bookmaker TEXT NOT NULL,
  match_name TEXT NOT NULL,
  team_home TEXT NOT NULL,
  team_away TEXT NOT NULL,
  league TEXT,
  match_time TEXT,
  market_type TEXT DEFAULT 'h2h',
  odds_home DECIMAL NOT NULL,
  odds_away DECIMAL NOT NULL,
  odds_draw DECIMAL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS bookmaker_odds_match_id_idx ON bookmaker_odds(match_id);
CREATE INDEX IF NOT EXISTS bookmaker_odds_bookmaker_idx ON bookmaker_odds(bookmaker);

-- Set up Row Level Security (RLS) for profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile" 
  ON profiles FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
  ON profiles FOR UPDATE 
  USING (auth.uid() = id);

-- Set up RLS for user_preferences
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own preferences" 
  ON user_preferences FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences" 
  ON user_preferences FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own preferences" 
  ON user_preferences FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Set up RLS for bookmaker_odds (read-only for users)
ALTER TABLE bookmaker_odds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view odds data" 
  ON bookmaker_odds FOR SELECT 
  USING (true);

-- Create function to handle user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create profile when a user signs up
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user(); 
-- Create rooms table for cloud-synced game sessions
CREATE TABLE public.rooms (
  id TEXT PRIMARY KEY,
  admin_key TEXT NOT NULL,
  settings JSONB NOT NULL DEFAULT '{"startingLife": 40, "playerCount": 4}',
  players JSONB NOT NULL DEFAULT '[]',
  day_night TEXT DEFAULT 'day',
  monarch TEXT,
  initiative TEXT,
  dungeon_progress INTEGER NOT NULL DEFAULT 0,
  overlay_layout JSONB,
  history JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;

-- Public read access (anyone with room ID can view)
CREATE POLICY "Anyone can view rooms" 
ON public.rooms 
FOR SELECT 
USING (true);

-- Public insert access (anyone can create a room)
CREATE POLICY "Anyone can create rooms" 
ON public.rooms 
FOR INSERT 
WITH CHECK (true);

-- Update requires admin_key match (validated in application)
CREATE POLICY "Anyone can update rooms" 
ON public.rooms 
FOR UPDATE 
USING (true);

-- Delete requires admin_key match (validated in application)
CREATE POLICY "Anyone can delete rooms" 
ON public.rooms 
FOR DELETE 
USING (true);

-- Enable realtime for rooms table
ALTER TABLE public.rooms REPLICA IDENTITY FULL;

-- Create index for faster lookups
CREATE INDEX idx_rooms_last_updated ON public.rooms(last_updated DESC);

-- Create function to update last_updated timestamp
CREATE OR REPLACE FUNCTION public.update_room_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_updated = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_rooms_last_updated
BEFORE UPDATE ON public.rooms
FOR EACH ROW
EXECUTE FUNCTION public.update_room_timestamp();
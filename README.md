# Audio Data Collector

A web application to collect voice samples with transcripts for creating speech datasets. Built with HTML, CSS, JavaScript, and Supabase.

![Audio Data Collector](https://img.shields.io/badge/Status-Ready-green)

## Features

- 🎙️ Record audio directly in browser
- 📝 Add transcript for each recording
- 🎨 Real-time audio visualization
- ☁️ Automatic upload to Supabase Storage
- 📊 View all collected samples
- 🏷️ Add metadata (speaker name, language, tags)
- 🗑️ Delete samples
- 📱 Responsive design

## Setup Instructions

### 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a free account
2. Create a new project
3. Wait for the project to be ready

### 2. Set Up Database Table

Go to **SQL Editor** in your Supabase dashboard and run:

```sql
-- Create samples table
CREATE TABLE samples (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    transcript TEXT NOT NULL,
    audio_url TEXT NOT NULL,
    audio_filename TEXT NOT NULL,
    duration_ms INTEGER,
    speaker_name TEXT,
    language VARCHAR(10) DEFAULT 'en',
    tags TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (optional but recommended)
ALTER TABLE samples ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations (for demo purposes)
-- For production, you should implement proper authentication
CREATE POLICY "Allow all operations" ON samples
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Create index for faster queries
CREATE INDEX idx_samples_created_at ON samples(created_at DESC);
```

### 3. Set Up Storage Bucket

1. Go to **Storage** in your Supabase dashboard
2. Click **New bucket**
3. Name it `audio-samples`
4. Make it **Public** (check the public bucket option)
5. Click **Create bucket**

Set up storage policies by going to **Storage** > **Policies** and add:

```sql
-- Allow public read access
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'audio-samples');

-- Allow uploads
CREATE POLICY "Allow uploads"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'audio-samples');

-- Allow deletes
CREATE POLICY "Allow deletes"
ON storage.objects FOR DELETE
USING (bucket_id = 'audio-samples');
```

### 4. Configure the Application

1. Go to **Settings** > **API** in your Supabase dashboard
2. Copy your **Project URL** and **anon public** key
3. Open `config.js` and replace the placeholder values:

```javascript
const SUPABASE_URL = 'https://your-project-id.supabase.co';
const SUPABASE_ANON_KEY = 'your-anon-key-here';
```

### 5. Run the Application

You can run this application using any local web server:

**Option 1: Using VS Code Live Server**
- Install the "Live Server" extension
- Right-click on `index.html` and select "Open with Live Server"

**Option 2: Using Python**
```bash
# Python 3
python -m http.server 8000

# Then open http://localhost:8000
```

**Option 3: Using Node.js**
```bash
npx serve .
```

**Option 4: Using PHP**
```bash
php -S localhost:8000
```

## Usage

1. **Record Audio**: Click "Start Recording" and speak into your microphone
2. **Stop Recording**: Click "Stop" when finished
3. **Preview**: Listen to your recording to verify quality
4. **Add Transcript**: Type the exact text that was spoken
5. **Add Metadata** (optional): Speaker name, language, and tags
6. **Upload**: Click "Upload Sample" to save to Supabase

## Project Structure

```
audio-data-collector/
├── index.html      # Main HTML structure
├── styles.css      # CSS styles
├── config.js       # Supabase configuration
├── app.js          # Main application logic
└── README.md       # This file
```

## Browser Support

This application uses the MediaRecorder API and requires a modern browser:
- Chrome 49+
- Firefox 25+
- Edge 79+
- Safari 14.1+

## Exporting Data

You can export your collected data from Supabase:

1. Go to **Table Editor** > **samples**
2. Click **Export** to download as CSV
3. Download audio files from **Storage** > **audio-samples**

## License

MIT License - feel free to use this for your dataset collection projects!

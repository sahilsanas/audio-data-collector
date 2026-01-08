// Supabase Configuration
// Replace these with your actual Supabase project credentials

const SUPABASE_URL = 'https://nykvtyvggyklouoppdbu.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im55a3Z0eXZnZ3lrbG91b3BwZGJ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc4OTU5NzQsImV4cCI6MjA4MzQ3MTk3NH0.eruSsf5tm3yAqBJomfaQhtrNCWVkNH_TXiW26fecqZ8';

// Initialize Supabase client
let supabase;
try {
    const { createClient } = window.supabase || window.Supabase || {};
    if (createClient) {
        supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log('Supabase initialized successfully');
    } else {
        console.error('Supabase createClient not found');
    }
} catch (e) {
    console.error('Error initializing Supabase:', e);
}

// Storage bucket name for audio files
const AUDIO_BUCKET = 'audio-samples';

// Table name for sample metadata
const SAMPLES_TABLE = 'samples';

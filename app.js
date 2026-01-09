// Audio Data Collector - Main Application

class AudioDataCollector {
    constructor() {
        // DOM Elements
        this.recordBtn = document.getElementById('recordBtn');
        this.stopBtn = document.getElementById('stopBtn');
        this.timer = document.getElementById('timer');
        this.previewSection = document.getElementById('previewSection');
        this.audioPreview = document.getElementById('audioPreview');
        this.discardBtn = document.getElementById('discardBtn');
        this.transcript = document.getElementById('transcript');
        this.speakerName = document.getElementById('speakerName');
        this.language = document.getElementById('language');
        this.tags = document.getElementById('tags');
        this.consent = document.getElementById('consent');
        this.submitBtn = document.getElementById('submitBtn');
        this.uploadStatus = document.getElementById('uploadStatus');

        // State
        this.audioBlob = null;
        this.audioUrl = null;
        this.stream = null;
        this.timerInterval = null;
        this.startTime = null;
        this.recordingDuration = 0;
        this.isRecording = false;
        this.rawAudioData = [];
        this.audioContext = null;
        this.scriptProcessor = null;

        // Initialize
        this.init();
    }

    init() {
        this.bindEvents();
    }

    bindEvents() {
        this.recordBtn.addEventListener('click', () => this.startRecording());
        this.stopBtn.addEventListener('click', () => this.stopRecording());
        this.discardBtn.addEventListener('click', () => this.discardRecording());
        this.submitBtn.addEventListener('click', () => this.uploadSample());
        
        this.transcript.addEventListener('input', () => this.updateSubmitButton());

        this.consent.addEventListener('change', () => this.updateSubmitButton());
    }

    async startRecording() {
        try {
            // Request microphone access - 16kHz mono for Whisper
            this.stream = await navigator.mediaDevices.getUserMedia({ 
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    sampleRate: 16000,
                    channelCount: 1
                } 
            });

            // Setup audio context for WAV conversion
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 16000 });
            const source = this.audioContext.createMediaStreamSource(this.stream);

            // Setup ScriptProcessor for raw PCM capture (for WAV conversion)
            this.scriptProcessor = this.audioContext.createScriptProcessor(4096, 1, 1);
            this.rawAudioData = [];
            
            this.scriptProcessor.onaudioprocess = (e) => {
                if (this.isRecording) {
                    const channelData = e.inputBuffer.getChannelData(0);
                    this.rawAudioData.push(new Float32Array(channelData));
                }
            };
            
            source.connect(this.scriptProcessor);
            this.scriptProcessor.connect(this.audioContext.destination);

            // Start recording
            this.isRecording = true;
            this.startTime = Date.now();
            this.startTimer();

            // Update UI
            this.recordBtn.disabled = true;
            this.recordBtn.classList.add('recording');
            this.recordBtn.querySelector('.text').textContent = 'Recording...';
            this.stopBtn.disabled = false;

        } catch (error) {
            console.error('Error accessing microphone:', error);
            this.showStatus('Error: Could not access microphone. Please grant permission.', 'error');
        }
    }

    // Convert Float32Array samples to 16-bit PCM WAV
    encodeWAV(samples, sampleRate) {
        const buffer = new ArrayBuffer(44 + samples.length * 2);
        const view = new DataView(buffer);

        // WAV header
        const writeString = (offset, string) => {
            for (let i = 0; i < string.length; i++) {
                view.setUint8(offset + i, string.charCodeAt(i));
            }
        };

        writeString(0, 'RIFF');
        view.setUint32(4, 36 + samples.length * 2, true);
        writeString(8, 'WAVE');
        writeString(12, 'fmt ');
        view.setUint32(16, 16, true); // fmt chunk size
        view.setUint16(20, 1, true); // audio format (PCM)
        view.setUint16(22, 1, true); // num channels (mono)
        view.setUint32(24, sampleRate, true); // sample rate
        view.setUint32(28, sampleRate * 2, true); // byte rate
        view.setUint16(32, 2, true); // block align
        view.setUint16(34, 16, true); // bits per sample
        writeString(36, 'data');
        view.setUint32(40, samples.length * 2, true);

        // Convert float samples to 16-bit PCM
        let offset = 44;
        for (let i = 0; i < samples.length; i++) {
            const s = Math.max(-1, Math.min(1, samples[i]));
            view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
            offset += 2;
        }

        return new Blob([buffer], { type: 'audio/wav' });
    }

    stopRecording() {
        this.isRecording = false;

        // Stop all tracks
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
        }

        // Disconnect audio nodes
        if (this.scriptProcessor) {
            this.scriptProcessor.disconnect();
        }

        // Stop timer
        this.stopTimer();

        // Update UI
        this.recordBtn.disabled = false;
        this.recordBtn.classList.remove('recording');
        this.recordBtn.querySelector('.text').textContent = 'Start Recording';
        this.stopBtn.disabled = true;

        // Process the recording
        this.processRecording();
    }

    processRecording() {
        // Merge all audio chunks into one Float32Array
        const totalLength = this.rawAudioData.reduce((acc, chunk) => acc + chunk.length, 0);
        const mergedData = new Float32Array(totalLength);
        let offset = 0;
        for (const chunk of this.rawAudioData) {
            mergedData.set(chunk, offset);
            offset += chunk.length;
        }

        // Convert to 16kHz WAV
        const sampleRate = this.audioContext ? this.audioContext.sampleRate : 16000;
        this.audioBlob = this.encodeWAV(mergedData, sampleRate);
        this.audioUrl = URL.createObjectURL(this.audioBlob);

        // Show preview
        this.audioPreview.src = this.audioUrl;
        this.previewSection.classList.remove('hidden');

        // Enable submit if transcript is filled
        this.updateSubmitButton();
    }

    discardRecording() {
        if (this.audioUrl) {
            URL.revokeObjectURL(this.audioUrl);
        }
        
        this.audioBlob = null;
        this.audioUrl = null;
        this.rawAudioData = [];
        this.recordingDuration = 0;
        
        this.audioPreview.src = '';
        this.previewSection.classList.add('hidden');
        this.timer.textContent = '00:00';
        
        this.updateSubmitButton();
    }

    startTimer() {
        this.timerInterval = setInterval(() => {
            const elapsed = Date.now() - this.startTime;
            this.recordingDuration = elapsed;
            this.timer.textContent = this.formatTime(elapsed);
        }, 100);
    }

    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }

    formatTime(ms) {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }

    formatDuration(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }

    updateSubmitButton() {
        const hasRecording = this.audioBlob !== null;
        const hasTranscript = this.transcript.value.trim().length > 0;
        const hasConsent = this.consent.checked;
        this.submitBtn.disabled = !(hasRecording && hasTranscript && hasConsent);
    }

    async uploadSample() {
        if (!this.audioBlob || !this.transcript.value.trim()) {
            this.showStatus('Please record audio and enter a transcript.', 'error');
            return;
        }

        this.showStatus('Uploading...', 'loading');
        this.submitBtn.disabled = true;

        try {
            // Generate unique filename
            const timestamp = Date.now();
            const extension = this.getFileExtension();
            const filename = `sample_${timestamp}.${extension}`;

            // Upload audio file to Supabase Storage
            const { data: uploadData, error: uploadError } = await supabase.storage
                .from(AUDIO_BUCKET)
                .upload(filename, this.audioBlob, {
                    contentType: this.audioBlob.type,
                    upsert: false
                });

            if (uploadError) {
                throw new Error(`Upload failed: ${uploadError.message}`);
            }

            // Get public URL for the uploaded file
            const { data: urlData } = supabase.storage
                .from(AUDIO_BUCKET)
                .getPublicUrl(filename);

            const audioUrl = urlData.publicUrl;

            // Parse tags
            const tagsArray = this.tags.value
                .split(',')
                .map(tag => tag.trim())
                .filter(tag => tag.length > 0);

            // Save metadata to database
            const sampleData = {
                transcript: this.transcript.value.trim(),
                audio_url: audioUrl,
                audio_filename: filename,
                duration_ms: this.recordingDuration,
                speaker_name: this.speakerName.value.trim() || null,
                language: this.language.value,
                tags: tagsArray,
                created_at: new Date().toISOString()
            };

            const { data: insertData, error: insertError } = await supabase
                .from(SAMPLES_TABLE)
                .insert([sampleData])
                .select();

            if (insertError) {
                throw new Error(`Database insert failed: ${insertError.message}`);
            }

            // Success!
            this.showStatus('✓ Sample uploaded successfully!', 'success');
            
            // Reset form
            this.discardRecording();
            this.transcript.value = '';
            this.speakerName.value = '';
            this.tags.value = '';
            this.charCount.textContent = '0';

        } catch (error) {
            console.error('Upload error:', error);
            this.showStatus(`Error: ${error.message}`, 'error');
        } finally {
            this.updateSubmitButton();
        }
    }

    getFileExtension() {
        // Always WAV for Whisper fine-tuning
        return 'wav';
    }

    showStatus(message, type) {
        this.uploadStatus.textContent = message;
        this.uploadStatus.className = `upload-status ${type}`;
        this.uploadStatus.classList.remove('hidden');

        if (type === 'success') {
            setTimeout(() => {
                this.uploadStatus.classList.add('hidden');
            }, 3000);
        }
    }
}

// Initialize app when DOM is ready
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new AudioDataCollector();
});


// Audio Data Collector - Main Application

class AudioDataCollector {
    constructor() {
        // DOM Elements
        this.recordBtn = document.getElementById('recordBtn');
        this.stopBtn = document.getElementById('stopBtn');
        this.timer = document.getElementById('timer');
        this.visualizer = document.getElementById('visualizer');
        this.previewSection = document.getElementById('previewSection');
        this.audioPreview = document.getElementById('audioPreview');
        this.discardBtn = document.getElementById('discardBtn');
        this.transcript = document.getElementById('transcript');
        this.charCount = document.getElementById('charCount');
        this.speakerName = document.getElementById('speakerName');
        this.language = document.getElementById('language');
        this.tags = document.getElementById('tags');
        this.consent = document.getElementById('consent');
        this.submitBtn = document.getElementById('submitBtn');
        this.uploadStatus = document.getElementById('uploadStatus');

        // State
        this.mediaRecorder = null;
        this.audioChunks = [];
        this.audioBlob = null;
        this.audioUrl = null;
        this.stream = null;
        this.timerInterval = null;
        this.startTime = null;
        this.recordingDuration = 0;
        this.analyser = null;
        this.animationId = null;

        // Initialize
        this.init();
    }

    init() {
        this.bindEvents();
        this.setupVisualizer();
    }

    bindEvents() {
        this.recordBtn.addEventListener('click', () => this.startRecording());
        this.stopBtn.addEventListener('click', () => this.stopRecording());
        this.discardBtn.addEventListener('click', () => this.discardRecording());
        this.submitBtn.addEventListener('click', () => this.uploadSample());
        
        this.transcript.addEventListener('input', () => {
            this.charCount.textContent = this.transcript.value.length;
            this.updateSubmitButton();
        });

        this.consent.addEventListener('change', () => this.updateSubmitButton());
    }

    setupVisualizer() {
        const canvas = this.visualizer;
        const ctx = canvas.getContext('2d');
        
        // Set canvas size
        canvas.width = canvas.offsetWidth * 2;
        canvas.height = canvas.offsetHeight * 2;
        ctx.scale(2, 2);
        
        // Draw initial state
        this.drawIdleVisualizer(ctx, canvas);
    }

    drawIdleVisualizer(ctx, canvas) {
        const width = canvas.offsetWidth;
        const height = canvas.offsetHeight;
        
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, width, height);
        
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, height / 2);
        ctx.lineTo(width, height / 2);
        ctx.stroke();
    }

    drawVisualizer() {
        if (!this.analyser) return;

        const canvas = this.visualizer;
        const ctx = canvas.getContext('2d');
        const width = canvas.offsetWidth;
        const height = canvas.offsetHeight;

        const bufferLength = this.analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        this.analyser.getByteTimeDomainData(dataArray);

        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, width, height);

        ctx.lineWidth = 2;
        ctx.strokeStyle = '#6366f1';
        ctx.beginPath();

        const sliceWidth = width / bufferLength;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
            const v = dataArray[i] / 128.0;
            const y = (v * height) / 2;

            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }

            x += sliceWidth;
        }

        ctx.lineTo(width, height / 2);
        ctx.stroke();

        this.animationId = requestAnimationFrame(() => this.drawVisualizer());
    }

    async startRecording() {
        try {
            // Request microphone access
            this.stream = await navigator.mediaDevices.getUserMedia({ 
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    sampleRate: 44100
                } 
            });

            // Setup audio context for visualization
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const source = audioContext.createMediaStreamSource(this.stream);
            this.analyser = audioContext.createAnalyser();
            this.analyser.fftSize = 2048;
            source.connect(this.analyser);

            // Setup MediaRecorder
            this.mediaRecorder = new MediaRecorder(this.stream, {
                mimeType: this.getSupportedMimeType()
            });
            
            this.audioChunks = [];

            this.mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    this.audioChunks.push(event.data);
                }
            };

            this.mediaRecorder.onstop = () => {
                this.processRecording();
            };

            // Start recording
            this.mediaRecorder.start(100); // Collect data every 100ms
            this.startTime = Date.now();
            this.startTimer();
            this.drawVisualizer();

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

    getSupportedMimeType() {
        const mimeTypes = [
            'audio/webm;codecs=opus',
            'audio/webm',
            'audio/ogg;codecs=opus',
            'audio/mp4',
            'audio/mpeg'
        ];

        for (const mimeType of mimeTypes) {
            if (MediaRecorder.isTypeSupported(mimeType)) {
                return mimeType;
            }
        }
        return 'audio/webm';
    }

    stopRecording() {
        if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
            this.mediaRecorder.stop();
        }

        // Stop all tracks
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
        }

        // Stop timer
        this.stopTimer();

        // Stop visualizer
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }

        // Reset visualizer
        const ctx = this.visualizer.getContext('2d');
        this.drawIdleVisualizer(ctx, this.visualizer);

        // Update UI
        this.recordBtn.disabled = false;
        this.recordBtn.classList.remove('recording');
        this.recordBtn.querySelector('.text').textContent = 'Start Recording';
        this.stopBtn.disabled = true;
    }

    processRecording() {
        const mimeType = this.getSupportedMimeType();
        this.audioBlob = new Blob(this.audioChunks, { type: mimeType });
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
        this.audioChunks = [];
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
        const mimeType = this.audioBlob.type;
        if (mimeType.includes('webm')) return 'webm';
        if (mimeType.includes('ogg')) return 'ogg';
        if (mimeType.includes('mp4')) return 'm4a';
        if (mimeType.includes('mpeg')) return 'mp3';
        return 'webm';
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


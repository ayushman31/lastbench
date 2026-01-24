import {
    getSupportedMimeType,
    checkMediaRecorderSupport,
  } from '../utils/browser';
  
  import {
    RecordingConfig,
    RecordingState,
    RecordingStatus,
    RecordingEvent,
    RecordingEventCallback,
    RecordingMetadata,
    RecordingError,
    RecordingErrorCode,
  } from './types';
  
  export class LocalRecorder {
    private recorder: MediaRecorder | null = null;
    private stream: MediaStream | null = null;
  
    private readonly config: Required<RecordingConfig>;
    private state: RecordingState;
  
    private callbacks = new Set<RecordingEventCallback>();
  
    private startTime = 0;
    private pausedAt = 0;
    private pausedTotal = 0;
  
    private chunks: Blob[] = [];
    private size = 0;
  
    private disposed = false;
    private finalized = false;
  
    constructor(config: RecordingConfig) {
      if (typeof window === 'undefined' || !window.isSecureContext) {
        throw new RecordingError(
          'Browser secure context required',
          'NOT_SUPPORTED'
        );
      }
  
      const mimeType =
        config.mimeType ||
        getSupportedMimeType(Boolean(config.video));
  
      if (!mimeType) {
        throw new RecordingError(
          'No supported MIME type available',
          'MIME_TYPE_NOT_SUPPORTED'
        );
      }
  
      this.config = {
        audio: config.audio ?? true,
        video: config.video ?? false,
        mimeType,
        audioBitsPerSecond: config.audioBitsPerSecond ?? 128000,
        videoBitsPerSecond: config.videoBitsPerSecond ?? 2500000,
        timeslice: config.timeslice ?? 1000,
        audioConstraints: config.audioConstraints ?? {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 48000,
          channelCount: 2,
        },
        videoConstraints: config.videoConstraints ?? {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 },
          facingMode: 'user',
        },
        autoRecover: false, // intentionally disabled
      };
  
      this.state = {
        status: 'idle',
        duration: 0,
        dataSize: 0,
      };
    }
  
  
    static async isSupported(includeVideo = false) {
      return checkMediaRecorderSupport(includeVideo);
    }
  
  
    async initialize(): Promise<void> {
      this.assertUsable();
  
      if (this.stream) return;
  
      this.transition('requesting-permission');
  
      try {
        this.stream = await navigator.mediaDevices.getUserMedia({
          audio: this.config.audio ? this.config.audioConstraints : false,
          video: this.config.video ? this.config.videoConstraints : false,
        });
  
        this.emit({ type: 'permission-granted' });
        this.emit({ type: 'initialized' });
        this.transition('idle');
      } catch (err) {
        throw this.fail(
          'Failed to acquire media stream',
          this.mapPermissionError(err)
        );
      }
    }
  
    async start(): Promise<void> {
      this.assertUsable();
  
      if (this.state.status !== 'idle') {
        throw this.fail('Invalid state for start', 'INVALID_STATE');
      }
  
      if (!this.stream) {
        await this.initialize();
      }
  
      if (!this.stream) {
        throw this.fail('Stream unavailable', 'INITIALIZATION_FAILED');
      }
  
      if (!MediaRecorder.isTypeSupported(this.config.mimeType)) {
        throw this.fail(
          'MIME type not supported',
          'MIME_TYPE_NOT_SUPPORTED'
        );
      }
  
      this.recorder = new MediaRecorder(this.stream, {
        mimeType: this.config.mimeType,
        audioBitsPerSecond: this.config.audioBitsPerSecond,
        videoBitsPerSecond: this.config.video
          ? this.config.videoBitsPerSecond
          : undefined,
      });
  
      this.recorder.addEventListener(
        'dataavailable',
        this.onDataAvailable
      );
      this.recorder.addEventListener('error', this.onRecorderError);
      this.recorder.addEventListener('stop', this.onRecorderStop);
  
      this.chunks = [];
      this.size = 0;
      this.finalized = false;
  
      this.startTime = Date.now();
      this.pausedAt = 0;
      this.pausedTotal = 0;
  
      this.recorder.start(this.config.timeslice);
      this.transition('recording');
      this.emit({ type: 'started' });
    }
  
    pause(): void {
      this.assertRecording();
  
      this.recorder!.pause();
      this.pausedAt = Date.now();
  
      this.transition('paused');
      this.emit({ type: 'paused' });
    }
  
    resume(): void {
      if (this.state.status !== 'paused') {
        throw this.fail('Not paused', 'INVALID_STATE');
      }
  
      this.recorder!.resume();
      this.pausedTotal += Date.now() - this.pausedAt;
  
      this.transition('recording');
      this.emit({ type: 'resumed' });
    }
  
    stop(): Promise<Blob> {
      this.assertUsable();
  
      if (
        this.state.status !== 'recording' &&
        this.state.status !== 'paused'
      ) {
        throw this.fail('Not recording', 'NOT_RECORDING');
      }
  
      if (!this.recorder || this.finalized) {
        throw this.fail('Recorder unavailable', 'INVALID_STATE');
      }
  
      this.transition('stopping');
  
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(
            this.fail('Stop timeout exceeded', 'RECORDING_FAILED')
          );
        }, 4000);
  
        const finalize = () => {
          if (this.finalized) return;
          this.finalized = true;
          clearTimeout(timeout);
  
          try {
            const blob = new Blob(this.chunks, {
              type: this.config.mimeType,
            });
  
            this.transition('stopped');
            this.emit({
              type: 'stopped',
              data: { blob, metadata: this.getMetadata() },
            });
  
            this.cleanup();
            resolve(blob);
          } catch (e) {
            reject(
              this.fail(
                'Blob creation failed',
                'RECORDING_FAILED',
                e
              )
            );
          }
        };
  
        this.recorder!.addEventListener('stop', finalize, {
          once: true,
        });
        this.recorder!.stop();
      });
    }

    getStream(): MediaStream | null {
      return this.stream;
    }
  
    dispose(): void {
      if (this.disposed) return;
      this.disposed = true;
      this.cleanup();
      this.callbacks.clear();
    }
  
    on(cb: RecordingEventCallback): () => void {
      this.callbacks.add(cb);
      return () => this.callbacks.delete(cb);
    }
  
    getState(): RecordingState {
      return { ...this.state };
    }
  
    getDuration(): number {
      if (this.state.status === 'recording') {
        return Math.floor(
          (Date.now() - this.startTime - this.pausedTotal) / 1000
        );
      }
      return this.state.duration;
    }
  
    getMetadata(): RecordingMetadata {
      return {
        startTime: this.startTime,
        endTime: Date.now(),
        duration: this.getDuration(),
        mimeType: this.config.mimeType,
        codec: this.config.mimeType.match(/codecs=([^;]+)/)?.[1],
        audioTracks: this.stream?.getAudioTracks().length ?? 0,
        videoTracks: this.stream?.getVideoTracks().length ?? 0,
        dataSize: this.size,
        metadata: this.config,
      };
    }
  
    private onDataAvailable = (e: BlobEvent) => {
      if (!e.data || e.data.size === 0) return;
  
      this.chunks.push(e.data);
      this.size += e.data.size;
  
      this.state = {
        ...this.state,
        dataSize: this.size,
        duration: this.getDuration(),
      };
  
      this.emit({
        type: 'data-available',
        data: {
          chunk: e.data,
          size: e.data.size,
          totalSize: this.size,
        },
      });
    };
  
    private onRecorderError = () => {
      this.transition('error');
      this.emit({
        type: 'error',
        data: this.fail('Recorder error', 'RECORDING_FAILED'),
      });
      this.cleanup();
    };
  
    private onRecorderStop = () => {
        // handled in stop()
    };
  
    private transition(status: RecordingStatus) {
      this.state = {
        ...this.state,
        status,
        duration: this.getDuration(),
        dataSize: this.size,
      };
      this.emit({ type: 'state-changed', data: this.state });
    }
  
    private emit(e: Omit<RecordingEvent, 'timestamp'>) {
      const event: RecordingEvent = {
        ...e,
        timestamp: Date.now(),
      };
      for (const cb of this.callbacks) cb(event);
    }
  
    private cleanup() {
      if (this.recorder) {
        this.recorder.ondataavailable = null;
        this.recorder.onerror = null;
        this.recorder.onstop = null;
        this.recorder = null;
      }
  
      if (this.stream) {
        this.stream.getTracks().forEach((t) => t.stop());
        this.stream = null;
      }
    }
  
    private fail(
      message: string,
      code: RecordingErrorCode,
      err?: unknown
    ): RecordingError {
      return new RecordingError(
        message,
        code,
        err instanceof Error ? err : undefined
      );
    }
  
    private mapPermissionError(err: unknown): RecordingErrorCode {
      const msg =
        err instanceof Error ? err.message.toLowerCase() : '';
      if (msg.includes('denied')) return 'PERMISSION_DENIED';
      if (msg.includes('notfound')) return 'DEVICE_NOT_FOUND';
      return 'INITIALIZATION_FAILED';
    }
  
    private assertRecording() {
      if (this.state.status !== 'recording') {
        throw this.fail('Not recording', 'NOT_RECORDING');
      }
    }
  
    private assertUsable() {
      if (this.disposed) {
        throw this.fail('Recorder disposed', 'INVALID_STATE');
      }
    }
  }
  
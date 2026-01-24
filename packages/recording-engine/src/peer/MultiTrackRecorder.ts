/**
 * multi track recorder for capturing separate audio/video from each participant
 * enables post-production editing with individual control over each track
 */

import { getSupportedMimeType } from '../utils/browser';
import type { RecordingError, RecordingErrorCode } from '../core/types';
import type { RemotePeer } from './peer-types';
import type { RecordingSession, TrackRecordingConfig, MultiTrackEventCallback, ParticipantTrack, MultiTrackEvent } from './multiTrack-types';


export class MultiTrackRecorder {
  private session: RecordingSession | null = null;
  private readonly config: Required<TrackRecordingConfig>;
  private callbacks = new Set<MultiTrackEventCallback>();
  private disposed = false;

  constructor(config: TrackRecordingConfig = {}) {
    const qualityPresets = {
      low: { audio: 64000, video: 1000000 },
      medium: { audio: 128000, video: 2500000 },
      high: { audio: 256000, video: 5000000 },
      custom: {
        audio: config.audioBitsPerSecond ?? 128000,
        video: config.videoBitsPerSecond ?? 2500000,
      },
    };

    const preset = qualityPresets[config.quality || 'medium'];
    const mimeType = config.mimeType ?? getSupportedMimeType(true);

    if (!mimeType) {
      throw this.createError(
        'No supported MIME type available', 
        'MIME_TYPE_NOT_SUPPORTED'
      );
    }

    this.config = {
      quality: config.quality ?? 'medium',
      audioBitsPerSecond: config.audioBitsPerSecond ?? preset.audio,
      videoBitsPerSecond: config.videoBitsPerSecond ?? preset.video,
      timeslice: config.timeslice ?? 1000,
      mimeType,
    };

  }

  // start a new recording session
  startSession(sessionId: string): void {
    this.assertNotDisposed();

    if (this.session) throw this.createError('Session already active', 'ALREADY_RECORDING');

    this.session = {
      sessionId,
      participantTracks: new Map(),
      startTime: Date.now(),
      status: 'idle',
    };

    this.emit({
      type: 'session-started',
      sessionId,
      timestamp: Date.now(),
    });
  }

  // add host's local tracks to recording
  async addHostTracks(stream: MediaStream, hostId: string, hostName?: string): Promise<void> {
    this.assertSession();

    const audioTrack = stream.getAudioTracks()[0];
    const videoTrack = stream.getVideoTracks()[0];

    if (audioTrack) {
      await this.addTrack(hostId, hostName || 'Host', audioTrack, 'audio');
    }

    if (videoTrack) {
      await this.addTrack(hostId, hostName || 'Host', videoTrack, 'video');
    }

    this.emit({
      type: 'participant-added',
      sessionId: this.session!.sessionId,
      participantId: hostId,
      data: { name: hostName, isHost: true },
      timestamp: Date.now(),
    });
  }

  // add remote peer's tracks to recording
  async addPeerTracks(peer: RemotePeer): Promise<void> {
    this.assertSession();

    if (!peer.stream) {
      throw this.createError(
        `No stream available for peer ${peer.id}`,
        'STREAM_UNAVAILABLE'
      );
    }

    const audioTrack = peer.stream.getAudioTracks()[0];
    const videoTrack = peer.stream.getVideoTracks()[0];

    if (audioTrack) {
      await this.addTrack(peer.id, peer.userName || peer.userId, audioTrack, 'audio');
    }

    if (videoTrack) {
      await this.addTrack(peer.id, peer.userName || peer.userId, videoTrack, 'video');
    }

    this.emit({
      type: 'participant-added',
      sessionId: this.session!.sessionId,
      participantId: peer.id,
      data: { name: peer.userName, userId: peer.userId },
      timestamp: Date.now(),
    });
  }

  // start recording all tracks
  async startRecording(): Promise<void> {
    this.assertSession();


    if (this.session!.status === 'recording') {
      throw this.createError('Already recording', 'ALREADY_RECORDING');
    }

    const allTracks = this.getAllTracks();

    if (allTracks.length === 0) {
      throw this.createError('No tracks to record', 'INVALID_STATE');
    }

    // Start recording each track
    for (const track of allTracks) {
      await this.startTrackRecording(track);
    }

    this.session!.status = 'recording';
    this.session!.startTime = Date.now();
  }

  // pause all recordings
  pauseRecording(): void {
    this.assertSession();

    if (this.session!.status !== 'recording') {
      throw this.createError('Not currently recording', 'NOT_RECORDING');
    }

    const allTracks = this.getAllTracks();

    for (const track of allTracks) {
      if (track.recorder && track.status === 'recording') {
        track.recorder.pause();
        track.status = 'paused';
      }
    }

    this.session!.status = 'paused';
  }

  // resume all recordings
  resumeRecording(): void {
    this.assertSession();

    if (this.session!.status !== 'paused') {
      throw this.createError('Not currently paused', 'INVALID_STATE');
    }

    const allTracks = this.getAllTracks();

    for (const track of allTracks) {
      if (track.recorder && track.status === 'paused') {
        track.recorder!.resume();
        track.status = 'recording';
      }
    }

    this.session!.status = 'recording';
  }

  // stop recording and finalize all tracks
  async stopRecording(): Promise<Map<string, Blob[]>> {
    this.assertSession();

    const allTracks = this.getAllTracks();
    const results = new Map<string, Blob[]>();

    // stop all track recordings
    const stopPromises = allTracks.map((track) => this.stopTrackRecording(track));
    await Promise.all(stopPromises);

    // organize results by participant
    this.session!.participantTracks.forEach((tracks, participantId) => {
      const blobs = tracks.map((track) => {
        const blob = new Blob(track.chunks, { type: this.config.mimeType });
        return blob;
      });
      results.set(participantId, blobs);
    });

    this.session!.status = 'stopped';
    this.session!.endTime = Date.now();

    this.emit({
      type: 'session-stopped',
      sessionId: this.session!.sessionId,
      data: { participantCount: results.size },
      timestamp: Date.now(),
    });

    return results;
  }

  // remove participant and stop their tracks
  async removeParticipant(participantId: string): Promise<void> {
    this.assertSession();

    const tracks = this.session!.participantTracks.get(participantId);
    if (!tracks) return;

    // stop all tracks for this participant
    for (const track of tracks) {
      if (track.status === 'recording') {
        await this.stopTrackRecording(track);
      }
    }

    this.session!.participantTracks.delete(participantId);

    this.emit({
      type: 'participant-removed',
      sessionId: this.session!.sessionId,
      participantId,
      timestamp: Date.now(),
    });
  }

  // get current session info
  getSession(): RecordingSession | null {
    return this.session ? { ...this.session } : null;
  }

  // get tracks for specific participant
  getParticipantTracks(participantId: string): ParticipantTrack[] {
    return this.session?.participantTracks.get(participantId) || [];
  }

  // get all participant IDs in session
  getParticipants(): string[] {
    return this.session ? Array.from(this.session.participantTracks.keys()) : [];
  }

  // subscribe to events
  on(callback: MultiTrackEventCallback): () => void {
    this.callbacks.add(callback);
    return () => this.callbacks.delete(callback);
  }

  // cleanup and dispose
  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;

    if (this.session) {
      const allTracks = this.getAllTracks();
      allTracks.forEach((track) => {
        if (track.recorder && track.status === 'recording') {
          track.recorder.stop();
        }
      });
    }

    this.callbacks.clear();
    this.session = null;
  }

  // private methods

  private async addTrack(
    participantId: string,
    participantName: string,
    track: MediaStreamTrack,
    type: 'audio' | 'video'
  ): Promise<void> {
    const participantTrack: ParticipantTrack = {
      participantId,
      participantName,
      trackId: track.id,
      type,
      track,
      recorder: null,
      chunks: [],
      size: 0,
      startTime: 0,
      duration: 0,
      status: 'idle',
    };

    if (!this.session!.participantTracks.has(participantId)) {
      this.session!.participantTracks.set(participantId, []);
    }

    this.session!.participantTracks.get(participantId)!.push(participantTrack);
  }

  private async startTrackRecording(track: ParticipantTrack): Promise<void> {
    try {
      // create a new media stream with single track
      const stream = new MediaStream([track.track]);

      const options: MediaRecorderOptions = {
        mimeType: this.config.mimeType,
      };

      if (track.type === 'audio') {
        options.audioBitsPerSecond = this.config.audioBitsPerSecond;
      } else {
        options.videoBitsPerSecond = this.config.videoBitsPerSecond;
      }

      const recorder = new MediaRecorder(stream, options);

      // setup handlers
      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          track.chunks.push(event.data);
          track.size += event.data.size;

          this.emit({
            type: 'track-data-available',
            sessionId: this.session!.sessionId,
            participantId: track.participantId,
            trackId: track.trackId,
            data: { size: event.data.size, totalSize: track.size },
            timestamp: Date.now(),
          });
        }
      };

      recorder.onerror = (event) => {
        track.status = 'error';
        track.error = new Error('MediaRecorder error');

        this.emit({
          type: 'track-error',
          sessionId: this.session!.sessionId,
          participantId: track.participantId,
          trackId: track.trackId,
          data: event,
          timestamp: Date.now(),
        });
      };

      // start recording
      recorder.start(this.config.timeslice);
      track.recorder = recorder;
      track.status = 'recording';
      track.startTime = Date.now();

      this.emit({
        type: 'track-started',
        sessionId: this.session!.sessionId,
        participantId: track.participantId,
        trackId: track.trackId,
        data: { type: track.type },
        timestamp: Date.now(),
      });
    } catch (error) {
      track.status = 'error';
      track.error = error as Error;
      throw this.createError(
        `Failed to start track recording: ${(error as Error).message}`,
        'RECORDING_FAILED'
      );
    }
  }

  private async stopTrackRecording(track: ParticipantTrack): Promise<void> {
    if (!track.recorder || track.status === 'stopped') return;

    return new Promise((resolve) => {
      track.recorder!.onstop = () => {
        track.status = 'stopped';
        track.endTime = Date.now();
        track.duration = Math.floor((track.endTime - track.startTime) / 1000);

        this.emit({
          type: 'track-stopped',
          sessionId: this.session!.sessionId,
          participantId: track.participantId,
          trackId: track.trackId,
          data: {
            duration: track.duration,
            size: track.size,
            chunks: track.chunks.length,
          },
          timestamp: Date.now(),
        });

        resolve();
      };

      track.recorder!.stop();
    });
  }

  private getAllTracks(): ParticipantTrack[] {
    if (!this.session) return [];

    const allTracks: ParticipantTrack[] = [];
    this.session.participantTracks.forEach((tracks) => {
      allTracks.push(...tracks);
    });

    return allTracks;
  }

  private emit(event: MultiTrackEvent): void {
    this.callbacks.forEach((callback) => {
      try {
        callback(event);
      } catch (error) {
        console.error('Error in multi-track event callback:', error);
      }
    });
  }

  private assertSession(): void {
    if (!this.session) {
      throw this.createError('No active session', 'INVALID_STATE');
    }
  }

  private assertNotDisposed(): void {
    if (this.disposed) {
      throw this.createError('MultiTrackRecorder disposed', 'INVALID_STATE');
    }
  }

  private createError(message: string, code: RecordingErrorCode): RecordingError {
    const error = new Error(message) as RecordingError;
    error.name = 'RecordingError';
    error.code = code;
    return error;
  }
}


/*
TODO :
it may have following limitations:
- streaming to disk / worker
- server-side ingestion
- very long recordings (> tens of minutes)

correct way to support long recordings (> 1 hour)

must add one of these architectures:

- live server ingestion
    - stream chunks to backend as they arrive
    - persist and release memory continuously

- disk-backed client recording
    - opfs / indexeddb + worker
    - periodic compactio
    - browser-specific code paths

- hybrid
    - local buffering + rolling upload
    - checkpointing and resume
*/
import type {
    PeerConfig,
    RemotePeer,
    PeerConnectionState,
    SignalingMessage,
    PeerEventCallback,
    PeerEvent,
    PeerConnectionError,
    PeerErrorCode,
    PeerStats,
  } from './peer-types';
  
  export class PeerConnectionManager {
    private peers = new Map<string, RemotePeer>();
    private config: Required<PeerConfig>;
    private callbacks = new Set<PeerEventCallback>();
    private statsIntervals = new Map<string, ReturnType<typeof setInterval>>();
    private disposed = false;
    private pendingIce = new Map<string, RTCIceCandidateInit[]>();   // a map storing candidates that arrived before the peer's connection was ready
  
    constructor(config: Partial<PeerConfig> = {}) {
      this.config = {
        iceServers: config.iceServers ?? [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
        ],
        dataChannel: config.dataChannel ?? true,
        audioConstraints: config.audioConstraints ?? {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        videoConstraints: config.videoConstraints ?? {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 },
        },
      };
    }
  
    // create a new peer connection
    async createPeerConnection(
      peerId: string,
      userId: string,
      userName?: string
    ): Promise<RemotePeer> {
      this.assertNotDisposed();
  
      if (this.peers.has(peerId)) {
        throw this.createError('Peer already exists', 'INVALID_STATE', peerId);
      }
  
      try {
        const connection = new RTCPeerConnection({
          iceServers: this.config.iceServers,
          iceCandidatePoolSize: 10,   // tells the browser how many ice candidates to gather in advance before you actually start negotiating a connection. can affect connection setup speed and resource usage
        });
  
        const peer: RemotePeer = {
          id: peerId,
          userId,
          userName,
          connection,
          stream: null,
          dataChannel: null,
          connectionState: connection.connectionState as PeerConnectionState,
          signalingState: connection.signalingState,
          audioTrack: null,
          videoTrack: null,
          connected: false,
          joinedAt: new Date(),
        };
  
        // setup event handlers
        this.setupConnectionHandlers(peer);
  
        // create data channel if enabled
        if (this.config.dataChannel) {
          peer.dataChannel = connection.createDataChannel('messaging', {
            ordered: true,
          });
          this.setupDataChannelHandlers(peer);
        }
  
        this.peers.set(peerId, peer);
  
        this.emit({
          type: 'peer-connecting',
          peerId,
          timestamp: Date.now(),
        });
  
        return peer;
      } catch (error) {
        throw this.createError(
          `Failed to create peer connection: ${(error as Error).message}`,
          'CONNECTION_FAILED',
          peerId,
          error as Error
        );
      }
    }
  
   // create and send offer to remote peer
    async createOffer(peerId: string): Promise<RTCSessionDescriptionInit> {
      const peer = this.getPeer(peerId);
  
      try {
        const offer = await peer.connection.createOffer({
          offerToReceiveAudio: true,
          offerToReceiveVideo: true,
        });
  
        await peer.connection.setLocalDescription(offer);
  
        return offer;
      } catch (error) {
        throw this.createError(
          `Failed to create offer: ${(error as Error).message}`,
          'SIGNALING_FAILED',
          peerId,
          error as Error
        );
      }
    }
  
    // handle received offer and create answer
    async handleOffer(
      peerId: string,
      offer: RTCSessionDescriptionInit
    ): Promise<RTCSessionDescriptionInit> {
      const peer = this.getPeer(peerId);
  
      try {
        await peer.connection.setRemoteDescription(
          new RTCSessionDescription(offer)
        );
        await this.flushIce(peerId);
  
        const answer = await peer.connection.createAnswer();
        await peer.connection.setLocalDescription(answer);
  
        return answer;
      } catch (error) {
        throw this.createError(
          `Failed to handle offer: ${(error as Error).message}`,
          'SIGNALING_FAILED',
          peerId,
          error as Error
        );
      }
    }
  
    // handle received answer
    async handleAnswer(peerId: string, answer: RTCSessionDescriptionInit): Promise<void> {
      const peer = this.getPeer(peerId);
    
      try {
        await peer.connection.setRemoteDescription(new RTCSessionDescription(answer));
        await this.flushIce(peerId);
      } catch (error) {
        throw this.createError(
          `Failed to handle answer: ${(error as Error).message}`,
          'SIGNALING_FAILED',
          peerId,
          error as Error
        );
      }
    }
  
    // add ICE candidate
    async addIceCandidate(
      peerId: string,
      candidate: RTCIceCandidateInit
    ): Promise<void> {
      const peer = this.getPeer(peerId);
  
      try {
        await peer.connection.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (error) {
        // ICE candidates can fail silently in some cases
        console.warn(`Failed to add ICE candidate for peer ${peerId}:`, error);
      }
    }

    // apply all buffered ICE candidates to a peer's connection once it's ready
    private async flushIce(peerId: string): Promise<void> {
      const peer = this.getPeer(peerId);
      const buffered = this.pendingIce.get(peerId);
      if (!buffered) return;
  
      for (const c of buffered) {
        await peer.connection.addIceCandidate(c);
      }
  
      this.pendingIce.delete(peerId);
    }
  
    // add local stream to peer connection (for sending)
    async addLocalStream(peerId: string, stream: MediaStream): Promise<void> {
      const peer = this.getPeer(peerId);
  
      try {
        stream.getTracks().forEach((track) => {
          peer.connection.addTrack(track, stream);
        });
      } catch (error) {
        throw this.createError(
          `Failed to add local stream: ${(error as Error).message}`,
          'STREAM_UNAVAILABLE',
          peerId,
          error as Error
        );
      }
    }
  
    // get remote stream from peer
    getRemoteStream(peerId: string): MediaStream | null {
      const peer = this.peers.get(peerId);
      return peer?.stream || null;
    }
  
    // get all connected peers
    getConnectedPeers(): RemotePeer[] {
      return Array.from(this.peers.values()).filter((p) => p.connected);
    }
  
    // get peer by ID
    getPeerInfo(peerId: string): RemotePeer | undefined {
      return this.peers.get(peerId);
    }
  
    // send message via data channel
    sendMessage(peerId: string, message: any): void {
      const peer = this.getPeer(peerId);
  
      if (!peer.dataChannel || peer.dataChannel.readyState !== 'open') {
        throw this.createError(
          'Data channel not available',
          'DATA_CHANNEL_FAILED',
          peerId
        );
      }
  
      try {
        peer.dataChannel.send(JSON.stringify(message));
      } catch (error) {
        throw this.createError(
          `Failed to send message: ${(error as Error).message}`,
          'DATA_CHANNEL_FAILED',
          peerId,
          error as Error
        );
      }
    }
  
    // broadcast message to all connected peers
    broadcast(message: any): void {
      this.getConnectedPeers().forEach((peer) => {
        try {
          this.sendMessage(peer.id, message);
        } catch (error) {
          console.error(`Failed to broadcast to peer ${peer.id}:`, error);
        }
      });
    }
  
    // close peer connection
    closePeerConnection(peerId: string): void {
      const peer = this.peers.get(peerId);
      if (!peer) return;
  
      // stop stats collection
      const statsInterval = this.statsIntervals.get(peerId);
      if (statsInterval) {
        clearInterval(statsInterval);
        this.statsIntervals.delete(peerId);
      }
  
      // close data channel
      if (peer.dataChannel) {
        peer.dataChannel.close();
      }
  
      // stop tracks
      if (peer.stream) {
        peer.stream.getTracks().forEach((track) => track.stop());
      }
  
      // close connection
      peer.connection.close();
  
      this.peers.delete(peerId);
  
      this.emit({
        type: 'peer-disconnected',
        peerId,
        timestamp: Date.now(),
      });
    }
  
    // get connection stats for peer
    async getStats(peerId: string): Promise<PeerStats | null> {
      const peer = this.peers.get(peerId);
      if (!peer) return null;
  
      try {
        const stats = await peer.connection.getStats();
        const parsedStats: Partial<PeerStats> = {
          bytesReceived: 0,
          bytesSent: 0,
          packetsLost: 0,
          audioLevel: 0,
          videoFrameRate: 0,
          roundTripTime: 0,
          jitter: 0,
        };
  
        stats.forEach((report) => {
          if (report.type === 'inbound-rtp') {
            parsedStats.bytesReceived = report.bytesReceived || 0;
            parsedStats.packetsLost = report.packetsLost || 0;
            parsedStats.jitter = report.jitter || 0;
          } else if (report.type === 'outbound-rtp') {
            parsedStats.bytesSent = report.bytesSent || 0;
          } else if (report.type === 'candidate-pair' && report.state === 'succeeded') {
            parsedStats.roundTripTime = report.currentRoundTripTime || 0;
          } else if (report.type === 'track' && report.kind === 'video') {
            parsedStats.videoFrameRate = report.framesPerSecond || 0;
          } else if (report.type === 'track' && report.kind === 'audio') {
            parsedStats.audioLevel = report.audioLevel || 0;
          }
        });
  
        return parsedStats as PeerStats;
      } catch (error) {
        console.error(`Failed to get stats for peer ${peerId}:`, error);
        return null;
      }
    }
  
    // subscribe to peer events
    on(callback: PeerEventCallback): () => void {
      this.callbacks.add(callback);
      return () => this.callbacks.delete(callback);
    }
  
    // cleanup all connections
    dispose(): void {
      if (this.disposed) return;
      this.disposed = true;
  
      // close all peer connections
      this.peers.forEach((peer) => {
        this.closePeerConnection(peer.id);
      });
  
      this.peers.clear();
      this.callbacks.clear();
      this.statsIntervals.clear();
    }
  
    // private methods
  
    private setupConnectionHandlers(peer: RemotePeer): void {
      const { connection } = peer;
  
      // ice candidate handler
      connection.onicecandidate = (event) => {
        if (event.candidate) {
          this.emit({
            type: 'ice-candidate',
            peerId: peer.id,
            data: event.candidate.toJSON(),
            timestamp: Date.now(),
          });
        }
      };
  
      // track handler (receiving remote media)
      connection.ontrack = (event) => {
        console.log(`Received track from peer ${peer.id}:`, event.track.kind);
  
        if (!peer.stream) {
          peer.stream = new MediaStream();
        }
  
        peer.stream.addTrack(event.track);
  
        if (event.track.kind === 'audio') {
          peer.audioTrack = event.track;
        } else if (event.track.kind === 'video') {
          peer.videoTrack = event.track;
        }
  
        this.emit({
          type: 'stream-added',
          peerId: peer.id,
          data: { track: event.track, stream: peer.stream },
          timestamp: Date.now(),
        });
      };
  
      // connection state handler
      connection.onconnectionstatechange = () => {
        const state = connection.connectionState as PeerConnectionState;
        peer.connectionState = state;
  
        console.log(`Peer ${peer.id} connection state:`, state);
  
        if (state === 'connected') {
          peer.connected = true;
          this.startStatsCollection(peer.id);
          this.emit({
            type: 'peer-connected',
            peerId: peer.id,
            timestamp: Date.now(),
          });
        } else if (state === 'disconnected' || state === 'failed') {
          peer.connected = false;
          this.emit({
            type: state === 'failed' ? 'peer-failed' : 'peer-disconnected',
            peerId: peer.id,
            timestamp: Date.now(),
          });
        }
  
        this.emit({
          type: 'connection-state-changed',
          peerId: peer.id,
          data: state,
          timestamp: Date.now(),
        });
      };
  
      // ice connection state handler
      connection.oniceconnectionstatechange = () => {
        console.log(
          `Peer ${peer.id} ICE connection state:`,
          connection.iceConnectionState
        );
      };
  
      // signaling state handler
      connection.onsignalingstatechange = () => {
        peer.signalingState = connection.signalingState;
        console.log(`Peer ${peer.id} signaling state:`, connection.signalingState);
      };
  
      // data channel handler (receiving)
      connection.ondatachannel = (event) => {
        if (!peer.dataChannel) {
          peer.dataChannel = event.channel;
          this.setupDataChannelHandlers(peer);
        }
      };
    }
  
    private setupDataChannelHandlers(peer: RemotePeer): void {
      if (!peer.dataChannel) return;
  
      peer.dataChannel.onopen = () => {
        console.log(`Data channel opened for peer ${peer.id}`);
      };
  
      peer.dataChannel.onclose = () => {
        console.log(`Data channel closed for peer ${peer.id}`);
      };
  
      peer.dataChannel.onerror = (error) => {
        console.error(`Data channel error for peer ${peer.id}:`, error);
      };
  
      peer.dataChannel.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          this.emit({
            type: 'data-channel-message',
            peerId: peer.id,
            data: message,
            timestamp: Date.now(),
          });
        } catch (error) {
          console.error(`Failed to parse data channel message:`, error);
        }
      };
    }
  
    private startStatsCollection(peerId: string): void {
      const interval = setInterval(async () => {
        const stats = await this.getStats(peerId);
        if (stats) {
          const peer = this.peers.get(peerId);
          if (peer) {
            peer.stats = stats;
            this.emit({
              type: 'stats-updated',
              peerId,
              data: stats,
              timestamp: Date.now(),
            });
          }
        }
      }, 1000); // update every second
  
      this.statsIntervals.set(peerId, interval);
    }
  
    private getPeer(peerId: string): RemotePeer {
      const peer = this.peers.get(peerId);
      if (!peer) {
        throw this.createError('Peer not found', 'INVALID_STATE', peerId);
      }
      return peer;
    }
  
    private emit(event: PeerEvent): void {
      this.callbacks.forEach((callback) => {
        try {
          callback(event);
        } catch (error) {
          console.error('Error in peer event callback:', error);
        }
      });
    }
  
    private createError(
      message: string,
      code: PeerErrorCode,
      peerId?: string,
      originalError?: Error
    ): PeerConnectionError {
      const error = new Error(message) as PeerConnectionError;
      error.name = 'PeerConnectionError';
      error.code = code;
      error.peerId = peerId;
      error.originalError = originalError;
      return error;
    }
  
    private assertNotDisposed(): void {
      if (this.disposed) {
        throw this.createError('PeerConnectionManager disposed', 'INVALID_STATE');
      }
    }
  }
  
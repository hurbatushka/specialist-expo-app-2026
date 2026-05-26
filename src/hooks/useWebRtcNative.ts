import { useEffect, useRef, useState, type MutableRefObject } from 'react';
import { AppState, NativeModules, type AppStateStatus } from 'react-native';

import { getApiUrl } from '@/lib/api';

type IceCandidateJSON = {
  candidate?: string | null;
  sdpMLineIndex?: number | null;
  sdpMid?: string | null;
};

type MediaStreamLike = {
  toURL: () => string;
  getTracks: () => Array<{ id: string }>;
  addTrack: (track: unknown) => void;
  getVideoTracks: () => Array<{ id: string }>;
};

export type WebRtcSignalPayload = {
  type: 'offer' | 'answer' | 'ice-candidate' | 'ready' | 'joining';
  sdp?: string;
  candidate?: IceCandidateJSON | null;
  peerId: string;
};

const RTC_CONFIG = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

/**
 * WebRTC 1:1 как в web `useWebRTC.ts`: сигналы через POST + опрос signal-poll (без EventSource).
 */
export function useWebRtcNative(
  formattedSlug: string,
  localStream: MediaStreamLike | null,
  isActive: boolean,
  signalHandlerRef: MutableRefObject<((s: WebRtcSignalPayload) => void) | null>,
  onSseReopenRef: MutableRefObject<(() => void) | null>
): {
  remoteStream: MediaStreamLike | null;
  connectionState: string;
} {
  const [remoteStream, setRemoteStream] = useState<MediaStreamLike | null>(null);
  const [connectionState, setConnectionState] = useState('new');

  const localStreamRef = useRef(localStream);
  localStreamRef.current = localStream;

  const pcRef = useRef<{
    close: () => void;
    getSenders: () => Array<{ track?: { id: string } }>;
    addTrack: (track: unknown, stream: MediaStreamLike) => void;
    createOffer: (opts?: { iceRestart?: boolean }) => Promise<unknown>;
    setLocalDescription: (desc: unknown) => Promise<void>;
    localDescription?: { sdp?: string };
    remoteDescription?: unknown;
    addIceCandidate: (candidate: unknown) => Promise<void>;
    setRemoteDescription: (desc: unknown) => Promise<void>;
    createAnswer: () => Promise<unknown>;
    connectionState: string;
    iceConnectionState: string;
    signalingState: string;
    addEventListener: (type: string, listener: (...args: unknown[]) => void) => void;
    removeEventListener: (type: string, listener: (...args: unknown[]) => void) => void;
  } | null>(null);
  const peerIdRef = useRef(Math.random().toString(36).slice(2) + Date.now().toString(36));
  const makingOfferRef = useRef(false);
  const pendingIceRef = useRef<IceCandidateJSON[]>([]);
  const lastOfferTimeRef = useRef(-1);
  const OFFER_RETRY_MS = 1800;

  const isOffererFor = (otherPeerId: string) => peerIdRef.current < otherPeerId;

  useEffect(() => {
    if (!isActive) return;
    const nativeModuleExists = (NativeModules as Record<string, unknown>).WebRTCModule != null;
    if (!nativeModuleExists) {
      setConnectionState('unsupported');
      setRemoteStream(null);
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const webrtc = require('react-native-webrtc') as {
      MediaStream: new (...args: unknown[]) => MediaStreamLike;
      RTCIceCandidate: new (candidate: unknown) => unknown;
      RTCPeerConnection: new (config: unknown) => {
        close: () => void;
        getSenders: () => Array<{ track?: { id: string } }>;
        addTrack: (track: unknown, stream: MediaStreamLike) => void;
        createOffer: (opts?: { iceRestart?: boolean }) => Promise<unknown>;
        setLocalDescription: (desc: unknown) => Promise<void>;
        localDescription?: { sdp?: string };
        remoteDescription?: unknown;
        addIceCandidate: (candidate: unknown) => Promise<void>;
        setRemoteDescription: (desc: unknown) => Promise<void>;
        createAnswer: () => Promise<unknown>;
        connectionState: string;
        iceConnectionState: string;
        signalingState: string;
        addEventListener: (type: string, listener: (...args: unknown[]) => void) => void;
        removeEventListener: (type: string, listener: (...args: unknown[]) => void) => void;
      };
      RTCSessionDescription: new (desc: unknown) => unknown;
    };

    let destroyed = false;
    const peerId = peerIdRef.current;
    const pc = new webrtc.RTCPeerConnection(RTC_CONFIG);
    pcRef.current = pc;

    const remote = new webrtc.MediaStream();
    setRemoteStream(remote);

    const applyLocalTracks = () => {
      const stream = localStreamRef.current;
      if (!stream) return;
      const senders = pc.getSenders();
      stream.getTracks().forEach((track) => {
        if (!senders.some((s) => s.track?.id === track.id)) {
          try {
            pc.addTrack(track, stream);
          } catch {
            /* noop */
          }
        }
      });
    };
    applyLocalTracks();

    const onTrack = (e: { track: { id: string } }) => {
      const existing = remote.getTracks().find((t) => t.id === e.track.id);
      if (!existing) {
        remote.addTrack(e.track);
        setRemoteStream(new webrtc.MediaStream(remote.getTracks()));
      }
    };
    const pcEv = pc;
    pcEv.addEventListener('track', onTrack as (...args: unknown[]) => void);

    async function sendSignal(signal: WebRtcSignalPayload) {
      try {
        await fetch(getApiUrl(`/online/room/${formattedSlug}/signal`), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(signal),
        });
      } catch (err) {
        console.warn('[WebRTC native] sendSignal failed:', err);
      }
    }

    const onIceCandidate = (e: { candidate: { toJSON: () => IceCandidateJSON } | null }) => {
      if (e.candidate) {
        void sendSignal({
          type: 'ice-candidate',
          candidate: e.candidate.toJSON(),
          peerId,
        });
      }
    };
    pcEv.addEventListener('icecandidate', onIceCandidate as (...args: unknown[]) => void);

    async function flushIceCandidates() {
      const pending = pendingIceRef.current;
      pendingIceRef.current = [];
      for (const c of pending) {
        try {
          if (c.candidate == null && !c.sdpMid && c.sdpMLineIndex == null) continue;
          await pc.addIceCandidate(
            new webrtc.RTCIceCandidate({
              candidate: c.candidate ?? '',
              sdpMLineIndex: c.sdpMLineIndex ?? undefined,
              sdpMid: c.sdpMid ?? undefined,
            })
          );
        } catch {
          /* noop */
        }
      }
    }

    async function addIceCandidateSafe(candidate: IceCandidateJSON) {
      if (pc.remoteDescription) {
        try {
          await pc.addIceCandidate(
            new webrtc.RTCIceCandidate({
              candidate: candidate.candidate ?? '',
              sdpMLineIndex: candidate.sdpMLineIndex ?? undefined,
              sdpMid: candidate.sdpMid ?? undefined,
            })
          );
        } catch {
          pendingIceRef.current.push(candidate);
        }
      } else {
        pendingIceRef.current.push(candidate);
      }
    }

    async function createOffer(iceRestart = false) {
      if (makingOfferRef.current) return;
      makingOfferRef.current = true;
      lastOfferTimeRef.current = Date.now();
      try {
        const offer = await pc.createOffer({ iceRestart });
        await pc.setLocalDescription(offer);
        await sendSignal({
          type: 'offer',
          sdp: pc.localDescription?.sdp,
          peerId,
        });
      } catch (e) {
        console.warn('[WebRTC native] createOffer:', e);
      } finally {
        makingOfferRef.current = false;
      }
    }

    const pingSignaling = () => {
      void sendSignal({ type: 'joining', peerId });
      void sendSignal({ type: 'ready', peerId });
    };

    const seenSignalFp = new Set<string>();
    function isDuplicateSignal(signal: WebRtcSignalPayload): boolean {
      if (signal.type === 'offer' || signal.type === 'answer') {
        const k = `${signal.type}:${signal.peerId}:${signal.sdp ?? ''}`;
        if (seenSignalFp.has(k)) return true;
        seenSignalFp.add(k);
        if (seenSignalFp.size > 400) seenSignalFp.clear();
        return false;
      }
      if (signal.type === 'ice-candidate' && signal.candidate) {
        const c = signal.candidate;
        const k = `ice:${signal.peerId}:${c.candidate ?? ''}:${c.sdpMLineIndex ?? 0}:${c.sdpMid ?? ''}`;
        if (seenSignalFp.has(k)) return true;
        seenSignalFp.add(k);
        if (seenSignalFp.size > 600) seenSignalFp.clear();
        return false;
      }
      return false;
    }

    const onIncomingSignal = (signal: WebRtcSignalPayload) => {
      void (async () => {
        if (destroyed) return;
        try {
          if (signal.peerId === peerId) return;
          if (isDuplicateSignal(signal)) return;

          switch (signal.type) {
            case 'joining':
              if (!isOffererFor(signal.peerId)) break;
              if (pc.connectionState === 'connected') break;
              if (
                pc.signalingState === 'have-local-offer' &&
                pc.localDescription?.sdp
              ) {
                await sendSignal({
                  type: 'offer',
                  sdp: pc.localDescription.sdp,
                  peerId,
                });
              } else if (pc.signalingState === 'stable') {
                lastOfferTimeRef.current = -1;
                await createOffer(false);
              }
              break;

            case 'ready':
              if (isOffererFor(signal.peerId) && pc.connectionState !== 'connected') {
                const now = Date.now();
                const prev = lastOfferTimeRef.current;
                if (prev < 0 || now - prev > OFFER_RETRY_MS) {
                  await createOffer(false);
                }
              }
              break;

            case 'offer':
              if (isOffererFor(signal.peerId)) break;
              if (!signal.sdp) break;
              await pc.setRemoteDescription(new webrtc.RTCSessionDescription({ type: 'offer', sdp: signal.sdp }));
              await flushIceCandidates();
              const answer = await pc.createAnswer();
              await pc.setLocalDescription(answer);
              await sendSignal({
                type: 'answer',
                sdp: pc.localDescription?.sdp,
                peerId,
              });
              break;

            case 'answer':
              if (!isOffererFor(signal.peerId)) break;
              if (!signal.sdp) break;
              await pc.setRemoteDescription(new webrtc.RTCSessionDescription({ type: 'answer', sdp: signal.sdp }));
              await flushIceCandidates();
              break;

            case 'ice-candidate':
              if (signal.candidate) {
                await addIceCandidateSafe(signal.candidate);
              }
              break;
          }
        } catch (err) {
          console.warn('[WebRTC native] signal handler:', err);
        }
      })();
    };

    signalHandlerRef.current = onIncomingSignal;
    onSseReopenRef.current = () => {
      if (destroyed || pc.connectionState === 'connected') return;
      pingSignaling();
    };

    const readyIntervalId = setInterval(() => {
      if (pc.connectionState === 'connected') return;
      void sendSignal({ type: 'ready', peerId });
    }, 450);

    const joiningIntervalId = setInterval(() => {
      if (pc.connectionState === 'connected') return;
      void sendSignal({ type: 'joining', peerId });
    }, 1500);

    const offerResendIntervalId = setInterval(() => {
      if (pc.connectionState === 'connected') return;
      if (pc.signalingState !== 'have-local-offer' || !pc.localDescription?.sdp) return;
      void sendSignal({
        type: 'offer',
        sdp: pc.localDescription.sdp,
        peerId,
      });
    }, 2500);

    const trackIntervalId = setInterval(() => {
      if (pc.connectionState === 'connected') return;
      applyLocalTracks();
    }, 800);

    let lastPollAfter = BigInt(0);
    const pollFromDb = async () => {
      if (destroyed || pc.connectionState === 'connected') return;
      try {
        const res = await fetch(
          getApiUrl(`/online/room/${formattedSlug}/signal-poll?after=${lastPollAfter}`),
          { cache: 'no-store' }
        );
        if (!res.ok) return;
        const data = (await res.json()) as {
          signals: Array<{
            id: string;
            type: string;
            peerId: string;
            sdp?: string;
            candidate?: IceCandidateJSON | null;
          }>;
          nextAfter: string;
        };
        for (const row of data.signals) {
          if (!row.type || !row.peerId) continue;
          onIncomingSignal({
            type: row.type as WebRtcSignalPayload['type'],
            peerId: row.peerId,
            sdp: row.sdp,
            candidate: row.candidate ?? undefined,
          });
        }
        if (data.signals.length > 0) {
          lastPollAfter = BigInt(data.nextAfter);
        }
      } catch {
        /* noop */
      }
    };
    const pollIntervalId = setInterval(() => {
      void pollFromDb();
    }, 900);
    void pollFromDb();

    const onAppState = (s: AppStateStatus) => {
      if (destroyed || pc.connectionState === 'connected') return;
      if (s === 'active') pingSignaling();
    };
    const sub = AppState.addEventListener('change', onAppState);

    const onConnState = () => {
      setConnectionState(pc.connectionState);
      if (pc.connectionState === 'connected') {
        clearInterval(readyIntervalId);
        clearInterval(joiningIntervalId);
        clearInterval(offerResendIntervalId);
        clearInterval(pollIntervalId);
      }
      if (pc.connectionState === 'failed') void createOffer(true);
    };
    pcEv.addEventListener('connectionstatechange', onConnState as (...args: unknown[]) => void);

    const onIceConnState = () => {
      if (pc.iceConnectionState === 'disconnected') {
        setTimeout(() => {
          if (pc.connectionState === 'disconnected') void createOffer(true);
        }, 3000);
      }
    };
    pcEv.addEventListener('iceconnectionstatechange', onIceConnState as (...args: unknown[]) => void);

    pingSignaling();

    return () => {
      destroyed = true;
      sub.remove();
      pcEv.removeEventListener('track', onTrack as (...args: unknown[]) => void);
      pcEv.removeEventListener('icecandidate', onIceCandidate as (...args: unknown[]) => void);
      pcEv.removeEventListener('connectionstatechange', onConnState as (...args: unknown[]) => void);
      pcEv.removeEventListener('iceconnectionstatechange', onIceConnState as (...args: unknown[]) => void);
      onSseReopenRef.current = null;
      clearInterval(readyIntervalId);
      clearInterval(joiningIntervalId);
      clearInterval(offerResendIntervalId);
      clearInterval(pollIntervalId);
      clearInterval(trackIntervalId);
      pc.close();
      pcRef.current = null;
      setRemoteStream(null);
      setConnectionState('new');
    };
  }, [isActive, formattedSlug, signalHandlerRef, onSseReopenRef]);

  return { remoteStream, connectionState };
}

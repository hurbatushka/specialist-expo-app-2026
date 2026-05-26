import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState, type ComponentType } from 'react';
import {
  ActivityIndicator,
  NativeModules,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Modal } from '@/components/ui/Modal';
import { useWebRtcNative, type WebRtcSignalPayload } from '@/hooks/useWebRtcNative';
import { useAuth } from '@/contexts/auth-context';
import { fetchWithAuth, getApiUrl } from '@/lib/api';
import { Fonts } from '@/constants/theme';

type StreamLike = {
  toURL: () => string;
  getTracks: () => Array<{ stop: () => void }>;
  getVideoTracks: () => Array<{ enabled: boolean }>;
  getAudioTracks: () => Array<{ enabled: boolean }>;
};

const hasNativeWebRtc = (NativeModules as Record<string, unknown>).WebRTCModule != null;
const RTCViewComponent = hasNativeWebRtc
  ? // eslint-disable-next-line @typescript-eslint/no-require-imports
    (require('react-native-webrtc') as { RTCView: ComponentType<Record<string, unknown>> }).RTCView
  : null;

type CallInfo = {
  slug: string;
  lessonId: string | null;
  specialistJoined: boolean;
  ended: boolean;
  endReason?: string | null;
  lesson: {
    serviceName: string | null;
    specialistName: string;
    clientName: string;
  } | null;
  lessonEndAt: number | null;
  role: 'specialist' | 'client' | 'guest';
  presentationMode: boolean;
  serverTime: number;
};

type RoomPollState = {
  ended?: boolean;
  endReason?: 'specialist_ended' | 'expired' | 'lesson_cancelled' | string;
  presentationMode?: boolean;
  specialistMediaState?: { videoEnabled: boolean; audioEnabled: boolean };
  clientMediaState?: { videoEnabled: boolean; audioEnabled: boolean };
};

function endedReasonText(reason?: string | null): string {
  switch (reason) {
    case 'specialist_ended':
      return 'Специалист завершил занятие. Комната закрыта.';
    case 'expired':
      return 'Время комнаты истекло.';
    case 'lesson_cancelled':
      return 'Занятие было отменено.';
    default:
      return 'Занятие завершено.';
  }
}

export default function RoomNativeScreen() {
  const router = useRouter();
  const { slug: slugParam } = useLocalSearchParams<{ slug: string | string[] }>();
  const slug = typeof slugParam === 'string' ? slugParam : slugParam?.[0] ?? '';
  const formattedSlug = slug;
  const { authApi } = useAuth();

  const [phase, setPhase] = useState<'loading' | 'perm' | 'call' | 'ended' | 'error'>('loading');
  const [errMsg, setErrMsg] = useState<string | null>(null);
  const [data, setData] = useState<CallInfo | null>(null);
  const [localStream, setLocalStream] = useState<StreamLike | null>(null);
  const [serverTimeOffset, setServerTimeOffset] = useState(0);
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);

  const [videoEnabled, setVideoEnabled] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [remotePeerVideoEnabled, setRemotePeerVideoEnabled] = useState(true);
  const [remotePeerAudioEnabled, setRemotePeerAudioEnabled] = useState(true);

  const [leaveModalOpen, setLeaveModalOpen] = useState(false);
  const wasEverConnectedRef = useRef(false);
  const localStreamRef = useRef<StreamLike | null>(null);
  localStreamRef.current = localStream;

  const webRtcSignalHandlerRef = useRef<((s: WebRtcSignalPayload) => void) | null>(null);
  const webRtcSseReopenRef = useRef<(() => void) | null>(null);

  const webrtcActive = phase === 'call' && !!localStream;
  const { remoteStream, connectionState } = useWebRtcNative(
    formattedSlug,
    localStream,
    webrtcActive,
    webRtcSignalHandlerRef,
    webRtcSseReopenRef
  );

  const shouldCallEnter =
    data != null &&
    data.role !== 'guest' &&
    (data.role === 'specialist' || !data.lessonId);
  const enterDoneRef = useRef(false);

  const sendMediaState = useCallback(
    async (video: boolean, audio: boolean) => {
      try {
        await fetchWithAuth(
          `/online/room/${encodeURIComponent(formattedSlug)}/media-state`,
          {
            method: 'POST',
            body: JSON.stringify({ videoEnabled: video, audioEnabled: audio }),
          },
          authApi
        );
      } catch {
        /* noop */
      }
    },
    [authApi, formattedSlug]
  );

  useEffect(() => {
    if (connectionState === 'connected') wasEverConnectedRef.current = true;
  }, [connectionState]);

  const loadCallInfo = useCallback(async () => {
    setErrMsg(null);
    try {
      const res = await fetchWithAuth(
        `/online/room/${encodeURIComponent(formattedSlug)}/call-info`,
        {},
        authApi
      );
      if (res.status === 404) {
        setErrMsg('Комната не найдена');
        setPhase('error');
        return;
      }
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        setErrMsg(j.error ?? `Ошибка ${res.status}`);
        setPhase('error');
        return;
      }
      const json = (await res.json()) as CallInfo;
      setData(json);
      if (json.ended) {
        setPhase('ended');
        return;
      }
      setPhase('perm');
    } catch {
      setErrMsg('Нет сети');
      setPhase('error');
    }
  }, [authApi, formattedSlug]);

  useEffect(() => {
    if (!slug) {
      setPhase('error');
      setErrMsg('Нет slug');
      return;
    }
    void loadCallInfo();
  }, [slug, loadCallInfo]);

  useEffect(() => {
    if (phase !== 'call' || !shouldCallEnter || enterDoneRef.current || !data) return;
    enterDoneRef.current = true;
    void fetchWithAuth(`/online/room/${encodeURIComponent(formattedSlug)}/enter`, { method: 'POST' }, authApi)
      .then((res) => res.json().catch(() => ({})))
      .then((json: { ended?: boolean }) => {
        if (json.ended) setPhase('ended');
        else setData((prev) => (prev ? { ...prev, specialistJoined: true } : prev));
      })
      .catch(() => {});
  }, [phase, shouldCallEnter, formattedSlug, authApi, data]);

  useEffect(() => {
    if (phase !== 'call' || data?.lessonEndAt == null) return;
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch(getApiUrl('/time'));
        const json = (await res.json()) as { serverTime?: number };
        if (!cancelled && typeof json.serverTime === 'number') {
          setServerTimeOffset(json.serverTime - Date.now());
        }
      } catch {
        if (!cancelled) setServerTimeOffset(0);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [phase, data?.lessonEndAt]);

  useEffect(() => {
    if (phase !== 'call' || data?.lessonEndAt == null) return;
    const tick = () => {
      const now = Date.now() + serverTimeOffset;
      setRemainingSeconds(Math.max(0, Math.floor((data.lessonEndAt! - now) / 1000)));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [phase, data?.lessonEndAt, serverTimeOffset]);

  useEffect(() => {
    if (phase !== 'call' || !data) return;
    let cancelled = false;
    const poll = async () => {
      try {
        const res = await fetch(
          getApiUrl(`/online/room/${encodeURIComponent(formattedSlug)}/state`),
          { cache: 'no-store' }
        );
        if (!res.ok || cancelled) return;
        const s = (await res.json()) as RoomPollState;
        if (s.ended) {
          setData((prev) =>
            prev
              ? { ...prev, ended: true, endReason: s.endReason ?? prev.endReason }
              : prev
          );
          setPhase('ended');
          return;
        }
        const isClient = data.role === 'client';
        const remote =
          data.role === 'guest'
            ? undefined
            : isClient
              ? s.specialistMediaState
              : s.clientMediaState;
        if (remote) {
          setRemotePeerVideoEnabled(remote.videoEnabled !== false);
          setRemotePeerAudioEnabled(remote.audioEnabled !== false);
        }
      } catch {
        /* noop */
      }
    };
    void poll();
    const id = setInterval(poll, 750);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [phase, formattedSlug, data?.role]);

  const initialMediaSent = useRef(false);
  useEffect(() => {
    if (!localStream || initialMediaSent.current) return;
    initialMediaSent.current = true;
    const v = localStream.getVideoTracks()[0]?.enabled ?? true;
    const a = localStream.getAudioTracks()[0]?.enabled ?? true;
    setVideoEnabled(v);
    setAudioEnabled(a);
    void sendMediaState(v, a);
  }, [localStream, sendMediaState]);

  useEffect(() => {
    if (phase === 'ended') {
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
      setLocalStream(null);
    }
  }, [phase]);

  const requestMedia = async () => {
    if (!hasNativeWebRtc) {
      setErrMsg('WebRTC недоступен в Expo Go. Откройте экран в development build.');
      setPhase('error');
      return;
    }
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { mediaDevices } = require('react-native-webrtc') as {
        mediaDevices: { getUserMedia: (opts: unknown) => Promise<StreamLike> };
      };
      const stream = await mediaDevices.getUserMedia({
        audio: true,
        video: { facingMode: 'user' },
      });
      initialMediaSent.current = false;
      setLocalStream(stream);
      setPhase('call');
    } catch {
      setErrMsg('Не удалось получить доступ к камере и микрофону');
    }
  };

  const stopAll = useCallback(() => {
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    setLocalStream(null);
  }, []);

  const confirmLeave = () => {
    setLeaveModalOpen(false);
    stopAll();
    router.back();
  };

  const toggleVideo = () => {
    if (!localStream) return;
    const track = localStream.getVideoTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    const next = track.enabled;
    setVideoEnabled(next);
    void sendMediaState(next, audioEnabled);
  };

  const toggleAudio = () => {
    if (!localStream) return;
    const track = localStream.getAudioTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    const next = track.enabled;
    setAudioEnabled(next);
    void sendMediaState(videoEnabled, next);
  };

  const hasRemoteVideo = !!remoteStream && remoteStream.getVideoTracks().length > 0;
  const isConnecting = connectionState === 'new' || connectionState === 'connecting';
  const isConnected = connectionState === 'connected';
  const showPeerLeftOverlay =
    wasEverConnectedRef.current &&
    ['disconnected', 'failed', 'closed'].includes(connectionState);

  useEffect(() => {
    if (!showPeerLeftOverlay) return;
    const t = setTimeout(() => {
      localStreamRef.current?.getTracks().forEach((x) => x.stop());
      setLocalStream(null);
      router.back();
    }, 3500);
    return () => clearTimeout(t);
  }, [showPeerLeftOverlay, router]);

  if (phase === 'loading') {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#c42d26" />
        <Text style={styles.muted}>Подключение к комнате…</Text>
      </View>
    );
  }

  if (phase === 'error') {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.title}>{errMsg ?? 'Ошибка'}</Text>
        <Pressable onPress={() => router.back()} style={styles.primaryBtn}>
          <Text style={styles.primaryBtnText}>Назад</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  if (phase === 'ended' && data) {
    return (
      <SafeAreaView style={styles.center}>
        <Ionicons name="call-outline" size={48} color="#9ca3af" style={{ marginBottom: 16 }} />
        <Text style={styles.title}>Комната закрыта</Text>
        <Text style={styles.endedSub}>{endedReasonText(data.endReason)}</Text>
        <Pressable onPress={() => router.back()} style={[styles.primaryBtn, { marginTop: 24 }]}>
          <Text style={styles.primaryBtnText}>В личный кабинет</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  if (phase === 'perm') {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.title}>Камера и микрофон</Text>
        <Text style={styles.sub}>Нужны для видеозвонка со специалистом</Text>
        {errMsg ? <Text style={styles.err}>{errMsg}</Text> : null}
        <Pressable onPress={requestMedia} style={styles.primaryBtn}>
          <Text style={styles.primaryBtnText}>Разрешить и войти</Text>
        </Pressable>
        <Pressable onPress={() => router.back()} style={{ marginTop: 16 }}>
          <Text style={styles.link}>Отмена</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  if (phase === 'call' && data) {
    const title = data.lesson?.serviceName ?? 'Онлайн';
    const specialistInitial =
      (data.lesson?.specialistName?.trim()?.[0] ?? 'С').toUpperCase();
    const showRemoteVideoOff = hasRemoteVideo && !remotePeerVideoEnabled;

    return (
      <View style={styles.full}>
        <Modal
          visible={leaveModalOpen}
          onClose={() => setLeaveModalOpen(false)}
          title="Выйти из урока?"
          snapFractions={[0.34, 0.42]}
        >
          <Text style={styles.modalText}>
            Вы отключитесь от видеозвонка. Занятие для специалиста может продолжаться — вы сможете зайти снова из
            раздела «Онлайн», если комната ещё открыта.
          </Text>
          <View style={styles.modalRow}>
            <Pressable onPress={() => setLeaveModalOpen(false)} style={styles.modalGhost}>
              <Text style={styles.modalGhostText}>Отмена</Text>
            </Pressable>
            <Pressable onPress={confirmLeave} style={styles.modalDanger}>
              <Text style={styles.modalDangerText}>Выйти</Text>
            </Pressable>
          </View>
        </Modal>

        <SafeAreaView style={styles.header}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {title}
          </Text>
          {remainingSeconds !== null && data.lesson ? (
            <Text style={styles.timer}>
              {String(Math.floor(remainingSeconds / 60)).padStart(2, '0')}:
              {String(remainingSeconds % 60).padStart(2, '0')}
            </Text>
          ) : null}
          <View style={[styles.dot, { backgroundColor: isConnected ? '#22c55e' : isConnecting ? '#f59e0b' : '#ef4444' }]} />
        </SafeAreaView>

        <View style={styles.videoWrap}>
          {showPeerLeftOverlay ? (
            <View style={styles.disconnectOverlay}>
              <Ionicons name="cloud-offline-outline" size={56} color="#fff9" />
              <Text style={styles.disconnectTitle}>Связь прервалась или занятие завершено</Text>
              <Text style={styles.disconnectSub}>Возвращаем вас в кабинет…</Text>
            </View>
          ) : null}

          {remoteStream ? (
            RTCViewComponent ? (
              <RTCViewComponent streamURL={remoteStream.toURL()} style={styles.remote} objectFit="cover" />
            ) : (
              <View style={[styles.remote, styles.placeholder]} />
            )
          ) : (
            <View style={[styles.remote, styles.placeholder]}>
              <Ionicons name="videocam-off-outline" size={56} color="#ffffff55" />
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarLetter}>{specialistInitial}</Text>
              </View>
              <Text style={styles.phText}>{isConnecting ? 'Подключение…' : 'Ожидание специалиста'}</Text>
            </View>
          )}

          {hasRemoteVideo && showRemoteVideoOff ? (
            <View style={styles.remoteMutedOverlay} pointerEvents="none">
              <Ionicons name="videocam-off" size={64} color="#ffffff88" />
            </View>
          ) : null}

          {hasRemoteVideo && !remotePeerAudioEnabled ? (
            <View style={styles.remoteMicBadge} pointerEvents="none">
              <Ionicons name="mic-off" size={16} color="#fff" />
              <Text style={styles.remoteMicText}>Микрофон выключен</Text>
            </View>
          ) : null}

          {localStream ? (
            <View style={styles.localPipWrap}>
              {RTCViewComponent ? (
                <RTCViewComponent
                  streamURL={localStream.toURL()}
                  style={styles.localPip}
                  objectFit="cover"
                  mirror
                />
              ) : (
                <View style={styles.localPip} />
              )}
              {!videoEnabled ? (
                <View style={styles.pipMuted}>
                  <Ionicons name="videocam-off" size={32} color="#fff9" />
                </View>
              ) : null}
              {!audioEnabled ? (
                <View style={styles.pipMicOff}>
                  <Ionicons name="mic-off" size={14} color="#fff" />
                </View>
              ) : null}
            </View>
          ) : null}
        </View>

        <View style={styles.footer}>
          <View style={styles.controlsRow}>
            {localStream ? (
              <>
                <Pressable onPress={toggleVideo} style={styles.ctrlBtn} hitSlop={8}>
                  <Ionicons
                    name={videoEnabled ? 'videocam' : 'videocam-off'}
                    size={26}
                    color={videoEnabled ? '#fff' : '#f87171'}
                  />
                </Pressable>
                <Pressable onPress={toggleAudio} style={styles.ctrlBtn} hitSlop={8}>
                  <Ionicons
                    name={audioEnabled ? 'mic' : 'mic-off'}
                    size={26}
                    color={audioEnabled ? '#fff' : '#f87171'}
                  />
                </Pressable>
              </>
            ) : null}
            <View style={styles.ctrlSep} />
            <Pressable onPress={() => setLeaveModalOpen(true)} style={styles.ctrlHangup} hitSlop={8}>
              <Ionicons name="call" size={26} color="#fff" style={{ transform: [{ rotate: '135deg' }] }} />
            </Pressable>
          </View>
          <Text style={styles.footerHint}>Выйти — только для вас; завершает занятие специалист</Text>
        </View>
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  full: { flex: 1, backgroundColor: '#000' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, backgroundColor: '#fff' },
  title: { fontSize: 20, fontFamily: Fonts.sansSemiBold, color: '#111', marginBottom: 8, textAlign: 'center' },
  endedSub: {
    fontSize: 15,
    color: '#4b5563',
    fontFamily: Fonts.sans,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 12,
  },
  sub: { fontSize: 14, color: '#6b7280', textAlign: 'center', marginBottom: 24 },
  muted: { marginTop: 12, color: '#6b7280', fontFamily: Fonts.sans },
  err: { color: '#b91c1c', marginBottom: 12, textAlign: 'center' },
  primaryBtn: {
    backgroundColor: '#c42d26',
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 14,
  },
  primaryBtnText: { color: '#fff', fontFamily: Fonts.sansSemiBold, fontSize: 16 },
  link: { color: '#6b7280', fontFamily: Fonts.sansMedium },
  modalText: {
    fontSize: 14,
    color: '#374151',
    fontFamily: Fonts.sans,
    lineHeight: 20,
    marginBottom: 20,
  },
  modalRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12 },
  modalGhost: { paddingVertical: 10, paddingHorizontal: 16 },
  modalGhostText: { color: '#6b7280', fontFamily: Fonts.sansSemiBold, fontSize: 15 },
  modalDanger: {
    backgroundColor: '#c42d26',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  modalDangerText: { color: '#fff', fontFamily: Fonts.sansSemiBold, fontSize: 15 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  headerTitle: { flex: 1, color: '#fff', fontFamily: Fonts.sansSemiBold, fontSize: 15 },
  timer: { color: '#ffffff99', fontFamily: Fonts.sans, marginRight: 8 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  videoWrap: { flex: 1, position: 'relative' },
  remote: { flex: 1, width: '100%', backgroundColor: '#111' },
  placeholder: { justifyContent: 'center', alignItems: 'center', gap: 10 },
  avatarCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: { fontSize: 28, color: '#ffffffcc', fontFamily: Fonts.sansSemiBold },
  phText: { color: '#9ca3af', fontFamily: Fonts.sans, fontSize: 14 },
  remoteMutedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  remoteMicBadge: {
    position: 'absolute',
    bottom: 100,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  remoteMicText: { color: '#ffffffcc', fontSize: 12, fontFamily: Fonts.sans },
  localPipWrap: {
    position: 'absolute',
    right: 12,
    bottom: 100,
    width: 120,
    height: 160,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  localPip: { flex: 1, width: '100%', height: '100%' },
  pipMuted: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pipMicOff: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 4,
    padding: 4,
  },
  disconnectOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 20,
    backgroundColor: 'rgba(0,0,0,0.92)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    gap: 12,
  },
  disconnectTitle: { color: '#fff', fontSize: 17, fontFamily: Fonts.sansSemiBold, textAlign: 'center' },
  disconnectSub: { color: '#ffffff99', fontSize: 14, fontFamily: Fonts.sans, textAlign: 'center' },
  footer: {
    paddingBottom: 20,
    paddingTop: 10,
    backgroundColor: 'rgba(0,0,0,0.9)',
    alignItems: 'center',
    gap: 8,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 999,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  ctrlBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctrlSep: { width: 1, height: 28, backgroundColor: 'rgba(255,255,255,0.2)' },
  ctrlHangup: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#dc2626',
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerHint: {
    fontSize: 11,
    color: '#ffffff66',
    fontFamily: Fonts.sans,
    textAlign: 'center',
    paddingHorizontal: 24,
  },
});

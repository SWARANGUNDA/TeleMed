/**
 * useAudioCall.js / useWebRTCCall.js — Production WebRTC Audio & Video Consultation Hook for TeleMed.
 *
 * Manages the full lifecycle of a 1-to-1 Audio or HD Video Call between Patient and Doctor:
 * - WebSocket signaling channel (CALL_REQUEST, ACCEPT, DECLINE, CANCEL, OFFER, ANSWER, ICE_CANDIDATE, MEDIA_TOGGLE, END)
 * - RTCPeerConnection with STUN/TURN & ICE Candidate Queuing
 * - getUserMedia for microphone audio and HD webcam video (with graceful audio-only fallback)
 * - getDisplayMedia for Screen Sharing with track swapping and auto-revert on track end
 * - WebRTC getStats() adaptive bandwidth throttling (maxBitrate adjusting dynamically to network conditions)
 * - Auto ICE restart with reconnection countdown on dropped frames
 * - Local Picture-in-Picture (PiP) and Remote Video stream management
 * - In-call Camera Toggle (video on/off) and Microphone Mute/Unmute
 * - Call state machine (IDLE → CALLING → RINGING → ACCEPTED → CONNECTING → CONNECTED → RECONNECTING → ENDED)
 * - Anti-stuck timeouts and hardware cleanup on unmount, logout, tab close
 *
 * Security: Server-side identity derived from JWT/session. Zero server recording.
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { getAuthToken, getWsBaseUrl } from '../api/client';

// Call state machine
export const CALL_STATES = {
  IDLE: 'IDLE',
  CALLING: 'CALLING',
  RINGING: 'RINGING',
  ACCEPTED: 'ACCEPTED',
  CONNECTING: 'CONNECTING',
  CONNECTED: 'CONNECTED',
  RECONNECTING: 'RECONNECTING',
  DECLINED: 'DECLINED',
  MISSED: 'MISSED',
  ENDED: 'ENDED',
  FAILED: 'FAILED',
};

// ICE/STUN/TURN configuration
function getIceConfig() {
  const stunUrl = (typeof window !== 'undefined' && window.__TELEMED_STUN_URL__) || 'stun:stun.l.google.com:19302';
  const config = {
    iceServers: [
      { urls: stunUrl },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
      { urls: 'stun:stun3.l.google.com:19302' },
      { urls: 'stun:stun4.l.google.com:19302' },
      { urls: 'stun:global.stun.twilio.com:3478' },
    ],
    iceCandidatePoolSize: 10,
  };
  if (typeof window !== 'undefined' && window.__TELEMED_TURN_URL__) {
    config.iceServers.push({
      urls: window.__TELEMED_TURN_URL__,
      username: window.__TELEMED_TURN_USER__ || '',
      credential: window.__TELEMED_TURN_CRED__ || '',
    });
  }
  return config;
}

/**
 * @param {string|null} consultationId - Active consultation ID
 * @param {object|null} user - Current authenticated user object
 * @returns Call state, streams, screen sharing, network quality, and control functions
 */
export default function useAudioCall(consultationId, user) {
  const [callState, setCallState] = useState(CALL_STATES.IDLE);
  const [callType, setCallType] = useState('audio'); // 'audio' | 'video'
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isRemoteVideoAvailable, setIsRemoteVideoAvailable] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [peerName, setPeerName] = useState('');
  const [peerRole, setPeerRole] = useState('');
  const [incomingCallInfo, setIncomingCallInfo] = useState(null);
  const [error, setError] = useState(null);

  // Screen sharing & telemetry state
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isRemoteScreenSharing, setIsRemoteScreenSharing] = useState(false);
  const [networkQuality, setNetworkQuality] = useState('EXCELLENT'); // 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR'
  const [latencyMs, setLatencyMs] = useState(null);
  const [packetLossPct, setPacketLossPct] = useState(0);
  const [reconnectCountdown, setReconnectCountdown] = useState(null);

  const wsRef = useRef(null);
  const pcRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteStreamRef = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const remoteAudioRef = useRef(null);
  const durationTimerRef = useRef(null);
  const callStateRef = useRef(CALL_STATES.IDLE);
  const callTypeRef = useRef('audio');
  const stuckTimerRef = useRef(null);
  const pingIntervalRef = useRef(null);
  const isCleaningUpRef = useRef(false);
  const pendingIceCandidatesRef = useRef([]);

  // Telehealth resilience & screen share refs
  const screenStreamRef = useRef(null);
  const cameraTrackRef = useRef(null);
  const statsIntervalRef = useRef(null);
  const reconnectIntervalRef = useRef(null);
  const isScreenSharingRef = useRef(false);

  // Keep callStateRef in sync
  const updateCallState = useCallback((newState) => {
    callStateRef.current = newState;
    setCallState(newState);
    if ([CALL_STATES.IDLE, CALL_STATES.CONNECTED, CALL_STATES.ENDED, CALL_STATES.FAILED, CALL_STATES.DECLINED, CALL_STATES.MISSED].includes(newState)) {
      if (stuckTimerRef.current) {
        clearTimeout(stuckTimerRef.current);
        stuckTimerRef.current = null;
      }
    }
  }, []);

  // ── Duration Timer ────────────────────────────────────────────────────
  const startDurationTimer = useCallback(() => {
    setCallDuration(0);
    if (durationTimerRef.current) clearInterval(durationTimerRef.current);
    const startTime = Date.now();
    durationTimerRef.current = setInterval(() => {
      setCallDuration(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
  }, []);

  const stopDurationTimer = useCallback(() => {
    if (durationTimerRef.current) {
      clearInterval(durationTimerRef.current);
      durationTimerRef.current = null;
    }
  }, []);

  // ── Reconnection Resilience Timers ────────────────────────────────────
  const clearReconnection = useCallback(() => {
    if (reconnectIntervalRef.current) {
      clearInterval(reconnectIntervalRef.current);
      reconnectIntervalRef.current = null;
    }
    setReconnectCountdown(null);
  }, []);

  // ── WebSocket Signaling Send ──────────────────────────────────────────
  const sendSignal = useCallback((payload) => {
    if (wsRef.current) {
      if (wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify(payload));
        return true;
      } else if (wsRef.current.readyState === WebSocket.CONNECTING) {
        // Queue to send immediately once connection handshake finishes
        const curWs = wsRef.current;
        const prevOpen = curWs.onopen;
        curWs.onopen = (e) => {
          if (prevOpen) prevOpen(e);
          try { curWs.send(JSON.stringify(payload)); } catch (err) {}
        };
        return true;
      }
    }
    return false;
  }, []);

  // ── Media Cleanup ─────────────────────────────────────────────────────
  const stopLocalMedia = useCallback(() => {
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(track => {
        try {
          track.stop();
          track.enabled = false;
        } catch (e) {}
      });
      screenStreamRef.current = null;
    }
    isScreenSharingRef.current = false;
    setIsScreenSharing(false);
    cameraTrackRef.current = null;

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        try {
          track.stop();
          track.enabled = false;
        } catch (e) {}
      });
      localStreamRef.current = null;
    }
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }
    if (remoteAudioRef.current) {
      remoteAudioRef.current.srcObject = null;
    }
    remoteStreamRef.current = null;
    setIsRemoteVideoAvailable(false);
    setIsRemoteScreenSharing(false);
  }, []);

  // ── RTCPeerConnection Cleanup ─────────────────────────────────────────
  const closePeerConnection = useCallback(() => {
    pendingIceCandidatesRef.current = [];
    if (pcRef.current) {
      pcRef.current.onicecandidate = null;
      pcRef.current.ontrack = null;
      pcRef.current.onconnectionstatechange = null;
      pcRef.current.oniceconnectionstatechange = null;
      pcRef.current.onnegotiationneeded = null;
      try { pcRef.current.close(); } catch (e) {}
      pcRef.current = null;
    }
  }, []);

  // ── Network Telemetry Cleanup ─────────────────────────────────────────
  const stopStatsMonitoring = useCallback(() => {
    if (statsIntervalRef.current) {
      clearInterval(statsIntervalRef.current);
      statsIntervalRef.current = null;
    }
    setLatencyMs(null);
    setPacketLossPct(0);
    setNetworkQuality('EXCELLENT');
  }, []);

  // ── Full Call Cleanup ─────────────────────────────────────────────────
  const cleanupCall = useCallback(() => {
    if (isCleaningUpRef.current) return;
    isCleaningUpRef.current = true;

    stopDurationTimer();
    clearReconnection();
    stopStatsMonitoring();
    stopLocalMedia();
    closePeerConnection();

    if (stuckTimerRef.current) {
      clearTimeout(stuckTimerRef.current);
      stuckTimerRef.current = null;
    }

    setIsMuted(false);
    setIsVideoEnabled(true);
    setIncomingCallInfo(null);

    isCleaningUpRef.current = false;
  }, [stopDurationTimer, clearReconnection, stopStatsMonitoring, stopLocalMedia, closePeerConnection]);

  // ── Anti-Stuck Timer ──────────────────────────────────────────────────
  const setStuckTimeout = useCallback((timeoutMs = 30000) => {
    if (stuckTimerRef.current) clearTimeout(stuckTimerRef.current);
    stuckTimerRef.current = setTimeout(() => {
      const current = callStateRef.current;
      if ([CALL_STATES.CALLING, CALL_STATES.CONNECTING, CALL_STATES.ACCEPTED].includes(current)) {
        setError('Call could not be established. Please try again.');
        updateCallState(CALL_STATES.FAILED);
        cleanupCall();
      }
    }, timeoutMs);
  }, [updateCallState, cleanupCall]);

  // ── Adaptive Bandwidth Throttling ─────────────────────────────────────
  const adjustVideoBitrate = useCallback(async (maxBitrateBps) => {
    if (!pcRef.current) return;
    try {
      const senders = pcRef.current.getSenders();
      const videoSender = senders.find(s => s.track && s.track.kind === 'video');
      if (videoSender && typeof videoSender.getParameters === 'function') {
        const params = videoSender.getParameters();
        if (params.encodings && params.encodings.length > 0) {
          params.encodings[0].maxBitrate = maxBitrateBps;
          await videoSender.setParameters(params);
        }
      }
    } catch (e) {
      // Non-fatal parameter constraint error
    }
  }, []);

  // ── WebRTC Stats Monitoring Loop ──────────────────────────────────────
  const startStatsMonitoring = useCallback(() => {
    if (statsIntervalRef.current) clearInterval(statsIntervalRef.current);
    statsIntervalRef.current = setInterval(async () => {
      if (!pcRef.current || callStateRef.current !== CALL_STATES.CONNECTED) return;
      try {
        const stats = await pcRef.current.getStats();
        let rtt = null;
        let packetsLost = 0;
        let packetsTotal = 0;

        stats.forEach((report) => {
          if (report.type === 'candidate-pair' && (report.selected || report.state === 'succeeded')) {
            if (report.currentRoundTripTime !== undefined) {
              rtt = report.currentRoundTripTime * 1000;
            } else if (report.roundTripTime !== undefined) {
              rtt = report.roundTripTime * 1000;
            }
          }
          if (report.type === 'inbound-rtp' && (report.kind === 'video' || report.kind === 'audio')) {
            if (report.packetsLost !== undefined) packetsLost += report.packetsLost;
            if (report.packetsReceived !== undefined) packetsTotal += (report.packetsReceived + report.packetsLost);
          }
        });

        const calculatedLatency = rtt !== null ? Math.round(rtt) : 38;
        const lossPct = packetsTotal > 0 ? Math.min(100, Math.round((packetsLost / packetsTotal) * 100)) : 0;

        setLatencyMs(calculatedLatency);
        setPacketLossPct(lossPct);

        let quality = 'EXCELLENT';
        let targetBitrate = 1800000; // 1.8 Mbps

        if (calculatedLatency > 280 || lossPct >= 10) {
          quality = 'POOR';
          targetBitrate = 250000; // 250 kbps (emergency low bitrate to preserve audio clarity)
        } else if (calculatedLatency > 150 || lossPct >= 5) {
          quality = 'FAIR';
          targetBitrate = 600000; // 600 kbps
        } else if (calculatedLatency > 80 || lossPct >= 2) {
          quality = 'GOOD';
          targetBitrate = 1200000; // 1.2 Mbps
        } else {
          quality = 'EXCELLENT';
          targetBitrate = 1800000;
        }

        setNetworkQuality(quality);
        adjustVideoBitrate(targetBitrate);
      } catch (err) {}
    }, 2800);
  }, [adjustVideoBitrate]);

  // ── Automatic ICE Restart & Reconnection Procedure ───────────────────
  const triggerReconnection = useCallback(() => {
    if (callStateRef.current === CALL_STATES.RECONNECTING) return;
    if (![CALL_STATES.CONNECTED, CALL_STATES.CONNECTING].includes(callStateRef.current)) return;

    updateCallState(CALL_STATES.RECONNECTING);
    let secondsLeft = 20;
    setReconnectCountdown(secondsLeft);

    if (reconnectIntervalRef.current) clearInterval(reconnectIntervalRef.current);
    reconnectIntervalRef.current = setInterval(() => {
      secondsLeft -= 1;
      setReconnectCountdown(secondsLeft);
      if (secondsLeft <= 0) {
        if (reconnectIntervalRef.current) {
          clearInterval(reconnectIntervalRef.current);
          reconnectIntervalRef.current = null;
        }
        setError('Connection lost. The teleconsultation could not be recovered.');
        updateCallState(CALL_STATES.FAILED);
        sendSignal({ event: 'CALL_END', reason: 'RECONNECT_TIMEOUT' });
        cleanupCall();
      }
    }, 1000);

    // Attempt ICE restart
    if (pcRef.current) {
      try {
        if (typeof pcRef.current.restartIce === 'function') {
          pcRef.current.restartIce();
        }
        pcRef.current.createOffer({ iceRestart: true }).then(async (offer) => {
          if (!pcRef.current) return;
          await pcRef.current.setLocalDescription(offer);
          sendSignal({
            event: 'CALL_OFFER',
            sdp: pcRef.current.localDescription.toJSON(),
            call_type: callTypeRef.current,
            iceRestart: true,
          });
        }).catch(() => {});
      } catch (err) {}
    }
  }, [updateCallState, sendSignal, cleanupCall]);

  // ── Attach Local Stream to Video Ref ──────────────────────────────────
  const attachLocalStream = useCallback((stream) => {
    if (localVideoRef.current && stream) {
      if (localVideoRef.current.srcObject !== stream) {
        localVideoRef.current.srcObject = stream;
      }
      localVideoRef.current.play().catch(() => {});
    }
  }, []);

  // ── Attach Remote Stream to Video Ref ─────────────────────────────────
  const attachRemoteStream = useCallback((stream) => {
    if (remoteVideoRef.current && stream) {
      if (remoteVideoRef.current.srcObject !== stream) {
        remoteVideoRef.current.srcObject = stream;
      }
      remoteVideoRef.current.play().catch(() => {});
    }
    if (remoteAudioRef.current && stream) {
      if (remoteAudioRef.current.srcObject !== stream) {
        remoteAudioRef.current.srcObject = stream;
      }
      remoteAudioRef.current.play().catch(() => {});
    }
  }, []);

  // ── Drain Pending ICE Candidates ──────────────────────────────────────
  const drainIceCandidates = useCallback(async (pc) => {
    while (pendingIceCandidatesRef.current.length > 0) {
      const candidate = pendingIceCandidatesRef.current.shift();
      try {
        await pc.addIceCandidate(candidate);
      } catch (err) {
        console.warn('ICE candidate addition from queue ignored:', err);
      }
    }
  }, []);

  // ── Create RTCPeerConnection ──────────────────────────────────────────
  const createPeerConnection = useCallback(() => {
    closePeerConnection();

    const pc = new RTCPeerConnection(getIceConfig());
    pcRef.current = pc;

    // Send ICE candidates to peer with portable payload
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        const candPayload = (event.candidate && typeof event.candidate.toJSON === 'function')
          ? event.candidate.toJSON()
          : {
              candidate: event.candidate.candidate,
              sdpMid: event.candidate.sdpMid,
              sdpMLineIndex: event.candidate.sdpMLineIndex,
              usernameFragment: event.candidate.usernameFragment,
            };
        sendSignal({
          event: 'ICE_CANDIDATE',
          candidate: candPayload,
        });
      }
    };

    // Handle remote audio & video tracks (supports single track or stream bundle)
    pc.ontrack = (event) => {
      let stream = (event.streams && event.streams[0]) ? event.streams[0] : null;
      if (!stream) {
        if (!remoteStreamRef.current) {
          remoteStreamRef.current = new MediaStream();
        }
        remoteStreamRef.current.addTrack(event.track);
        stream = remoteStreamRef.current;
      } else {
        remoteStreamRef.current = stream;
      }

      const hasVideo = stream.getVideoTracks().length > 0;
      setIsRemoteVideoAvailable(hasVideo);
      attachRemoteStream(stream);

      stream.onaddtrack = () => {
        setIsRemoteVideoAvailable(stream.getVideoTracks().length > 0);
        attachRemoteStream(stream);
      };
      stream.onremovetrack = () => {
        setIsRemoteVideoAvailable(stream.getVideoTracks().length > 0);
      };
    };

    // Helper to transition to CONNECTED state once ICE or peer connection succeeds
    const markConnected = () => {
      if (callStateRef.current !== CALL_STATES.CONNECTED) {
        clearReconnection();
        updateCallState(CALL_STATES.CONNECTED);
        startDurationTimer();
        startStatsMonitoring();
      }
    };

    // Monitor connection state
    pc.onconnectionstatechange = () => {
      const state = pc.connectionState;
      if (state === 'connected') {
        markConnected();
      } else if (state === 'disconnected') {
        triggerReconnection();
      } else if (state === 'failed') {
        if (callStateRef.current === CALL_STATES.RECONNECTING) {
          // Allow countdown to finish
        } else {
          triggerReconnection();
        }
      } else if (state === 'closed') {
        if (callStateRef.current !== CALL_STATES.ENDED && callStateRef.current !== CALL_STATES.IDLE) {
          updateCallState(CALL_STATES.ENDED);
          cleanupCall();
        }
      }
    };

    pc.oniceconnectionstatechange = () => {
      const iceState = pc.iceConnectionState;
      if (iceState === 'connected' || iceState === 'completed') {
        markConnected();
      } else if (iceState === 'failed' || iceState === 'disconnected') {
        if (callStateRef.current === CALL_STATES.CONNECTED) {
          triggerReconnection();
        }
      }
    };

    return pc;
  }, [closePeerConnection, sendSignal, clearReconnection, updateCallState, startDurationTimer, startStatsMonitoring, triggerReconnection, cleanupCall, attachRemoteStream]);

  // ── Acquire Media (Audio or Audio+Video) ───────────────────────────────
  const acquireMedia = useCallback(async (type = 'audio') => {
    const isVideo = type === 'video';
    const constraints = {
      audio: true,
      video: isVideo
        ? {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: 'user',
          }
        : false,
    };

    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      localStreamRef.current = stream;
      if (isVideo) {
        setIsVideoEnabled(true);
        setTimeout(() => attachLocalStream(stream), 100);
      }
      return stream;
    } catch (err) {
      if (isVideo) {
        try {
          const audioOnlyStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
          localStreamRef.current = audioOnlyStream;
          setIsVideoEnabled(false);
          setError('Camera was busy or unavailable. Connected with microphone audio.');
          return audioOnlyStream;
        } catch (audioErr) {}
      }

      const msg = err.name === 'NotAllowedError'
        ? 'Microphone and camera permissions were denied. Please allow device access in your browser.'
        : err.name === 'NotFoundError'
          ? 'No audio or video input device was detected.'
          : 'Could not access media devices. Please check system permissions.';
      setError(msg);
      throw new Error(msg);
    }
  }, [attachLocalStream]);

  // ── Screen Sharing Controls ───────────────────────────────────────────
  const stopScreenShare = useCallback(async () => {
    if (!isScreenSharingRef.current) return;
    isScreenSharingRef.current = false;
    setIsScreenSharing(false);

    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(track => {
        try {
          track.stop();
          track.enabled = false;
        } catch (e) {}
      });
      screenStreamRef.current = null;
    }

    if (pcRef.current) {
      const senders = pcRef.current.getSenders();
      const videoSender = senders.find(s => s.track && s.track.kind === 'video');
      if (videoSender && cameraTrackRef.current) {
        try {
          await videoSender.replaceTrack(cameraTrackRef.current);
        } catch (e) {}
      }
    }

    if (localVideoRef.current && localStreamRef.current) {
      localVideoRef.current.srcObject = localStreamRef.current;
      localVideoRef.current.play().catch(() => {});
    }

    sendSignal({
      event: 'MEDIA_TOGGLE',
      media_type: 'screen_share',
      is_active: false,
    });
  }, [sendSignal]);

  const toggleScreenShare = useCallback(async () => {
    if (isScreenSharingRef.current) {
      await stopScreenShare();
      return;
    }

    if (typeof navigator === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
      setError('Screen sharing is not supported in this browser environment.');
      return;
    }

    try {
      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: { cursor: 'always' },
        audio: false,
      });

      const screenTrack = displayStream.getVideoTracks()[0];
      if (!screenTrack) return;

      screenStreamRef.current = displayStream;
      isScreenSharingRef.current = true;
      setIsScreenSharing(true);

      // Cache camera track
      if (localStreamRef.current) {
        const currentCamTrack = localStreamRef.current.getVideoTracks()[0];
        if (currentCamTrack) {
          cameraTrackRef.current = currentCamTrack;
        }
      }

      if (pcRef.current) {
        const senders = pcRef.current.getSenders();
        const videoSender = senders.find(s => s.track && s.track.kind === 'video');
        if (videoSender) {
          if (!cameraTrackRef.current) {
            cameraTrackRef.current = videoSender.track;
          }
          await videoSender.replaceTrack(screenTrack);
        } else {
          pcRef.current.addTrack(screenTrack, displayStream);
        }
      }

      // Local preview
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = displayStream;
        localVideoRef.current.play().catch(() => {});
      }

      // Handle browser native "Stop sharing" chrome banner
      screenTrack.onended = () => {
        stopScreenShare();
      };

      sendSignal({
        event: 'MEDIA_TOGGLE',
        media_type: 'screen_share',
        is_active: true,
      });
    } catch (err) {
      if (err.name !== 'NotAllowedError') {
        setError('Could not start screen sharing.');
      }
      setIsScreenSharing(false);
      isScreenSharingRef.current = false;
    }
  }, [stopScreenShare, sendSignal]);

  // ── Handle Incoming Signaling Messages ────────────────────────────────
  const handleSignalingMessage = useCallback(async (data) => {
    const event = data.event;

    switch (event) {
      case 'CALL_CONNECTED':
        setPeerName(data.peer_name || '');
        break;

      case 'CALL_RINGING':
        if (data.peer_name) {
          setPeerName(data.peer_name);
        }
        break;

      case 'CALL_REQUEST': {
        const isActivelyCalling = [
          CALL_STATES.CONNECTED,
          CALL_STATES.CALLING,
          CALL_STATES.RINGING,
          CALL_STATES.ACCEPTED,
          CALL_STATES.CONNECTING,
          CALL_STATES.RECONNECTING,
        ].includes(callStateRef.current);

        if (isActivelyCalling) {
          sendSignal({ event: 'CALL_DECLINE', reason: 'BUSY' });
          return;
        }

        cleanupCall();
        setError(null);

        const incomingType = data.call_type || data.callType || 'audio';
        callTypeRef.current = incomingType;
        setCallType(incomingType);
        setIncomingCallInfo({
          senderName: data.sender_name || 'Unknown',
          senderRole: data.sender_role || 'UNKNOWN',
          consultationId: data.consultation_id,
          callType: incomingType,
        });
        setPeerName(data.sender_name || 'Caller');
        setPeerRole(data.sender_role || '');
        updateCallState(CALL_STATES.RINGING);
        setStuckTimeout(45000);
        break;
      }

      case 'CALL_ACCEPT': {
        if (callStateRef.current !== CALL_STATES.CALLING && callStateRef.current !== CALL_STATES.RINGING) return;
        updateCallState(CALL_STATES.CONNECTING);
        setStuckTimeout(25000);
        try {
          const pc = pcRef.current || createPeerConnection();
          const stream = localStreamRef.current || await acquireMedia(callTypeRef.current);
          
          const senders = pc.getSenders();
          if (senders.length === 0) {
            stream.getTracks().forEach(track => pc.addTrack(track, stream));
          }

          const offer = await pc.createOffer({
            offerToReceiveAudio: true,
            offerToReceiveVideo: callTypeRef.current === 'video',
          });
          await pc.setLocalDescription(offer);
          sendSignal({
            event: 'CALL_OFFER',
            sdp: {
              type: pc.localDescription.type,
              sdp: pc.localDescription.sdp,
            },
            call_type: callTypeRef.current,
          });
        } catch (err) {
          console.error('CALL_ACCEPT handling error:', err);
          setError('Failed to establish peer connection. Please try again.');
          updateCallState(CALL_STATES.FAILED);
          sendSignal({ event: 'CALL_END', reason: 'OFFER_FAILED' });
          cleanupCall();
        }
        break;
      }

      case 'CALL_DECLINE': {
        updateCallState(CALL_STATES.DECLINED);
        cleanupCall();
        break;
      }

      case 'CALL_CANCEL': {
        setIncomingCallInfo(null);
        updateCallState(CALL_STATES.ENDED);
        cleanupCall();
        break;
      }

      case 'CALL_OFFER': {
        updateCallState(CALL_STATES.CONNECTING);
        setStuckTimeout(25000);
        try {
          const offeredType = data.call_type || callTypeRef.current;
          callTypeRef.current = offeredType;
          setCallType(offeredType);

          const pc = pcRef.current || createPeerConnection();
          const stream = localStreamRef.current || await acquireMedia(offeredType);
          
          const senders = pc.getSenders();
          if (senders.length === 0) {
            stream.getTracks().forEach(track => pc.addTrack(track, stream));
          }

          const sdpInit = (data.sdp && data.sdp.sdp)
            ? data.sdp
            : (typeof data.sdp === 'string' ? { type: 'offer', sdp: data.sdp } : data.sdp);

          await pc.setRemoteDescription(new RTCSessionDescription(sdpInit));
          await drainIceCandidates(pc);

          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          sendSignal({
            event: 'CALL_ANSWER',
            sdp: {
              type: pc.localDescription.type,
              sdp: pc.localDescription.sdp,
            },
            call_type: offeredType,
          });
        } catch (err) {
          console.error('CALL_OFFER negotiation error:', err);
          setError('Failed to establish video/audio teleconsultation.');
          updateCallState(CALL_STATES.FAILED);
          sendSignal({ event: 'CALL_END', reason: 'ANSWER_FAILED' });
          cleanupCall();
        }
        break;
      }

      case 'CALL_ANSWER': {
        if (!pcRef.current) return;
        try {
          const sdpInit = (data.sdp && data.sdp.sdp)
            ? data.sdp
            : (typeof data.sdp === 'string' ? { type: 'answer', sdp: data.sdp } : data.sdp);

          await pcRef.current.setRemoteDescription(new RTCSessionDescription(sdpInit));
          await drainIceCandidates(pcRef.current);
        } catch (err) {
          console.error('CALL_ANSWER finalization error:', err);
          setError('Failed to finalize teleconsultation stream.');
          updateCallState(CALL_STATES.FAILED);
          cleanupCall();
        }
        break;
      }

      case 'ICE_CANDIDATE': {
        if (data.candidate) {
          try {
            const cand = typeof data.candidate === 'string' ? JSON.parse(data.candidate) : data.candidate;
            const rtcCandidate = new RTCIceCandidate(cand);
            if (pcRef.current && pcRef.current.remoteDescription && pcRef.current.remoteDescription.type) {
              await pcRef.current.addIceCandidate(rtcCandidate);
            } else {
              pendingIceCandidatesRef.current.push(rtcCandidate);
            }
          } catch (err) {
            console.warn('ICE candidate parsing/addition failed:', err);
          }
        }
        break;
      }

      case 'MEDIA_TOGGLE': {
        if (data.media_type === 'screen_share') {
          setIsRemoteScreenSharing(Boolean(data.is_active));
        }
        break;
      }

      case 'CALL_END': {
        updateCallState(CALL_STATES.ENDED);
        cleanupCall();
        setIncomingCallInfo(null);
        break;
      }

      case 'CALL_ERROR': {
        const errorType = data.error_type;
        if (errorType === 'PEER_UNAVAILABLE') {
          setError('The attending participant is not currently active in this workspace.');
          if (callStateRef.current === CALL_STATES.CALLING) {
            updateCallState(CALL_STATES.FAILED);
            cleanupCall();
          }
        } else if (errorType === 'PEER_DISCONNECTED') {
          setError('The other participant disconnected from the teleconsultation.');
          updateCallState(CALL_STATES.FAILED);
          cleanupCall();
        } else {
          setError(data.message || 'An error occurred during the teleconsultation.');
        }
        break;
      }

      case 'pong':
        break;

      default:
        break;
    }
  }, [sendSignal, updateCallState, createPeerConnection, acquireMedia, cleanupCall, setStuckTimeout, drainIceCandidates]);

  // Stable handler ref to prevent unmounting WebSocket on render
  const handleSignalingMessageRef = useRef(handleSignalingMessage);
  useEffect(() => {
    handleSignalingMessageRef.current = handleSignalingMessage;
  }, [handleSignalingMessage]);

  // ── Connect Signaling WebSocket ───────────────────────────────────────
  useEffect(() => {
    const userId = user?.user_id || user?.id;
    if (!consultationId || !userId) return;

    const token = getAuthToken() || userId;
    if (!token) return;

    const wsUrl = `${getWsBaseUrl()}/ws/call/${consultationId}?token=${encodeURIComponent(token)}`;
    let ws;

    try {
      ws = new WebSocket(wsUrl);
      wsRef.current = ws;
    } catch (err) {
      return;
    }

    ws.onopen = () => {
      if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send('ping');
        }
      }, 15000);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (handleSignalingMessageRef.current) {
          handleSignalingMessageRef.current(data);
        }
      } catch (err) {}
    };

    ws.onerror = () => {
      if ([CALL_STATES.CALLING, CALL_STATES.CONNECTING, CALL_STATES.CONNECTED].includes(callStateRef.current)) {
        setError('Signaling connection error. The teleconsultation may be interrupted.');
      }
    };

    ws.onclose = () => {
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
        pingIntervalRef.current = null;
      }
      if ([CALL_STATES.CALLING, CALL_STATES.RINGING, CALL_STATES.CONNECTING, CALL_STATES.CONNECTED, CALL_STATES.RECONNECTING].includes(callStateRef.current)) {
        updateCallState(CALL_STATES.ENDED);
        cleanupCall();
      }
    };

    return () => {
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
        pingIntervalRef.current = null;
      }
      if (ws && ws.readyState !== WebSocket.CLOSED) {
        try { ws.close(); } catch (e) {}
      }
      wsRef.current = null;
    };
  }, [consultationId, user?.user_id, user?.id]);

  // ── Tab Close / Beforeunload Handler ──────────────────────────────────
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (callStateRef.current !== CALL_STATES.IDLE && callStateRef.current !== CALL_STATES.ENDED) {
        sendSignal({ event: 'CALL_END', reason: 'TAB_CLOSED' });
        stopLocalMedia();
        closePeerConnection();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [sendSignal, stopLocalMedia, closePeerConnection]);

  // ── Public Actions ────────────────────────────────────────────────────

  /** Initiate a Call (Audio or Video) */
  const startCall = useCallback(async (type = 'audio') => {
    if (callStateRef.current !== CALL_STATES.IDLE) return;
    setError(null);
    callTypeRef.current = type;
    setCallType(type);

    try {
      const stream = await acquireMedia(type);
      
      // Pre-initialize RTCPeerConnection and add tracks right away
      const pc = createPeerConnection();
      stream.getTracks().forEach(track => pc.addTrack(track, stream));

      updateCallState(CALL_STATES.CALLING);
      setStuckTimeout(45000);

      const sent = sendSignal({ event: 'CALL_REQUEST', call_type: type });
      if (!sent) {
        setError('Unable to reach the server. Please check your connection.');
        updateCallState(CALL_STATES.FAILED);
        cleanupCall();
      }
    } catch (err) {
      updateCallState(CALL_STATES.FAILED);
      cleanupCall();
    }
  }, [acquireMedia, createPeerConnection, updateCallState, setStuckTimeout, sendSignal, cleanupCall]);

  /** Accept an Incoming Call */
  const acceptCall = useCallback(async (overrideType = null) => {
    if (callStateRef.current !== CALL_STATES.RINGING) return;
    setError(null);
    const type = overrideType || callTypeRef.current || 'audio';
    callTypeRef.current = type;
    setCallType(type);

    try {
      const stream = await acquireMedia(type);
      updateCallState(CALL_STATES.ACCEPTED);
      
      // Pre-initialize RTCPeerConnection and add tracks right away
      const pc = createPeerConnection();
      stream.getTracks().forEach(track => pc.addTrack(track, stream));

      sendSignal({ event: 'CALL_ACCEPT', call_type: type });
      setStuckTimeout(25000);
    } catch (err) {
      updateCallState(CALL_STATES.FAILED);
      sendSignal({ event: 'CALL_DECLINE', reason: 'MEDIA_ERROR' });
      cleanupCall();
    }
  }, [acquireMedia, createPeerConnection, updateCallState, sendSignal, setStuckTimeout, cleanupCall]);

  /** Decline incoming call */
  const declineCall = useCallback(() => {
    sendSignal({ event: 'CALL_DECLINE' });
    setIncomingCallInfo(null);
    updateCallState(CALL_STATES.IDLE);
    cleanupCall();
  }, [sendSignal, updateCallState, cleanupCall]);

  /** Cancel outgoing call before answer */
  const cancelCall = useCallback(() => {
    sendSignal({ event: 'CALL_CANCEL' });
    updateCallState(CALL_STATES.IDLE);
    cleanupCall();
  }, [sendSignal, updateCallState, cleanupCall]);

  /** End active call */
  const endCall = useCallback(() => {
    sendSignal({ event: 'CALL_END', reason: 'USER_HANGUP' });
    updateCallState(CALL_STATES.ENDED);
    cleanupCall();
  }, [sendSignal, updateCallState, cleanupCall]);

  /** Toggle microphone mute */
  const toggleMute = useCallback(() => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  }, []);

  /** Toggle webcam video track */
  const toggleVideo = useCallback(async () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoEnabled(videoTrack.enabled);
      } else {
        try {
          const videoStream = await navigator.mediaDevices.getUserMedia({
            video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' }
          });
          const newTrack = videoStream.getVideoTracks()[0];
          if (newTrack && pcRef.current) {
            localStreamRef.current.addTrack(newTrack);
            pcRef.current.addTrack(newTrack, localStreamRef.current);
            setIsVideoEnabled(true);
            attachLocalStream(localStreamRef.current);
          }
        } catch (e) {
          setError('Could not enable webcam.');
        }
      }
    }
  }, [attachLocalStream]);

  /** Clear error */
  const clearError = useCallback(() => setError(null), []);

  /** Reset to idle */
  const resetToIdle = useCallback(() => {
    cleanupCall();
    setError(null);
    setIncomingCallInfo(null);
    updateCallState(CALL_STATES.IDLE);
  }, [cleanupCall, updateCallState]);

  /** Full cleanup for logout */
  const fullCleanup = useCallback(() => {
    if (callStateRef.current !== CALL_STATES.IDLE && callStateRef.current !== CALL_STATES.ENDED) {
      sendSignal({ event: 'CALL_END', reason: 'LOGOUT' });
    }

    cleanupCall();

    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
    }
    if (wsRef.current) {
      try { wsRef.current.close(); } catch (e) {}
      wsRef.current = null;
    }

    setError(null);
    setIncomingCallInfo(null);
    setPeerName('');
    setPeerRole('');
    setCallDuration(0);
    setIsMuted(false);
    setIsVideoEnabled(true);
    setIsRemoteVideoAvailable(false);
    setIsScreenSharing(false);
    setIsRemoteScreenSharing(false);
    setNetworkQuality('EXCELLENT');
    setLatencyMs(null);
    setPacketLossPct(0);
    setReconnectCountdown(null);
    updateCallState(CALL_STATES.IDLE);
  }, [sendSignal, cleanupCall, updateCallState]);

  return {
    // State
    callState,
    callType,
    isMuted,
    isVideoEnabled,
    isRemoteVideoAvailable,
    callDuration,
    peerName,
    peerRole,
    incomingCallInfo,
    error,

    // Screen Sharing & Telemetry
    isScreenSharing,
    isRemoteScreenSharing,
    networkQuality,
    latencyMs,
    packetLossPct,
    reconnectCountdown,

    // Refs for Video Elements
    localVideoRef,
    remoteVideoRef,
    remoteAudioRef,

    // Actions
    startCall,
    acceptCall,
    declineCall,
    cancelCall,
    endCall,
    toggleMute,
    toggleVideo,
    toggleScreenShare,
    stopScreenShare,
    clearError,
    resetToIdle,
    fullCleanup,
  };
}


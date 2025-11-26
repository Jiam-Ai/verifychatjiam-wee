import { useState, useEffect, useCallback, useRef } from 'react';
import { firebaseService } from '../services/firebaseService';
import { RTC_CONFIGURATION } from '../constants';
import type { User } from '../types';
import { CallState } from '../types';

export const useWebRTC = (currentUser: User | null) => {
  const [callState, setCallState] = useState<CallState>(CallState.IDLE);
  const [callerUsername, setCallerUsername] = useState<string | null>(null);
  
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const callDocKeyRef = useRef<string | null>(null);
  
  const cleanup = useCallback(() => {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }
    remoteStreamRef.current = null;
    setCallState(CallState.IDLE);
    setCallerUsername(null);
    callDocKeyRef.current = null;
  }, []);

  const endCall = useCallback(() => {
    if (callDocKeyRef.current) {
      firebaseService.removeCall(callDocKeyRef.current);
    }
    cleanup();
  }, [cleanup]);
  
  useEffect(() => {
    if (!currentUser) return;

    const unsubscribe = firebaseService.listenForCalls(currentUser.username, (callData) => {
        if (callData) {
            if (callState === CallState.IDLE) { // An incoming call
                setCallerUsername(callData.from);
                callDocKeyRef.current = currentUser.username;
                setCallState(CallState.INCOMING);
            }
        } else { // Call document was deleted (hang up)
            if (callDocKeyRef.current === currentUser.username) {
                cleanup();
            }
        }
    });

    return () => {
      unsubscribe();
      if (callState !== CallState.IDLE) {
          endCall();
      }
    }
  }, [currentUser, callState, cleanup, endCall]);

  const createPeerConnection = useCallback(() => {
      const pc = new RTCPeerConnection(RTC_CONFIGURATION);
      
      pc.ontrack = event => {
        remoteStreamRef.current = event.streams[0];
        setCallState(CallState.CONNECTED);
      };

      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => pc.addTrack(track, localStreamRef.current!));
      }

      return pc;
  }, []);


  const initiateCall = useCallback(async (targetUsername: string) => {
    if (!currentUser || callState !== CallState.IDLE) return;
    
    callDocKeyRef.current = targetUsername;
    setCallState(CallState.OUTGOING);
    setCallerUsername(targetUsername);

    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        localStreamRef.current = stream;
        
        const pc = createPeerConnection();
        peerConnectionRef.current = pc;

        // Listen for remote ICE candidates
        const unsubscribe = firebaseService.listenForCallUpdates(targetUsername, (callData) => {
            if (callData?.calleeCandidates) {
                Object.values(callData.calleeCandidates).forEach(candidate => {
                    pc.addIceCandidate(new RTCIceCandidate(candidate as RTCIceCandidateInit));
                });
            }
            if (callData?.answer) {
                 if (pc.signalingState !== "stable") {
                    pc.setRemoteDescription(new RTCSessionDescription(callData.answer));
                 }
            }
             if (!callData) { // If callee hangs up before answering
                endCall();
            }
        });
        
        pc.onicecandidate = event => {
          if (event.candidate) {
            firebaseService.sendIceCandidate(targetUsername, event.candidate.toJSON(), 'callerCandidates');
          }
        };

        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        await firebaseService.createCall(targetUsername, {
            offer: { type: offer.type, sdp: offer.sdp },
            from: currentUser.username,
        });

    } catch (error) {
        console.error("Error initiating call:", error);
        endCall();
    }
  }, [currentUser, callState, createPeerConnection, endCall]);

  const answerCall = useCallback(async () => {
    if (!currentUser || callState !== CallState.INCOMING) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      localStreamRef.current = stream;
      
      const pc = createPeerConnection();
      peerConnectionRef.current = pc;
      
      const callData = await firebaseService.getUserData(`calls/${currentUser.username}`);
      if (callData?.offer) {
        
        // Listen for caller's ICE candidates
        const unsubscribe = firebaseService.listenForCallUpdates(currentUser.username, (data) => {
            if (data?.callerCandidates) {
                 Object.values(data.callerCandidates).forEach(candidate => {
                    pc.addIceCandidate(new RTCIceCandidate(candidate as RTCIceCandidateInit));
                });
            }
        });
        
        pc.onicecandidate = event => {
            if (event.candidate) {
                firebaseService.sendIceCandidate(currentUser.username, event.candidate.toJSON(), 'calleeCandidates');
            }
        };

        await pc.setRemoteDescription(new RTCSessionDescription(callData.offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        await firebaseService.sendAnswer(currentUser.username, { type: answer.type, sdp: answer.sdp });
        
        setCallState(CallState.CONNECTED);
      }
    } catch (error) {
      console.error("Error answering call:", error);
      endCall();
    }
  }, [currentUser, callState, createPeerConnection, endCall]);


  return { callState, callerUsername, remoteStream: remoteStreamRef.current, initiateCall, answerCall, endCall, isDuringCall: callState !== CallState.IDLE };
};
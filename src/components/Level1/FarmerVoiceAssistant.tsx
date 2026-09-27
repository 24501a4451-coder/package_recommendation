import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Phone,
  PhoneOff,
  Volume2,
  VolumeX,
  Sparkles,
  Leaf,
  CheckCircle2,
  RefreshCw,
  FileText,
  AlertCircle,
  Clock,
  Thermometer,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Maximize2,
  Minimize2,
  Globe,
  Radio,
  Layers,
  Send,
  MessageSquare
} from 'lucide-react';
import { apiFetch } from '../../utils/api';
import {
  FarmerConversationContext,
  FarmerDetailedReport,
  ConversationTurn
} from '../../../server/ai/farmerVoiceService';
import { Level1RecommendationResult } from '../../../server/engines/levelEngines';
import { FarmerReportModal } from './FarmerReportModal';

interface Props {
  onSyncParameters?: (params: {
    commodityName?: string;
    storageTempC?: number;
    transportDays?: number;
    refrigeration?: boolean;
    packagingFormat?: string;
  }) => void;
}

export const FarmerVoiceAssistant: React.FC<Props> = ({ onSyncParameters }) => {
  // Call States (Gemini Live / Siri / DeepSeek Call Paradigm)
  const [callActive, setCallActive] = useState(false);
  const [callMinimized, setCallMinimized] = useState(false);
  const [callDurationSeconds, setCallDurationSeconds] = useState(0);

  // Sub-States: 'idle' | 'listening' | 'user_speaking' | 'thinking' | 'speaking'
  const [callSubState, setCallSubState] = useState<'idle' | 'listening' | 'user_speaking' | 'thinking' | 'speaking'>('idle');
  const [micMuted, setMicMuted] = useState(false);
  const [speakerMuted, setSpeakerMuted] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<'en' | 'hi' | 'te' | 'ta' | 'kn'>('en');

  // Real-Time Audio Level (0-100) for dynamic waveform
  const [audioLevel, setAudioLevel] = useState(0);
  const [waveFrequencies, setWaveFrequencies] = useState<number[]>([15, 25, 40, 60, 80, 60, 40, 25, 15, 30, 50, 70, 50, 30, 20, 10]);

  // Conversation & Subtitle State
  const [messages, setMessages] = useState<ConversationTurn[]>([
    {
      role: 'assistant',
      content: "Namaste! I am your Kisan Packaging Buddy. Tap 'Start Live Voice Call' to speak with me in English, Telugu, Hindi, Tamil, or Kannada.",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [currentAssistantSpeech, setCurrentAssistantSpeech] = useState<string>('');
  const [textInput, setTextInput] = useState('');
  const [currentContext, setCurrentContext] = useState<FarmerConversationContext>({});
  const [activeProvider, setActiveProvider] = useState<string>('FOODPACK-AI Multilingual Voice Call Core');
  const [showTranscriptDrawer, setShowTranscriptDrawer] = useState(false);

  // Recommendation & Report
  const [recommendation, setRecommendation] = useState<Level1RecommendationResult | null>(null);
  const [detailedReport, setDetailedReport] = useState<FarmerDetailedReport | null>(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Audio References
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const recognitionRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const timerIntervalRef = useRef<any>(null);
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const speechTimeoutRef = useRef<any>(null);

  // Mutable state trackers for callbacks
  const callActiveRef = useRef(false);
  const micMutedRef = useRef(false);
  const selectedLangRef = useRef(selectedLanguage);
  const isSpeakingRef = useRef(false);
  const lastSpeechTimeRef = useRef(Date.now());
  const speechDetectedRef = useRef(false);
  const currentContextRef = useRef<FarmerConversationContext>(currentContext);
  const messagesRef = useRef<ConversationTurn[]>(messages);

  useEffect(() => {
    callActiveRef.current = callActive;
  }, [callActive]);

  useEffect(() => {
    micMutedRef.current = micMuted;
  }, [micMuted]);

  useEffect(() => {
    selectedLangRef.current = selectedLanguage;
  }, [selectedLanguage]);

  useEffect(() => {
    currentContextRef.current = currentContext;
  }, [currentContext]);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  // Call duration timer
  useEffect(() => {
    if (callActive) {
      setCallDurationSeconds(0);
      timerIntervalRef.current = setInterval(() => {
        setCallDurationSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      setCallDurationSeconds(0);
    }
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [callActive]);

  // Auto-scroll transcript drawer
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  }, [messages, liveTranscript, callSubState]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopAudioCapture();
      stopSpeaking();
    };
  }, []);

  const formatCallTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remaining = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remaining.toString().padStart(2, '0')}`;
  };

  /**
   * Initializes Web Audio API for Live Waveform & Voice Activity Detection (VAD)
   */
  const initAudioStream = async (): Promise<boolean> => {
    try {
      if (micStreamRef.current && audioContextRef.current) {
        return true;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      micStreamRef.current = stream;

      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioCtx();
      if (audioCtx.state === 'suspended') {
        await audioCtx.resume();
      }
      audioContextRef.current = audioCtx;

      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      analyser.smoothingTimeConstant = 0.6;
      source.connect(analyser);
      analyserRef.current = analyser;

      // Initialize MediaRecorder for dual-track audio fallback
      audioChunksRef.current = [];
      const recorder = new MediaRecorder(stream);
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      mediaRecorderRef.current = recorder;

      // Start continuous audio level monitoring loop
      startVADLoop();
      return true;
    } catch (err: any) {
      console.warn('Microphone stream access error:', err);
      setErrorMessage('Microphone access was denied. Please allow microphone permission in your browser to talk.');
      return false;
    }
  };

  /**
   * Continuous Voice Activity Detection (VAD) loop
   */
  const startVADLoop = () => {
    const updateAudio = () => {
      if (!analyserRef.current || !callActiveRef.current) {
        animFrameRef.current = requestAnimationFrame(updateAudio);
        return;
      }

      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
      analyserRef.current.getByteFrequencyData(dataArray);

      // Calculate average volume
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        sum += dataArray[i];
      }
      const avg = sum / dataArray.length;
      const level = Math.min(100, Math.round((avg / 128) * 100));
      setAudioLevel(level);

      // Create animated wave frequencies
      const freqs = Array.from(dataArray.slice(0, 16)).map((val) => Math.max(10, Math.round((val / 255) * 100)));
      setWaveFrequencies(freqs.length >= 16 ? freqs : [20, 40, 60, 80, 60, 40, 20, 30, 50, 70, 50, 30, 20, 15, 10, 5]);

      // Voice Activity Detection: If user is making sound while we are listening
      if (!isSpeakingRef.current && !micMutedRef.current) {
        if (level > 15) {
          lastSpeechTimeRef.current = Date.now();
          if (!speechDetectedRef.current) {
            speechDetectedRef.current = true;
            setCallSubState('user_speaking');
          }
        } else if (speechDetectedRef.current) {
          // If silence detected for 1.3 seconds after speech
          const silenceDuration = Date.now() - lastSpeechTimeRef.current;
          if (silenceDuration > 1300) {
            speechDetectedRef.current = false;
            handleSilenceTurn();
          }
        }
      }

      animFrameRef.current = requestAnimationFrame(updateAudio);
    };

    animFrameRef.current = requestAnimationFrame(updateAudio);
  };

  const handleSilenceTurn = () => {
    // If Web Speech API captured text, it will already be submitted by onresult.
    // If not, trigger recording chunk fallback
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      try {
        mediaRecorderRef.current.stop();
      } catch (e) {}
    }
  };

  const stopAudioCapture = () => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
      recognitionRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      try {
        mediaRecorderRef.current.stop();
      } catch (e) {}
    }
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((track) => track.stop());
      micStreamRef.current = null;
    }
    if (audioContextRef.current) {
      try {
        audioContextRef.current.close();
      } catch (e) {}
      audioContextRef.current = null;
    }
  };

  const stopSpeaking = () => {
    if (speechTimeoutRef.current) {
      clearTimeout(speechTimeoutRef.current);
      speechTimeoutRef.current = null;
    }
    if (currentAudioRef.current) {
      try {
        currentAudioRef.current.pause();
        currentAudioRef.current.currentTime = 0;
      } catch (e) {}
      currentAudioRef.current = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch (e) {}
    }
    isSpeakingRef.current = false;
    currentUtteranceRef.current = null;
    setCurrentAssistantSpeech('');
  };

  /**
   * Speaks aloud with native server TTS audio (Telugu, Hindi, English, etc.)
   * and robust acoustic echo prevention.
   */
  const speakText = (text: string, lang: string = selectedLanguage): Promise<void> => {
    return new Promise((resolve) => {
      stopSpeaking();
      setCurrentAssistantSpeech(text);

      if (speakerMuted) {
        setTimeout(() => {
          resolve();
          if (callActiveRef.current && !micMutedRef.current) {
            startListeningSession();
          }
        }, 1200);
        return;
      }

      // Immediately abort recognition so assistant speaker audio is NEVER captured by microphone
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {}
        recognitionRef.current = null;
      }

      isSpeakingRef.current = true;
      setCallSubState('speaking');

      let resolved = false;
      const finish = () => {
        if (resolved) return;
        resolved = true;
        isSpeakingRef.current = false;
        if (speechTimeoutRef.current) {
          clearTimeout(speechTimeoutRef.current);
          speechTimeoutRef.current = null;
        }
        currentUtteranceRef.current = null;
        currentAudioRef.current = null;
        setCallSubState('idle');
        resolve();

        // 600ms acoustic grace period for speaker decay before re-arming the microphone
        if (callActiveRef.current && !micMutedRef.current) {
          setTimeout(() => {
            if (callActiveRef.current && !micMutedRef.current && !isSpeakingRef.current) {
              startListeningSession();
            }
          }, 600);
        }
      };

      // 1. Primary: High-fidelity Server Audio TTS (guarantees real Telugu, Hindi, Tamil, Kannada audio)
      const tryServerAudio = async (): Promise<boolean> => {
        try {
          const res = await apiFetch('/api/voice/tts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text, language: lang })
          });

          if (res.ok) {
            const blob = await res.blob();
            if (blob && blob.size > 200) {
              const audioUrl = URL.createObjectURL(blob);
              const audio = new Audio(audioUrl);
              currentAudioRef.current = audio;

              audio.onended = () => {
                URL.revokeObjectURL(audioUrl);
                finish();
              };

              audio.onerror = () => {
                URL.revokeObjectURL(audioUrl);
                fallbackBrowserTTS();
              };

              // Safety timeout
              const wordCount = (text || '').split(' ').length;
              const maxDurationMs = Math.max(4000, wordCount * 500 + 3000);
              speechTimeoutRef.current = setTimeout(finish, maxDurationMs);

              await audio.play();
              return true;
            }
          }
        } catch (err) {
          console.warn('Server TTS fetch error, switching to browser synthesis fallback:', err);
        }
        return false;
      };

      // 2. Fallback: Browser Web Speech Synthesis
      const fallbackBrowserTTS = () => {
        if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
          finish();
          return;
        }

        try {
          window.speechSynthesis.resume();
          const utterance = new SpeechSynthesisUtterance(text);
          currentUtteranceRef.current = utterance;

          const langMap: Record<string, string> = {
            en: 'en-IN',
            hi: 'hi-IN',
            te: 'te-IN',
            ta: 'ta-IN',
            kn: 'kn-IN'
          };
          utterance.lang = langMap[lang] || 'en-IN';
          utterance.rate = 1.0;
          utterance.pitch = 1.0;

          utterance.onend = finish;
          utterance.onerror = finish;

          const wordCount = (text || '').split(' ').length;
          const maxDurationMs = Math.max(3000, wordCount * 380 + 1500);
          speechTimeoutRef.current = setTimeout(finish, maxDurationMs);

          window.speechSynthesis.speak(utterance);
        } catch (err) {
          console.warn('Speech synthesis error:', err);
          finish();
        }
      };

      tryServerAudio().then((played) => {
        if (!played) {
          fallbackBrowserTTS();
        }
      });
    });
  };

  /**
   * Starts active microphone speech recognition session
   */
  const startListeningSession = () => {
    if (!callActiveRef.current || micMutedRef.current || isSpeakingRef.current) return;

    setCallSubState('listening');
    setLiveTranscript('');
    speechDetectedRef.current = false;
    lastSpeechTimeRef.current = Date.now();

    // Start MediaRecorder chunk recording
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'inactive') {
      audioChunksRef.current = [];
      try {
        mediaRecorderRef.current.start(1000);
      } catch (e) {}
    }

    // Initialize W3C Web Speech Recognition
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      try {
        if (recognitionRef.current) {
          try {
            recognitionRef.current.stop();
          } catch (e) {}
        }

        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;

        const langMap: Record<string, string> = {
          en: 'en-IN',
          hi: 'hi-IN',
          te: 'te-IN',
          ta: 'ta-IN',
          kn: 'kn-IN'
        };
        recognition.lang = langMap[selectedLangRef.current] || 'en-IN';

        recognition.onstart = () => {
          if (!isSpeakingRef.current) {
            setCallSubState('listening');
          }
        };

        recognition.onresult = (event: any) => {
          let interim = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              const finalTranscript = event.results[i][0].transcript;
              setLiveTranscript('');
              handleUserSpeechInput(finalTranscript);
              return;
            } else {
              interim += event.results[i][0].transcript;
            }
          }
          setLiveTranscript(interim);
          if (interim.trim()) {
            setCallSubState('user_speaking');
            lastSpeechTimeRef.current = Date.now();
          }
        };

        recognition.onerror = (event: any) => {
          if (event.error !== 'no-speech' && event.error !== 'aborted') {
            console.warn('Speech recognition warning:', event.error);
          }
          // If speech recognition aborted, gently fall back to MediaRecorder audio chunk
          if (event.error === 'network' || event.error === 'not-allowed') {
            fallbackToServerAudioTranscription();
          }
        };

        recognition.onend = () => {
          // If listening ended and nothing was captured, keep ready
          if (callActiveRef.current && !isSpeakingRef.current && !micMutedRef.current && callSubState === 'listening') {
            setTimeout(() => {
              if (callActiveRef.current && !isSpeakingRef.current && !micMutedRef.current) {
                startListeningSession();
              }
            }, 500);
          }
        };

        recognition.start();
        recognitionRef.current = recognition;
      } catch (err: any) {
        console.warn('Failed to start SpeechRecognition:', err);
      }
    }
  };

  /**
   * Fallback: If Web Speech recognition fails in browser/iframe, send recorded audio chunk to server
   */
  const fallbackToServerAudioTranscription = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.onstop = async () => {
        if (audioChunksRef.current.length === 0) return;
        setCallSubState('thinking');
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const base64Audio = reader.result as string;
          try {
            const res = await apiFetch('/api/voice/transcribe', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                audioBase64: base64Audio,
                mimeType: 'audio/webm',
                language: selectedLangRef.current
              })
            });
            if (res.ok) {
              const data = await res.json();
              if (data.text && data.text.trim()) {
                handleUserSpeechInput(data.text);
                return;
              }
            }
          } catch (err) {
            console.warn('Audio transcribe fallback failed:', err);
          }
          // Re-listen if empty
          if (callActiveRef.current && !micMutedRef.current) {
            startListeningSession();
          }
        };
      };
    }
  };

  /**
   * Main conversational turn: Sends spoken/typed message to server
   */
  const handleUserSpeechInput = async (spokenText: string) => {
    const text = spokenText.trim();
    if (!text) {
      if (callActiveRef.current && !micMutedRef.current) {
        startListeningSession();
      }
      return;
    }

    // Stop listening while assistant thinks and speaks
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }
    setCallSubState('thinking');
    setLiveTranscript('');
    setErrorMessage(null);

    const farmerMsg: ConversationTurn = {
      role: 'farmer',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    const baseHistory = messagesRef.current.length > 0 ? messagesRef.current : messages;
    const updatedMessages = [...baseHistory, farmerMsg];
    messagesRef.current = updatedMessages;
    setMessages(updatedMessages);

    const activeContext = {
      ...(currentContextRef.current || {}),
      ...(currentContext || {})
    };

    try {
      const res = await apiFetch('/api/voice/farmer-converse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          history: updatedMessages,
          currentContext: activeContext,
          language: selectedLangRef.current
        })
      });

      if (!res.ok) throw new Error(`Server returned HTTP ${res.status}`);

      const data = await res.json();
      const assistantReply = data.reply || "I am calculating your produce packaging requirements.";

      // Handle automatic language switch command from user
      let replyLanguage = selectedLangRef.current;
      if (data.detectedLanguage && data.detectedLanguage !== selectedLangRef.current) {
        const newLang = data.detectedLanguage as 'en' | 'hi' | 'te' | 'ta' | 'kn';
        setSelectedLanguage(newLang);
        selectedLangRef.current = newLang;
        replyLanguage = newLang;
      }

      const assistantMsg: ConversationTurn = {
        role: 'assistant',
        content: assistantReply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      const finalMessages = [...updatedMessages, assistantMsg];
      messagesRef.current = finalMessages;
      setMessages(finalMessages);

      // Update structured context
      if (data.updatedContext) {
        currentContextRef.current = data.updatedContext;
        setCurrentContext(data.updatedContext);
        if (onSyncParameters) {
          onSyncParameters({
            commodityName: data.updatedContext.commodity,
            storageTempC: data.updatedContext.storageTemperature,
            transportDays: data.updatedContext.transportDurationDays,
            refrigeration: data.updatedContext.refrigeration
          });
        }
      }

      if (data.provider) {
        setActiveProvider(data.provider);
      }

      // If recommendation is ready, set results
      if (data.readyForRecommendation && data.recommendation) {
        setRecommendation(data.recommendation);
        if (data.detailedReport) {
          setDetailedReport(data.detailedReport);
        }
      }

      // Speak reply aloud (continuous hands-free loop triggers automatically when speech ends)
      await speakText(assistantReply, replyLanguage);
    } catch (err: any) {
      console.error('Conversation turn error:', err);
      setErrorMessage(err?.message || 'Call network error. Please try speaking again.');
      setCallSubState('idle');
      if (callActiveRef.current && !micMutedRef.current) {
        setTimeout(startListeningSession, 1200);
      }
    }
  };

  /**
   * Start Live Voice Call
   */
  const handleStartCall = async () => {
    stopSpeaking();
    setErrorMessage(null);

    // Request actual microphone permission & initialize Web Audio
    const streamOk = await initAudioStream();
    if (!streamOk) return;

    setCallActive(true);
    callActiveRef.current = true;
    setMicMuted(false);
    micMutedRef.current = false;
    setCallMinimized(false);

    // If starting fresh or prior harvest completed, initialize clean context
    if (recommendation || !currentContextRef.current.commodity) {
      currentContextRef.current = {};
      setCurrentContext({});
      setRecommendation(null);
      setDetailedReport(null);
    }

    const greetings: Record<string, string> = {
      en: "Namaste! I'm your Kisan Packaging Buddy. Tell me what crop you are harvesting, and where or how far you plan to transport it.",
      te: "నమస్కారం! నేను మీ కిసాన్ ప్యాకేజింగ్ మిత్రుడిని. మీరు ఏ పంటను ప్యాక్ చేయాలనుకుంటున్నారు? మార్కెట్‌కు ఎన్ని రోజులు పడుతుంది?",
      hi: "नमस्ते! मैं आपका किसान पैकेजिंग साथी हूँ। आप कौन सी ताज़ा फसल पैक करने जा रहे हैं, और इसे मंडी तक पहुँचाने में कितने दिन लगेंगे?",
      ta: "வணக்கம்! நான் உங்கள் பேக்கேஜிங் நண்பன். நீங்கள் என்ன பயிரை பேக் செய்ய திட்டமிட்டுள்ளீர்கள்?",
      kn: "ನಮಸ್ಕಾರ! ನಾನು ನಿಮ್ಮ ಪ್ಯಾಕೇಜಿಂಗ್ ಸ್ನೇಹಿತ. ನೀವು ಯಾವ ಬೆಳೆಯನ್ನು ಪ್ಯಾಕ್ ಮಾಡಲು ಬಯಸುತ್ತೀರಿ?"
    };

    const initialGreeting = greetings[selectedLanguage] || greetings.en;
    const greetingMsg: ConversationTurn = {
      role: 'assistant',
      content: initialGreeting,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    const updatedWithGreeting = [...messagesRef.current, greetingMsg];
    messagesRef.current = updatedWithGreeting;
    setMessages(updatedWithGreeting);

    // Speak initial greeting aloud; automatically listens when finished!
    await speakText(initialGreeting, selectedLanguage);
  };

  /**
   * End Voice Call
   */
  const handleEndCall = () => {
    stopSpeaking();
    stopAudioCapture();
    setCallActive(false);
    callActiveRef.current = false;
    setCallSubState('idle');
    setLiveTranscript('');
    setAudioLevel(0);
  };

  const handleToggleMute = () => {
    if (micMuted) {
      setMicMuted(false);
      micMutedRef.current = false;
      if (callSubState === 'idle') {
        startListeningSession();
      }
    } else {
      setMicMuted(true);
      micMutedRef.current = true;
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
      setCallSubState('idle');
    }
  };

  const handleSwitchLanguage = (lang: 'en' | 'hi' | 'te' | 'ta' | 'kn') => {
    setSelectedLanguage(lang);
    selectedLangRef.current = lang;
    stopSpeaking();

    const switchAcknowledgements: Record<string, string> = {
      en: "Switched to English. Tell me about your crop or ask any packaging question.",
      te: "తెలుగులోకి మార్చబడింది. మీ పంట వివరాలు చెప్పండి, తగిన ప్యాకేజింగ్ లెక్కించుతాను.",
      hi: "भाषा हिंदी में बदल दी गई है। अपनी फसल और मंडी की दूरी के बारे में बताएं।",
      ta: "மொழியை தமிழாக மாற்றியுள்ளேன். உங்கள் பயிர் விவரங்களை கூறுங்கள்.",
      kn: "ಕನ್ನಡಕ್ಕೆ ಬದಲಾಯಿಸಲಾಗಿದೆ. ನಿಮ್ಮ ಬೆಳೆಯ ವಿವರಗಳನ್ನು ತಿಳಿಸಿ."
    };

    const ack = switchAcknowledgements[lang];
    setMessages((prev) => [
      ...prev,
      {
        role: 'assistant',
        content: ack,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
    speakText(ack, lang);
  };

  const handleSendTextMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!textInput.trim()) return;
    const msg = textInput;
    setTextInput('');
    handleUserSpeechInput(msg);
  };

  return (
    <div className="space-y-6 font-sans text-slate-200">
      
      {/* ========================================================================= */}
      {/* 1. CALL DOCK & INITIATION CARD */}
      {/* ========================================================================= */}
      {!callActive ? (
        <div className="bg-gradient-to-r from-emerald-950/80 via-slate-900 to-indigo-950/80 border border-emerald-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-xl">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
                  <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
                  Real-Time Voice Call Assistant (Gemini Live / DeepSeek Audio Call)
                </span>
                <span className="text-[10px] font-mono text-slate-400">
                  Full Duplex • Real-time Speech
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Live Voice Call with Packaging Buddy
              </h2>
              <p className="text-xs text-slate-300 leading-relaxed">
                Connect on a direct voice call. Just talk naturally in English, Telugu, Hindi, Tamil, or Kannada. Speak to it, interrupt it anytime, or say: <em className="text-emerald-300 font-semibold">"Speak in Telugu"</em>, and it adapts on the fly.
              </p>

              {/* Language Pills */}
              <div className="flex flex-wrap items-center gap-2 pt-2">
                <span className="text-[10px] font-mono text-slate-400 mr-1 flex items-center gap-1">
                  <Globe className="w-3 h-3 text-emerald-400" /> Start call in:
                </span>
                {[
                  { code: 'en', label: 'English (IN)' },
                  { code: 'te', label: 'తెలుగు (Telugu)' },
                  { code: 'hi', label: 'हिंदी (Hindi)' },
                  { code: 'ta', label: 'தமிழ் (Tamil)' },
                  { code: 'kn', label: 'ಕನ್ನಡ (Kannada)' }
                ].map((l) => (
                  <button
                    key={l.code}
                    type="button"
                    onClick={() => setSelectedLanguage(l.code as any)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer border ${
                      selectedLanguage === l.code
                        ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300 shadow-sm'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Big Green Start Call Button */}
            <div className="shrink-0 flex flex-col items-center gap-2 w-full md:w-auto">
              <button
                type="button"
                onClick={handleStartCall}
                className="w-full md:w-auto px-8 py-5 rounded-2xl bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-extrabold text-base shadow-2xl shadow-emerald-500/30 transition transform hover:-translate-y-0.5 active:scale-95 cursor-pointer flex items-center justify-center gap-3"
              >
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center animate-pulse">
                  <Phone className="w-5 h-5 text-white" />
                </div>
                <span>Start Live Voice Call</span>
              </button>
              <span className="text-[11px] text-slate-400 font-mono">
                Hands-Free Audio Stream • Auto Speech Detection
              </span>
            </div>
          </div>
        </div>
      ) : null}

      {/* ========================================================================= */}
      {/* 2. ACTIVE LIVE VOICE CALL INTERFACE (FULL SCREEN / EXPANDED CALL MODE) */}
      {/* ========================================================================= */}
      {callActive && !callMinimized ? (
        <div className="bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 border-2 border-emerald-500/50 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden space-y-6">
          
          {/* Top Bar of Call */}
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-3.5 h-3.5 rounded-full bg-emerald-400 animate-ping" />
              <div>
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-400 block">
                  Active Live Voice Call • Connected
                </span>
                <span className="text-sm font-bold text-white font-mono">
                  Duration: {formatCallTime(callDurationSeconds)}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Dynamic Language Switcher Pills */}
              <div className="hidden sm:flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-[11px]">
                {[
                  { code: 'en', label: 'EN' },
                  { code: 'te', label: 'తెలుగు' },
                  { code: 'hi', label: 'हिंदी' },
                  { code: 'ta', label: 'தமிழ்' },
                  { code: 'kn', label: 'ಕನ್ನಡ' }
                ].map((l) => (
                  <button
                    key={l.code}
                    type="button"
                    onClick={() => handleSwitchLanguage(l.code as any)}
                    className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                      selectedLanguage === l.code
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {l.label}
                  </button>
                ))}
              </div>

              {/* Minimize Call */}
              <button
                type="button"
                onClick={() => setCallMinimized(true)}
                className="p-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition cursor-pointer"
                title="Minimize Call to browse produce"
              >
                <Minimize2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* MAIN CALL SCREEN: ANIMATED VOICE ORB & REAL-TIME AUDIO FREQUENCY BARS */}
          <div className="py-6 sm:py-8 flex flex-col items-center justify-center text-center space-y-6">
            
            {/* The Gemini Live Voice Orb */}
            <div
              onClick={() => {
                if (callSubState === 'speaking') {
                  stopSpeaking();
                  startListeningSession();
                } else if (callSubState === 'idle') {
                  startListeningSession();
                }
              }}
              className="relative w-44 h-44 sm:w-52 sm:h-52 flex items-center justify-center cursor-pointer select-none group"
              title={callSubState === 'speaking' ? 'Tap to interrupt buddy' : 'Live Call Orb'}
            >
              {/* Outer Pulsing Glow Rings */}
              <div
                className={`absolute inset-0 rounded-full transition-all duration-500 blur-xl ${
                  callSubState === 'listening' || callSubState === 'user_speaking'
                    ? 'bg-emerald-500/40 scale-125 animate-pulse'
                    : callSubState === 'speaking'
                    ? 'bg-indigo-500/40 scale-135 animate-ping'
                    : callSubState === 'thinking'
                    ? 'bg-amber-500/30 scale-110 animate-spin'
                    : 'bg-emerald-500/10 scale-100'
                }`}
              />

              {/* Inner Glowing Spheres with Dynamic Audio Amplitude Reaction */}
              <div
                style={{
                  transform: `scale(${1 + (audioLevel / 350)})`
                }}
                className={`w-36 h-36 sm:w-44 sm:h-44 rounded-full p-1 shadow-2xl transition transform duration-200 flex items-center justify-center ${
                  callSubState === 'user_speaking'
                    ? 'bg-gradient-to-tr from-emerald-400 via-teal-300 to-cyan-200 shadow-emerald-400/60 ring-4 ring-emerald-400/50'
                    : callSubState === 'listening'
                    ? 'bg-gradient-to-tr from-emerald-500 via-teal-400 to-cyan-300 shadow-emerald-500/50'
                    : callSubState === 'speaking'
                    ? 'bg-gradient-to-tr from-indigo-600 via-purple-500 to-pink-400 shadow-indigo-500/50'
                    : callSubState === 'thinking'
                    ? 'bg-gradient-to-tr from-amber-500 via-orange-400 to-yellow-300 animate-pulse shadow-amber-500/40'
                    : 'bg-gradient-to-tr from-slate-800 via-slate-700 to-emerald-900'
                }`}
              >
                <div className="w-full h-full rounded-full bg-slate-950/85 backdrop-blur-md flex flex-col items-center justify-center p-4">
                  {callSubState === 'user_speaking' || callSubState === 'listening' ? (
                    <div className="flex flex-col items-center gap-1.5 text-emerald-300">
                      {/* REAL AUDIO FREQUENCY WAVEFORM JUMPING WITH USER VOICE */}
                      <div className="flex items-center gap-1 h-10">
                        {waveFrequencies.slice(0, 9).map((val, i) => (
                          <span
                            key={i}
                            style={{ height: `${Math.max(6, Math.min(36, (val / 100) * 36))}px` }}
                            className="w-1.5 bg-emerald-400 rounded-full transition-all duration-75"
                          />
                        ))}
                      </div>
                      <span className="text-[11px] font-mono uppercase font-bold tracking-wider mt-1 text-emerald-300">
                        {callSubState === 'user_speaking' ? '🗣️ Hearing You...' : '🎙️ Listening...'}
                      </span>
                    </div>
                  ) : callSubState === 'speaking' ? (
                    <div className="flex flex-col items-center gap-1.5 text-indigo-300">
                      <Volume2 className="w-9 h-9 text-indigo-400 animate-pulse" />
                      <span className="text-[10px] font-mono uppercase font-bold tracking-wider">
                        Buddy Speaking
                      </span>
                      <span className="text-[9px] text-slate-400">(Tap orb to interrupt)</span>
                    </div>
                  ) : callSubState === 'thinking' ? (
                    <div className="flex flex-col items-center gap-1.5 text-amber-300">
                      <Sparkles className="w-8 h-8 text-amber-400 animate-spin" />
                      <span className="text-[10px] font-mono uppercase font-bold tracking-wider">
                        Calculating...
                      </span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-1.5 text-slate-400">
                      <Leaf className="w-8 h-8 text-emerald-400/80" />
                      <span className="text-[10px] font-mono uppercase font-bold tracking-wider">
                        Packaging Buddy
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* LIVE SUBTITLE & CAPTION (REAL-TIME RESPONSIVENESS) */}
            <div className="max-w-xl mx-auto min-h-[50px] flex flex-col items-center justify-center px-4 space-y-1">
              {liveTranscript ? (
                <p className="text-base text-emerald-300 font-medium italic animate-pulse">
                  "{liveTranscript}"
                </p>
              ) : currentAssistantSpeech ? (
                <div className="p-3 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 text-indigo-200 text-sm leading-relaxed max-w-lg shadow-sm">
                  <span className="text-[10px] font-mono font-bold text-indigo-400 block mb-0.5">
                    🔊 Buddy is saying:
                  </span>
                  "{currentAssistantSpeech}"
                </div>
              ) : callSubState === 'listening' ? (
                <p className="text-xs text-slate-300">
                  Speak into your microphone now. Tell it your crop, days to market, or say <strong className="text-emerald-300">"Speak in Telugu"</strong>...
                </p>
              ) : callSubState === 'user_speaking' ? (
                <p className="text-xs text-emerald-300 font-semibold">
                  Recording your speech... (Pause for a second when finished)
                </p>
              ) : callSubState === 'thinking' ? (
                <p className="text-xs text-amber-300">
                  Evaluating biological respiration kinetics and packaging requirements...
                </p>
              ) : (
                <p className="text-xs text-slate-500">
                  Hands-free live audio call active
                </p>
              )}
            </div>

            {/* QUICK-TALK SUGGESTION PILLS (INSTANT ONE-TAP INPUT) */}
            <div className="w-full max-w-2xl space-y-2 pt-1">
              <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block text-left">
                💡 Quick Voice Prompts (Tap to say instantly):
              </span>
              <div className="flex flex-wrap items-center gap-2">
                {[
                  "I have 500kg of fresh tomatoes",
                  "Takes 2 days to reach the mandi",
                  "No cold storage, hot 30 degrees",
                  "Can I use a cheaper package?",
                  "Speak in Telugu",
                  "Speak in Hindi"
                ].map((phrase, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleUserSpeechInput(phrase)}
                    className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-xs font-medium cursor-pointer transition shadow-xs"
                  >
                    "{phrase}"
                  </button>
                ))}
              </div>
            </div>

            {/* LIVE PACKAGING CHECKLIST TILES */}
            <div className="w-full max-w-2xl bg-slate-950/80 rounded-2xl border border-slate-800/80 p-3 sm:p-4 text-xs space-y-2">
              <div className="flex items-center justify-between border-b border-slate-800/60 pb-1.5">
                <span className="text-[10px] font-mono uppercase font-bold text-slate-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  Live Harvest Understanding Checklist
                </span>
                <span className="text-[10px] font-mono text-emerald-400">
                  Real-time Decision Support
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-left">
                <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-slate-500 text-[10px] block font-mono">1. Crop / Produce</span>
                  <span className="font-bold text-white truncate block">
                    {currentContext.commodity ? `✓ ${currentContext.commodity}` : 'Waiting for name...'}
                  </span>
                </div>

                <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-slate-500 text-[10px] block font-mono">2. Transit Duration</span>
                  <span className="font-bold text-cyan-300 truncate block">
                    {currentContext.transportDurationDays ? `✓ ${currentContext.transportDurationDays} Days` : 'Waiting for days...'}
                  </span>
                </div>

                <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-slate-500 text-[10px] block font-mono">3. Temperature Chain</span>
                  <span className="font-bold text-amber-300 truncate block">
                    {currentContext.refrigeration !== undefined
                      ? currentContext.refrigeration
                        ? '✓ Cold Storage (4°C)'
                        : `✓ Ambient (${currentContext.storageTemperature || 28}°C)`
                      : 'Hot vs Cold storage?'}
                  </span>
                </div>

                <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-slate-500 text-[10px] block font-mono">4. Logistics Purpose</span>
                  <span className="font-bold text-emerald-300 truncate block">
                    {currentContext.packagingPurpose || 'Mandi Transportation'}
                  </span>
                </div>
              </div>
            </div>

            {/* IN-CALL TEXT INPUT FIELD (SO USER CAN TYPE OR SPEAK FREELY) */}
            <form onSubmit={handleSendTextMessage} className="w-full max-w-2xl flex items-center gap-2 pt-1">
              <input
                type="text"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder="Or type here if in a noisy environment (e.g. 'I have fresh strawberries')..."
                className="flex-1 bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-emerald-500 font-sans"
              />
              <button
                type="submit"
                disabled={!textInput.trim()}
                className="px-4 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs cursor-pointer disabled:opacity-40 transition flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send</span>
              </button>
            </form>

          </div>

          {/* CALL DOCK CONTROLS (Mute Mic, Speaker Mute, Transcript Toggle, Hang Up) */}
          <div className="pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-center gap-4 sm:gap-6">
            
            {/* Mute Mic */}
            <button
              type="button"
              onClick={handleToggleMute}
              className={`p-4 rounded-full transition cursor-pointer flex flex-col items-center gap-1 ${
                micMuted
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                  : 'bg-slate-800 hover:bg-slate-700 text-white'
              }`}
              title={micMuted ? 'Unmute Microphone' : 'Mute Microphone'}
            >
              {micMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              <span className="text-[10px] font-semibold">{micMuted ? 'Unmute' : 'Mute'}</span>
            </button>

            {/* Mute Assistant Speaker */}
            <button
              type="button"
              onClick={() => {
                if (!speakerMuted) stopSpeaking();
                setSpeakerMuted(!speakerMuted);
              }}
              className={`p-4 rounded-full transition cursor-pointer flex flex-col items-center gap-1 ${
                speakerMuted
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                  : 'bg-slate-800 hover:bg-slate-700 text-white'
              }`}
              title={speakerMuted ? 'Unmute Speaker' : 'Mute Speaker'}
            >
              {speakerMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              <span className="text-[10px] font-semibold">{speakerMuted ? 'Audio Off' : 'Speaker'}</span>
            </button>

            {/* Toggle In-Call Transcript Drawer */}
            <button
              type="button"
              onClick={() => setShowTranscriptDrawer(!showTranscriptDrawer)}
              className={`p-4 rounded-full transition cursor-pointer flex flex-col items-center gap-1 ${
                showTranscriptDrawer
                  ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/40'
                  : 'bg-slate-800 hover:bg-slate-700 text-white'
              }`}
              title="Show Live Transcript"
            >
              <MessageSquare className="w-5 h-5" />
              <span className="text-[10px] font-semibold">Transcript</span>
            </button>

            {/* Reset / New Harvest */}
            <button
              type="button"
              onClick={() => {
                stopSpeaking();
                currentContextRef.current = {};
                setCurrentContext({});
                const resetMsg: ConversationTurn = {
                  role: 'assistant',
                  content: selectedLanguage === 'te' 
                    ? "రీసెట్ చేయబడింది. ఏ కొత్త పంటను ప్యాక్ చేయాలనుకుంటున్నారు?" 
                    : "Reset complete. What new crop or harvest are you packing?",
                  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                };
                messagesRef.current = [resetMsg];
                setMessages([resetMsg]);
                setRecommendation(null);
                setDetailedReport(null);
                speakText(resetMsg.content, selectedLanguage);
              }}
              className="p-4 rounded-full transition cursor-pointer flex flex-col items-center gap-1 bg-slate-800 hover:bg-slate-700 text-white"
              title="Reset Conversation for a New Harvest"
            >
              <RefreshCw className="w-5 h-5 text-slate-300" />
              <span className="text-[10px] font-semibold">New Crop</span>
            </button>

            {/* End Call Button (Big Red Hang-Up) */}
            <button
              type="button"
              onClick={handleEndCall}
              className="px-6 py-4 rounded-full bg-red-600 hover:bg-red-500 text-white font-bold text-sm cursor-pointer shadow-lg shadow-red-600/40 transition transform active:scale-95 flex items-center gap-2.5"
            >
              <PhoneOff className="w-5 h-5" />
              <span>End Call</span>
            </button>
          </div>

          {/* IN-CALL COLLAPSIBLE TRANSCRIPT DRAWER */}
          {showTranscriptDrawer && (
            <div className="pt-4 border-t border-slate-800 space-y-3">
              <span className="text-xs font-mono font-bold uppercase text-slate-400 block">
                Live Conversation Log:
              </span>
              <div
                ref={scrollContainerRef}
                className="max-h-56 overflow-y-auto space-y-2 p-3 bg-slate-950 rounded-2xl border border-slate-800 text-xs"
              >
                {messages.map((m, idx) => (
                  <div
                    key={idx}
                    className={`flex flex-col ${
                      m.role === 'farmer' ? 'items-end' : 'items-start'
                    }`}
                  >
                    <div
                      className={`max-w-[85%] rounded-xl p-2.5 text-xs ${
                        m.role === 'farmer'
                          ? 'bg-emerald-600/90 text-white'
                          : 'bg-slate-900 border border-slate-800 text-slate-200'
                      }`}
                    >
                      <span className="text-[9px] block opacity-75 font-mono">
                        {m.role === 'farmer' ? '🧑‍🌾 You' : '🤝 Kisan Buddy'} • {m.timestamp}
                      </span>
                      <p className="mt-0.5">{m.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Error Banner */}
          {errorMessage && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

        </div>
      ) : null}

      {/* ========================================================================= */}
      {/* 3. MINIMIZED FLOATING CALL WIDGET (ALLOWS BROWSING PRODUCE CARDS WHILE ON CALL) */}
      {/* ========================================================================= */}
      {callActive && callMinimized ? (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900/95 backdrop-blur-xl border-2 border-emerald-500/60 rounded-3xl p-4 shadow-2xl flex items-center gap-4 text-xs font-sans animate-in slide-in-from-bottom-6">
          <div
            onClick={() => {
              if (callSubState === 'speaking') stopSpeaking();
              else startListeningSession();
            }}
            className="relative w-12 h-12 rounded-full bg-gradient-to-tr from-emerald-500 to-indigo-600 flex items-center justify-center cursor-pointer shadow-lg shadow-emerald-500/30"
          >
            {callSubState === 'user_speaking' || callSubState === 'listening' ? (
              <span className="w-3 h-3 rounded-full bg-white animate-ping" />
            ) : callSubState === 'speaking' ? (
              <Volume2 className="w-5 h-5 text-white animate-pulse" />
            ) : (
              <Phone className="w-5 h-5 text-white" />
            )}
          </div>

          <div className="space-y-0.5">
            <span className="font-bold text-white block">
              Call Active ({formatCallTime(callDurationSeconds)})
            </span>
            <span className="text-[10px] text-emerald-400 font-mono block">
              {callSubState === 'user_speaking'
                ? 'Hearing your voice...'
                : callSubState === 'listening'
                ? 'Listening to you...'
                : callSubState === 'speaking'
                ? 'Buddy speaking...'
                : 'Packaging Call Active'}
            </span>
          </div>

          <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
            <button
              type="button"
              onClick={() => setCallMinimized(false)}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white cursor-pointer"
              title="Expand Call"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleEndCall}
              className="p-2 rounded-xl bg-red-600 hover:bg-red-500 text-white cursor-pointer"
              title="Hang up"
            >
              <PhoneOff className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : null}

      {/* ========================================================================= */}
      {/* 4. FINAL RECOMMENDATION BANNER (PERSISTENT & ALWAYS VISIBLE ONCE GENERATED) */}
      {/* ========================================================================= */}
      {recommendation && (
        <div className="p-5 sm:p-6 bg-gradient-to-r from-emerald-950/70 via-slate-900 to-slate-950 rounded-3xl border-2 border-emerald-500/50 space-y-4 shadow-2xl">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full inline-block mb-1">
                ✓ Call Recommendation Ready
              </span>
              <h3 className="text-xl font-bold text-white">
                {recommendation.packagingStructure}
              </h3>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-400 block font-mono">Calculated Shelf Life</span>
              <span className="text-lg font-bold text-emerald-400 font-mono">
                {recommendation.estimatedShelfLifeDays.min} - {recommendation.estimatedShelfLifeDays.max} Days
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
              <span className="text-slate-500 text-[10px] block font-mono">Material</span>
              <span className="font-bold text-white text-sm">{recommendation.recommendedPackaging.name}</span>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
              <span className="text-slate-500 text-[10px] block font-mono">Equilibrium MAP Gas Target</span>
              <span className="font-bold text-emerald-300">
                {recommendation.mapRecommendation.targetO2Percent} O₂ / {recommendation.mapRecommendation.targetCO2Percent} CO₂
              </span>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
              <span className="text-slate-500 text-[10px] block font-mono">Micro-Perforations</span>
              <span className="font-bold text-cyan-300 font-mono">
                {recommendation.mapRecommendation.perforationDetails.required ? 'Laser Micro-Vents Active' : 'Standard Ventilation'}
              </span>
            </div>
          </div>

          {/* Action Bar */}
          <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-800/80">
            <p className="text-xs text-slate-300 italic">
              "We have engineered calibrated respiration flux so your {currentContext.commodity || 'produce'} stays fresh without condensation rotting."
            </p>

            <div className="flex items-center gap-2">
              {detailedReport && (
                <button
                  type="button"
                  onClick={() => setShowReportModal(true)}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs cursor-pointer shadow-lg shadow-emerald-600/30 flex items-center gap-2 transition"
                >
                  <FileText className="w-4 h-4" />
                  <span>View Detailed Farmer Report</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Comprehensive Report Modal */}
      {showReportModal && detailedReport && (
        <FarmerReportModal
          report={detailedReport}
          onClose={() => setShowReportModal(false)}
        />
      )}

    </div>
  );
};

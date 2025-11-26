
import React, { useEffect, useRef, useState } from 'react';
import Header from './Header';
import Footer from './Footer';
import ChatWindow from './ChatWindow';
import type { User, ChatMessage, VoiceSettings } from '../types';
import MessageAvatar from './MessageAvatar';
import { useSpeech } from '../hooks/useSpeech';
import { useLiveConversation } from '../hooks/useLiveConversation';

interface LiveConversationModalProps {
  isVisible: boolean;
  onClose: () => void;
  isConnecting: boolean;
  isSpeaking: 'user' | 'ai' | 'none';
  transcript: { user: string; ai: string };
}

const ModalAudioVisualizer: React.FC<{ status: 'idle' | 'user' | 'ai' | 'connecting' }> = ({ status }) => {
    // Dynamic styles based on status
    const statusConfig = {
        idle: {
            color: 'cyan',
            glow: 'shadow-cyan-500/50',
            bg: 'bg-cyan-500/10',
            border: 'border-cyan-500/30',
            text: 'text-cyan-300'
        },
        connecting: {
            color: 'yellow',
            glow: 'shadow-yellow-500/50',
            bg: 'bg-yellow-500/10',
            border: 'border-yellow-500/30',
            text: 'text-yellow-300'
        },
        user: { // Listening
            color: 'emerald',
            glow: 'shadow-emerald-500/50',
            bg: 'bg-emerald-500/10',
            border: 'border-emerald-500/30',
            text: 'text-emerald-300'
        },
        ai: { // Speaking
            color: 'fuchsia',
            glow: 'shadow-fuchsia-500/50',
            bg: 'bg-fuchsia-500/10',
            border: 'border-fuchsia-500/30',
            text: 'text-fuchsia-300'
        }
    };

    const currentStyle = statusConfig[status] || statusConfig.idle;

    return (
        <div className="flex flex-col items-center justify-center gap-12 relative z-10 transition-all duration-700">
            {/* The Orb Container */}
            <div className="relative w-72 h-72 flex items-center justify-center">
                
                {/* Outer Glow / Atmosphere */}
                <div className={`absolute inset-0 rounded-full blur-[60px] transition-colors duration-1000 ${currentStyle.bg.replace('/10', '/20')}`}></div>

                {/* Ripple Effect (Active states) */}
                {(status === 'user' || status === 'ai') && (
                     <>
                        <div className={`absolute inset-0 rounded-full border ${currentStyle.border} animate-ripple`}></div>
                        <div className={`absolute inset-0 rounded-full border ${currentStyle.border} animate-ripple [animation-delay:0.6s]`}></div>
                        <div className={`absolute inset-0 rounded-full border ${currentStyle.border} animate-ripple [animation-delay:1.2s]`}></div>
                     </>
                )}
                
                {/* Spinning Rings */}
                <div className="absolute inset-0 w-full h-full animate-[spin_12s_linear_infinite]">
                    <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full ${currentStyle.bg.replace('/10', '')} shadow-[0_0_10px_currentColor]`}></div>
                    <div className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full ${currentStyle.bg.replace('/10', '')} shadow-[0_0_10px_currentColor]`}></div>
                    <div className={`w-full h-full rounded-full border border-dashed ${currentStyle.border} opacity-60`}></div>
                </div>

                <div className="absolute inset-4 w-64 h-64 animate-[spin_18s_linear_infinite_reverse]">
                     <div className={`w-full h-full rounded-full border-2 border-dotted ${currentStyle.border} opacity-40`}></div>
                </div>

                <div className={`absolute inset-8 w-56 h-56 rounded-full border ${currentStyle.border} opacity-20 animate-[spin_20s_linear_infinite]`}></div>

                 {/* The Core */}
                <div className={`relative w-36 h-36 rounded-full ${currentStyle.bg} backdrop-blur-md border ${currentStyle.border} flex items-center justify-center shadow-[0_0_40px_inset] ${currentStyle.glow} transition-all duration-500 ${status === 'user' ? 'scale-110' : ''}`}>
                    <div className={`w-24 h-24 rounded-full bg-gradient-to-tr from-white/90 to-transparent opacity-90 transition-all duration-300 ${status === 'ai' ? 'animate-[pulse_0.4s_ease-in-out_infinite] scale-110' : 'animate-pulse'}`}></div>
                    
                    {/* Inner detail rings */}
                    <div className={`absolute inset-2 rounded-full border border-white/20`}></div>
                    <div className={`absolute inset-6 rounded-full border border-white/10`}></div>
                </div>

            </div>

            {/* Status Text & Indicator */}
            <div className="text-center space-y-4 animate-float">
                 <div className="flex flex-col items-center gap-2">
                     <p className={`text-3xl font-bold tracking-[0.2em] uppercase ${currentStyle.text} drop-shadow-[0_0_10px_currentColor] transition-colors duration-500`}>
                        {status === 'idle' && 'System Ready'}
                        {status === 'connecting' && 'Initializing...'}
                        {status === 'user' && 'Listening...'}
                        {status === 'ai' && 'Jiam Speaking...'}
                     </p>
                     <div className={`h-1 w-24 rounded-full bg-gradient-to-r from-transparent via-${currentStyle.color}-400 to-transparent opacity-80`}></div>
                 </div>
            </div>
        </div>
    )
};

const LiveConversationModal: React.FC<LiveConversationModalProps> = ({ isVisible, onClose, isConnecting, isSpeaking, transcript }) => {
    if (!isVisible) return null;

    const getVisualizerStatus = () => {
        if (isConnecting) return 'connecting';
        if (isSpeaking === 'user') return 'user';
        if (isSpeaking === 'ai') return 'ai';
        return 'idle';
    };

    return (
        <div className="fixed inset-0 bg-[#02050b]/95 backdrop-blur-xl flex items-center justify-center z-[100] animate-fade-in overflow-hidden">
             {/* Background Effects */}
             <div className="absolute top-[-20%] left-[-20%] w-[80%] h-[80%] bg-cyan-900/10 rounded-full blur-[150px] animate-pulse"></div>
             <div className="absolute bottom-[-20%] right-[-20%] w-[80%] h-[80%] bg-purple-900/10 rounded-full blur-[150px] animate-pulse" style={{ animationDelay: '2s' }}></div>

            <div className="relative w-full h-full flex flex-col items-center justify-center p-6 text-white max-w-5xl mx-auto">
                
                {/* Main Visualizer */}
                <div className="flex-grow flex items-center justify-center w-full">
                    <ModalAudioVisualizer status={getVisualizerStatus()} />
                </div>

                {/* Transcripts HUD */}
                <div className="w-full max-w-3xl min-h-[160px] mb-8 relative">
                    {/* HUD Frame */}
                    <div className="absolute inset-0 border-x border-white/5 bg-gradient-to-b from-transparent via-white/5 to-transparent pointer-events-none"></div>
                    <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-cyan-500/50"></div>
                    <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-cyan-500/50"></div>
                    <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-cyan-500/50"></div>
                    <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-cyan-500/50"></div>

                    <div className="relative z-10 p-6 text-center space-y-4">
                        <p className={`text-xl md:text-2xl font-light tracking-wide transition-all duration-300 ${isSpeaking === 'user' ? 'text-white opacity-100 scale-105' : 'text-gray-500 opacity-60'}`}>
                            "{transcript.user || <span className="opacity-0">...</span>}"
                        </p>
                        {transcript.ai && (
                            <div className="flex justify-center">
                                <span className="text-cyan-500 text-xs tracking-widest uppercase font-bold mr-2 mt-1">AI Response &gt;&gt;</span>
                                <p className={`text-lg md:text-xl font-medium transition-all duration-300 ${isSpeaking === 'ai' ? 'text-cyan-300 opacity-100' : 'text-gray-400 opacity-70'}`}>
                                    {transcript.ai}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
                
                {/* Controls */}
                <button 
                    onClick={onClose} 
                    className="relative group px-12 py-5 rounded-full transition-all duration-300 transform hover:scale-105 active:scale-95 mb-12
                               bg-black/60 backdrop-blur-xl border border-red-500/30 
                               shadow-[0_0_25px_-5px_rgba(220,38,38,0.4)] 
                               hover:shadow-[0_0_50px_-10px_rgba(220,38,38,0.7),inset_0_0_20px_rgba(220,38,38,0.2)]
                               hover:border-red-400 overflow-hidden flex items-center justify-center min-w-[280px]"
                >
                    {/* Animated gradient background on hover */}
                    <div className="absolute inset-0 bg-gradient-to-r from-red-600/0 via-red-600/10 to-red-600/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-in-out"></div>
                    
                    {/* Persistent weak glow */}
                    <div className="absolute inset-0 bg-red-900/10 group-hover:bg-red-900/20 transition-colors duration-300"></div>

                    <span className="relative z-10 flex items-center justify-center gap-4 font-code font-bold text-red-100 text-lg tracking-[0.15em] uppercase group-hover:text-white transition-all duration-300 drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
                         <div className="p-1 rounded-full border border-red-500/50 group-hover:border-red-400 transition-colors">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                         </div>
                        Terminate Session
                    </span>
                </button>
            </div>
        </div>
    );
};


interface ChatInterfaceProps {
  currentUser: User;
  onAdminOpen: () => void;
  onProfileOpen: () => void;
  onHistoryOpen: () => void;
  onSettingsOpen: () => void;
  onPromptLibraryOpen: () => void;
  onImageClick: (url: string) => void;
  initiateCall: (targetUsername: string) => void;
  isDuringCall: boolean;
  // Props from useChat hook
  messages: ChatMessage[];
  isLoading: boolean;
  isStreaming: boolean;
  loadingTask: 'text' | 'tool-image' | 'tool-lyrics' | 'tool-search' | 'tool-video' | null;
  sendMessage: (prompt: string, apiName?: string, imageFile?: File | null, analysisFile?: File | null) => Promise<void>;
  addMessage: (message: Omit<ChatMessage, "id" | "timestamp">) => ChatMessage;
  updateMessage: (messageId: string, updates: Partial<ChatMessage>) => void;
  startNewChat: () => void;
  memoryConfirmation: { fact: string; messageId: string; } | null;
  confirmMemory: () => Promise<void>;
  rejectMemory: () => void;
  voiceSettings: VoiceSettings;
  onToggleTts: () => void;
  stopGeneration: () => void;
  regenerateLastResponse: () => void;
  isThinkingModeEnabled: boolean;
  onToggleThinkingMode: () => void;
}

// Helper to strip markdown for clean text-to-speech output.
const removeMarkdown = (text: string): string => {
  if (!text) return '';
  return text
    // Remove code blocks entirely
    .replace(/```[\s\S]*?```/g, '')
    // Remove images, keeping alt text
    .replace(/!\[(.*?)\]\(.*?\)/g, '$1')
    // Remove links, keeping the link text
    .replace(/\[(.*?)\]\(.*?\)/g, '$1')
    // Remove headings
    .replace(/^#{1,6}\s+/gm, '')
    // Remove bold, italic, strikethrough
    .replace(/(\*\*|__)(.*?)\1/g, '$2')
    .replace(/(\*|_)(.*?)\1/g, '$2')
    .replace(/~~(.*?)~~/g, '$1')
    // Remove blockquotes
    .replace(/^>\s+/gm, '')
    // Remove list markers
    .replace(/^\s*[-*+]\s+/gm, '')
    .replace(/^\s*\d+\.\s+/gm, '')
    // Remove horizontal rules
    .replace(/^-{3,}\s*$/gm, '')
    // Collapse multiple newlines
    .replace(/\n{2,}/g, '\n')
    .trim();
};


const ChatInterface: React.FC<ChatInterfaceProps> = ({ 
  currentUser, onAdminOpen, onProfileOpen, onHistoryOpen, onSettingsOpen, onPromptLibraryOpen, onImageClick, initiateCall, isDuringCall,
  messages, isLoading, isStreaming, loadingTask, sendMessage, addMessage, updateMessage, startNewChat, memoryConfirmation, confirmMemory, rejectMemory,
  voiceSettings, onToggleTts, stopGeneration, regenerateLastResponse, isThinkingModeEnabled, onToggleThinkingMode
}) => {
  const mainRef = useRef<HTMLDivElement>(null);
  const [selectedImageApi, setSelectedImageApi] = useState('All');
  const [inputValue, setInputValue] = useState('');
  const [stagedImage, setStagedImage] = useState<File | null>(null);
  const [stagedFile, setStagedFile] = useState<File | null>(null);
  const [isCommandMode, setIsCommandMode] = useState(false);
  const [isLiveModalVisible, setIsLiveModalVisible] = useState(false);

  const { isLive, isConnecting, isSpeaking, startLiveSession, stopLiveSession, liveTranscript } = useLiveConversation(addMessage, updateMessage);

  const handleCommand = (command: string, arg?: string) => {
    if (command === 'send') {
      handleSendMessage();
    } else if (command === 'new_chat') {
      startNewChat();
      setInputValue('');
    } else if (command === 'call' && arg) {
      initiateCall(arg);
    } else if (command === 'show_history') {
      onHistoryOpen();
    }
  };
  
  const { isListening, micError, toggleMic, speakText } = useSpeech(
    voiceSettings,
    setInputValue,
    handleCommand,
    setIsCommandMode
  );

  useEffect(() => {
    if (mainRef.current) {
      mainRef.current.scrollTop = mainRef.current.scrollHeight;
    }
  }, [messages, isLoading, isStreaming]);

  useEffect(() => {
    if (!messages || messages.length === 0) return;
    const lastMessage = messages[messages.length - 1];
    if (lastMessage && lastMessage.sender === 'jiam' && lastMessage.type === 'text' && typeof lastMessage.content === 'string' && !isStreaming) {
      const textToSpeak = removeMarkdown(lastMessage.content);
      if (textToSpeak) {
          speakText(textToSpeak);
      }
    }
  }, [messages, isStreaming, speakText]);
  
  useEffect(() => {
    if (!voiceSettings.isTtsEnabled) {
      window.speechSynthesis?.cancel();
    }
  }, [voiceSettings.isTtsEnabled]);

  const handleSendMessage = () => {
    sendMessage(inputValue, selectedImageApi, stagedImage, stagedFile);
    setInputValue('');
    setStagedImage(null);
    setStagedFile(null);
  };
  
  const handleStageImage = (file: File | null) => {
    if (file) setStagedFile(null);
    setStagedImage(file);
  }

  const handleStageFile = (file: File | null) => {
    if (file) setStagedImage(null);
    setStagedFile(file);
  }

  const handleToggleLive = () => {
      setIsLiveModalVisible(true);
  };

  const handleCloseLiveModal = () => {
    stopLiveSession();
    setIsLiveModalVisible(false);
  };

  useEffect(() => {
    if (isLiveModalVisible) {
        startLiveSession();
    }
  }, [isLiveModalVisible, startLiveSession]);

  return (
    <div 
      className="w-full max-w-4xl h-[95vh] sm:h-[95vh] h-full bg-[rgba(10,18,35,0.6)] backdrop-blur-2xl
                 rounded-none sm:rounded-2xl border flex flex-col overflow-hidden chat-container-glow"
    >
      <Header 
        currentUser={currentUser} 
        onAdminOpen={onAdminOpen}
        onProfileOpen={onProfileOpen}
        isLoading={isLoading || isStreaming || isConnecting}
        isThinkingModeEnabled={isThinkingModeEnabled}
      />
      <main ref={mainRef} className="flex-grow flex flex-col overflow-y-auto p-2 sm:p-4 min-h-0 scroll-smooth">
        <ChatWindow 
          messages={messages} 
          onImageClick={onImageClick}
          memoryConfirmation={memoryConfirmation}
          onConfirmMemory={confirmMemory}
          onRejectMemory={rejectMemory}
          onRegenerate={regenerateLastResponse}
          isLoading={isLoading}
          isStreaming={isStreaming}
          currentUser={currentUser}
        />
        {isLoading && <TypingIndicator task={loadingTask} />}
      </main>
      <Footer 
        inputValue={inputValue}
        onInputChange={setInputValue}
        onSendMessage={handleSendMessage}
        isLoading={isLoading}
        isStreaming={isStreaming}
        startNewChat={startNewChat}
        onHistoryOpen={onHistoryOpen}
        onSettingsOpen={onSettingsOpen}
        onPromptLibraryOpen={onPromptLibraryOpen}
        isDuringCall={isDuringCall}
        isMemoryConfirmationPending={!!memoryConfirmation}
        selectedApi={selectedImageApi}
        onApiChange={setSelectedImageApi}
        isListening={isListening}
        voiceSettings={voiceSettings}
        micError={micError}
        toggleMic={toggleMic}
        toggleTts={onToggleTts}
        isCommandMode={isCommandMode}
        stagedImage={stagedImage}
        onStageImage={handleStageImage}
        stagedFile={stagedFile}
        onStageFile={handleStageFile}
        isLive={isLiveModalVisible}
        isConnectingLive={isConnecting}
        onToggleLive={handleToggleLive}
        stopGeneration={stopGeneration}
        isThinkingModeEnabled={isThinkingModeEnabled}
        onToggleThinkingMode={onToggleThinkingMode}
      />
      <LiveConversationModal 
        isVisible={isLiveModalVisible}
        onClose={handleCloseLiveModal}
        isConnecting={isConnecting}
        isSpeaking={isSpeaking}
        transcript={liveTranscript}
      />
    </div>
  );
};

const TypingIndicator: React.FC<{ task: 'text' | 'tool-image' | 'tool-lyrics' | 'tool-search' | 'tool-video' | null }> = ({ task }) => {
    const getTaskContent = () => {
        switch (task) {
            case 'tool-search':
                return (
                    <div className="flex items-center gap-3">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 animate-pulse text-cyan-400" viewBox="0 0 20 20" fill="currentColor">
                           <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                        </svg>
                        <p className="text-sm text-gray-300">Searching the web...</p>
                    </div>
                );
            case 'tool-image':
                return (
                    <div className="flex flex-col items-center gap-3">
                         <div className="generative-loader">
                            <div style={{ animation: 'spin 3s linear infinite' }}></div>
                            <div style={{ animation: 'spin 4s linear infinite reverse', top: '4px', left: '4px', right: '4px', bottom: '4px' }}></div>
                            <div style={{ animation: 'spin 2.5s linear infinite', top: '8px', left: '8px', right: '8px', bottom: '8px' }}></div>
                            <div className="generative-dot" style={{ top: 'calc(50% - 4px)', left: '0px', animation: 'glow-pulse 1.5s ease-in-out infinite' }}></div>
                            <div className="generative-dot" style={{ top: 'calc(50% - 4px)', right: '0px', animation: 'glow-pulse 1.5s ease-in-out infinite 0.5s' }}></div>
                         </div>
                        <p className="text-sm text-gray-300">Generating images...</p>
                    </div>
                );
            case 'tool-lyrics':
                 return (
                    <div className="flex items-center gap-3">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 animate-pulse text-cyan-400" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 1.343-3 3s1.343 3 3 3 3-1.343 3-3V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 1.343-3 3s1.343 3 3 3 3-1.343 3-3V3z" />
                        </svg>
                        <p className="text-sm text-gray-300">Searching for lyrics...</p>
                    </div>
                );
            case 'tool-video':
                 return (
                    <div className="flex items-center gap-3">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 animate-pulse text-cyan-400" viewBox="0 0 20 20" fill="currentColor">
                           <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 001.553.832l3-2a1 1 0 000-1.664l-3-2z" />
                        </svg>
                        <p className="text-sm text-gray-300">Generating video...</p>
                    </div>
                );
            case 'text':
            default:
                return (
                    <div className="flex items-center justify-center gap-2">
                        <div className="w-2 h-2 rounded-full animate-[pulse-dot_1.4s_ease-in-out_infinite]" style={{ animationDelay: '0s' }}></div>
                        <div className="w-2 h-2 rounded-full animate-[pulse-dot_1.4s_ease-in-out_infinite]" style={{ animationDelay: '0.2s' }}></div>
                        <div className="w-2 h-2 rounded-full animate-[pulse-dot_1.4s_ease-in-out_infinite]" style={{ animationDelay: '0.4s' }}></div>
                    </div>
                );
        }
    };

    return (
        <div className="flex items-end gap-2 sm:gap-3 justify-start animate-slide-in-left mt-6 flex-shrink-0">
            <MessageAvatar />
            <div className="w-fit px-5 py-4 bg-white/10 backdrop-blur-md border border-cyan-300/20 rounded-3xl rounded-bl-md shadow-lg shadow-black/30">
                {getTaskContent()}
            </div>
        </div>
    );
};


export default ChatInterface;

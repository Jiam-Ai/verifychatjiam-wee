
import React, { useState, useEffect } from 'react';
import LoginScreen from './components/LoginScreen';
import ChatInterface from './components/ChatInterface';
import AdminPanel from './components/AdminPanel';
import CallInterface from './components/CallInterface';
import ImageModal from './components/ImageModal';
import ProfileModal from './components/ProfileModal';
import HistoryModal from './components/HistoryModal';
import SettingsModal from './components/SettingsModal';
import PromptLibrary from './components/PromptLibrary';
import LoadingSpinner from './components/LoadingSpinner';
import ToastsContainer from './components/ToastsContainer';
import { useAuth } from './hooks/useAuth';
import { useWebRTC } from './hooks/useWebRTC';
import { useChat } from './hooks/useChat';
import type { User, VoiceSettings } from './types';

const App: React.FC = () => {
  const { currentUser, loading, login, signup, logout, continueAsGuest, updateUserProfile } = useAuth();
  const [isAdminPanelVisible, setAdminPanelVisible] = useState(false);
  const [isProfileModalVisible, setProfileModalVisible] = useState(false);
  const [isHistoryModalVisible, setHistoryModalVisible] = useState(false);
  const [isSettingsModalVisible, setSettingsModalVisible] = useState(false);
  const [isPromptLibraryVisible, setPromptLibraryVisible] = useState(false);
  const [modalImage, setModalImage] = useState<string | null>(null);
  const [isThinkingModeEnabled, setIsThinkingModeEnabled] = useState(false);
  const [appVisible, setAppVisible] = useState(false);

  const toggleThinkingMode = () => setIsThinkingModeEnabled(prev => !prev);

  const [voiceSettings, setVoiceSettings] = useState<VoiceSettings>(() => {
    try {
      const saved = localStorage.getItem('jiamVoiceSettings');
      const defaultSettings = { 
          isWakeWordEnabled: true, 
          wakeWordSensitivity: 50, 
          isTtsEnabled: false,
          voiceURI: '',
          pitch: 1,
          rate: 1
      };
      if (saved) {
        const parsed = JSON.parse(saved);
        return { ...defaultSettings, ...parsed };
      }
      return defaultSettings;
    } catch {
      return { 
          isWakeWordEnabled: true, 
          wakeWordSensitivity: 50, 
          isTtsEnabled: false,
          voiceURI: '',
          pitch: 1,
          rate: 1
      };
    }
  });

  const handleSaveSettings = (newSettings: VoiceSettings) => {
    setVoiceSettings(newSettings);
    localStorage.setItem('jiamVoiceSettings', JSON.stringify(newSettings));
  };

  const handleToggleTts = () => {
    setVoiceSettings(prevSettings => {
        const newSettings = { ...prevSettings, isTtsEnabled: !prevSettings.isTtsEnabled };
        localStorage.setItem('jiamVoiceSettings', JSON.stringify(newSettings));
        return newSettings;
    });
  };
  
  const { 
    callState,
    callerUsername,
    initiateCall, 
    answerCall, 
    endCall,
    isDuringCall
  } = useWebRTC(currentUser);

  const { 
    messages, 
    isLoading,
    isStreaming,
    loadingTask,
    sendMessage, 
    addMessage, 
    updateMessage,
    startNewChat, 
    memoryConfirmation, 
    confirmMemory, 
    rejectMemory, 
    deleteMessage,
    togglePinMessage,
    toggleArchiveMessage,
    stopGeneration,
    regenerateLastResponse
  } = useChat(currentUser, isThinkingModeEnabled);

  useEffect(() => {
    // Animate app container in/out based on authentication status
    if (!loading && currentUser) {
      setAppVisible(true);
    } else {
      setAppVisible(false);
    }
  }, [currentUser, loading]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-transparent">
        <div className="aurora-container">
          <div className="aurora-outer"></div>
          <div className="aurora-inner"></div>
        </div>
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="h-screen bg-transparent overflow-hidden">
        <div className="aurora-container">
          <div className="aurora-outer"></div>
          <div className="aurora-inner"></div>
        </div>
        {!currentUser ? (
            <LoginScreen 
              onLogin={login}
              onSignup={signup}
              onGuestLogin={continueAsGuest} 
            />
        ) : (
          <>
            <div 
              id="app-container-wrapper" 
              className={`w-full h-full flex items-center justify-center transition-all duration-500 ease-out ${appVisible ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-95 pointer-events-none'}`}
            >
              <ChatInterface
                currentUser={currentUser}
                onAdminOpen={() => setAdminPanelVisible(true)}
                onProfileOpen={() => setProfileModalVisible(true)}
                onHistoryOpen={() => setHistoryModalVisible(true)}
                onSettingsOpen={() => setSettingsModalVisible(true)}
                onPromptLibraryOpen={() => setPromptLibraryVisible(true)}
                onImageClick={(url) => setModalImage(url)}
                initiateCall={initiateCall}
                isDuringCall={isDuringCall}
                messages={messages}
                isLoading={isLoading}
                isStreaming={isStreaming}
                loadingTask={loadingTask}
                sendMessage={sendMessage}
                addMessage={addMessage}
                updateMessage={updateMessage}
                startNewChat={startNewChat}
                memoryConfirmation={memoryConfirmation}
                confirmMemory={confirmMemory}
                rejectMemory={rejectMemory}
                voiceSettings={voiceSettings}
                onToggleTts={handleToggleTts}
                stopGeneration={stopGeneration}
                regenerateLastResponse={regenerateLastResponse}
                isThinkingModeEnabled={isThinkingModeEnabled}
                onToggleThinkingMode={toggleThinkingMode}
              />
            </div>
            <AdminPanel
              currentUser={currentUser}
              isVisible={isAdminPanelVisible}
              onClose={() => setAdminPanelVisible(false)}
              initiateCall={initiateCall}
            />
            <ProfileModal
                currentUser={currentUser}
                isVisible={isProfileModalVisible}
                onClose={() => setProfileModalVisible(false)}
                onSave={updateUserProfile}
                onLogout={logout}
            />
            <HistoryModal
              isVisible={isHistoryModalVisible}
              onClose={() => setHistoryModalVisible(false)}
              messages={messages}
              deleteMessage={deleteMessage}
              togglePinMessage={togglePinMessage}
              toggleArchiveMessage={toggleArchiveMessage}
            />
            <SettingsModal
              isVisible={isSettingsModalVisible}
              onClose={() => setSettingsModalVisible(false)}
              currentSettings={voiceSettings}
              onSave={handleSaveSettings}
            />
            <PromptLibrary
              isVisible={isPromptLibraryVisible}
              onClose={() => setPromptLibraryVisible(false)}
              onSelectPrompt={(prompt) => sendMessage(prompt)}
            />
          </>
        )}
        <CallInterface 
            callState={callState}
            callerUsername={callerUsername}
            onAnswer={answerCall}
            onHangup={endCall}
        />
        {modalImage && (
          <ImageModal imageUrl={modalImage} onClose={() => setModalImage(null)} />
        )}
        <ToastsContainer />
    </div>
  );
};

export default App;

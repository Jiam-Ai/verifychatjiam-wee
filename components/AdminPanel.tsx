import React, { useState, useEffect } from 'react';
import { firebaseService } from '../services/firebaseService';
import type { User, ChatMessage } from '../types';

interface AdminPanelProps {
  currentUser: User;
  isVisible: boolean;
  onClose: () => void;
  initiateCall: (targetUsername: string) => void;
}

interface PanelUser {
    username: string;
    role: 'user' | 'admin' | 'super';
}

const AdminPanel: React.FC<AdminPanelProps> = ({ currentUser, isVisible, onClose, initiateCall }) => {
  const [persona, setPersona] = useState('');
  const [broadcastInput, setBroadcastInput] = useState('');
  const [users, setUsers] = useState<PanelUser[]>([]);
  const [activeBroadcasts, setActiveBroadcasts] = useState<ChatMessage[]>([]);

  useEffect(() => {
    let unsubscribeBroadcast: () => void = () => {};

    if (isVisible) {
      firebaseService.getGlobalPersona().then(setPersona);
      
      // Use listener to get real-time updates on broadcasts
      unsubscribeBroadcast = firebaseService.listenForBroadcasts((broadcasts) => {
          setActiveBroadcasts(broadcasts);
      });
      
      const fetchUsers = async () => {
          const [allUsers, roles] = await Promise.all([
              firebaseService.getAllUsers(),
              firebaseService.getRoles()
          ]);
          
          const userList = Object.keys(allUsers).reduce<PanelUser[]>((acc, username) => {
            if (username === currentUser.username) {
              return acc;
            }
            const role = firebaseService.getUserRole(username, roles);
            if (role !== 'guest') {
              acc.push({ username, role });
            }
            return acc;
          }, []);
          setUsers(userList);
      };
      fetchUsers();
    }

    return () => {
        unsubscribeBroadcast();
    };
  }, [isVisible, currentUser.username]);
  
  if (!isVisible) return null;

  const handleSavePersona = () => {
      firebaseService.saveGlobalPersona(persona);
      alert("Jiam's global logic updated.");
      onClose();
  };

  const handleResetPersona = () => {
    if (window.confirm("Reset global logic to default for all users?")) {
        firebaseService.resetGlobalPersona();
        alert("Global logic has been reset.");
        onClose();
    }
  };

  const handleBroadcast = () => {
    if (broadcastInput.trim()) {
        firebaseService.sendBroadcast(broadcastInput.trim()).then(() => {
            alert("Broadcast sent!");
            setBroadcastInput('');
        });
    }
  };
  
  const handleDeleteBroadcast = (id: string) => {
      if (window.confirm("Are you sure you want to delete this broadcast message for all users?")) {
          firebaseService.deleteBroadcast(id).then(() => {
             // Listener updates UI automatically
          });
      }
  };

  const handleGrantAdmin = (username: string) => {
    if (window.confirm(`Make "${username}" an admin?`)) {
        firebaseService.grantAdmin(username);
    }
  };

  const handleRevokeAdmin = (username: string) => {
    if (window.confirm(`Revoke admin rights from "${username}"?`)) {
        firebaseService.revokeAdmin(username);
    }
  };

  return (
    <div className="fixed inset-0 bg-[rgba(5,8,15,0.95)] backdrop-blur-lg flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="relative w-full max-w-5xl h-full sm:h-[90vh] bg-[rgba(0,25,30,0.5)] border border-[#00d9ff] rounded-none sm:rounded-lg p-4 sm:p-6 flex flex-col sm:flex-row gap-6 font-code text-white animate-scale-in overflow-y-auto">
        <button onClick={onClose} className="absolute top-2 right-2 sm:top-4 sm:right-4 w-8 h-8 rounded-full bg-white text-black flex items-center justify-center text-xl font-bold z-10">&times;</button>
        
        {/* Main Column */}
        <div className="flex-grow flex flex-col gap-4 min-h-[50vh]">
          <h3 className="font-title text-lg sm:text-xl text-[#00d9ff] border-b border-cyan-500/30 pb-2">JIAM :: CORE LOGIC INTERFACE</h3>
          <textarea
            value={persona}
            onChange={(e) => setPersona(e.target.value)}
            className="flex-grow bg-black/50 border border-[#00d9ff] rounded-md p-2 sm:p-4 resize-none outline-none focus:ring-2 focus:ring-[#00d9ff]"
          />
          <div className="flex flex-col sm:flex-row gap-4">
            <button onClick={handleSavePersona} className="flex-1 p-3 bg-[#00d9ff] text-black rounded-md font-title transition hover:brightness-110 transform hover:scale-105">Save & Apply Global Logic</button>
            <button onClick={handleResetPersona} className="flex-1 p-3 bg-transparent border border-red-500 text-red-500 rounded-md font-title transition transform hover:scale-105 hover:bg-red-500 hover:text-white">Reset to Default</button>
          </div>
        </div>

        {/* Sidebar */}
        <div className="w-full sm:w-80 flex-shrink-0 flex flex-col gap-6">
          <div className="flex-grow flex flex-col min-h-[30vh]">
            <h3 className="font-title text-lg sm:text-xl text-[#00d9ff] border-b border-cyan-500/30 pb-2 mb-2">User Management</h3>
            <ul className="flex-grow bg-black/50 border border-[#00d9ff] rounded-md p-2 space-y-1 overflow-y-auto">
              {users.map(user => (
                <li key={user.username} className="flex items-center justify-between p-2 rounded hover:bg-white/5">
                  <span className="text-sm truncate">{user.username} {user.role !== 'user' && <span className="text-xs text-cyan-400 font-bold ml-1 sm:ml-2">({user.role.toUpperCase()})</span>}</span>
                  <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                    <button onClick={() => initiateCall(user.username)} className="text-xs border border-green-500 text-green-500 px-2 py-0.5 rounded transition transform hover:scale-105 hover:bg-green-500 hover:text-white">Call</button>
                    {currentUser.role === 'super' && user.role === 'admin' && <button onClick={() => handleRevokeAdmin(user.username)} className="text-xs border border-red-500 text-red-500 px-2 py-0.5 rounded transition transform hover:scale-105 hover:bg-red-500 hover:text-white">Revoke</button>}
                    {currentUser.role === 'super' && user.role === 'user' && <button onClick={() => handleGrantAdmin(user.username)} className="text-xs border border-green-500 text-green-500 px-2 py-0.5 rounded transition transform hover:scale-105 hover:bg-green-500 hover:text-white">Grant</button>}
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="font-title text-lg sm:text-xl text-[#00d9ff] border-b border-cyan-500/30 pb-2 mb-2">Active Broadcasts</h3>
            
            <div className="max-h-40 overflow-y-auto space-y-2 mb-4">
                {activeBroadcasts.length === 0 ? (
                    <p className="text-xs text-gray-500 italic p-2">No active broadcasts.</p>
                ) : (
                    activeBroadcasts.map(broadcast => (
                        <div key={broadcast.id} className="p-2 bg-black/40 border border-cyan-500/30 rounded-md text-xs relative group">
                            <p className="italic text-gray-300 break-words pr-6">"{broadcast.content as string}"</p>
                            <div className="text-[10px] text-gray-600 mt-1">{new Date(broadcast.timestamp).toLocaleString()}</div>
                            {(currentUser.role === 'super' || currentUser.role === 'admin') && (
                              <button 
                                  onClick={() => handleDeleteBroadcast(broadcast.id)} 
                                  className="absolute top-1 right-1 w-5 h-5 flex items-center justify-center text-red-500 hover:text-red-300 hover:bg-red-900/50 rounded-full transition-colors"
                                  title="Delete this broadcast"
                              >
                                  &times;
                              </button>
                            )}
                        </div>
                    ))
                )}
            </div>

            <textarea
                value={broadcastInput}
                onChange={(e) => setBroadcastInput(e.target.value)}
                rows={3}
                placeholder="Type a message to broadcast..."
                className="w-full bg-black/50 border border-[#00d9ff] rounded-md p-2 resize-none outline-none focus:ring-2 focus:ring-[#00d9ff]"
            />
            <button onClick={handleBroadcast} className="w-full mt-2 p-3 bg-[#00d9ff] text-black rounded-md font-title transition hover:brightness-110 transform hover:scale-105">Send Broadcast</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
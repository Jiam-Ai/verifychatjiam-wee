
import React, { useState } from 'react';

interface PromptLibraryProps {
  isVisible: boolean;
  onClose: () => void;
  onSelectPrompt: (prompt: string) => void;
}

const categories = {
  "Creative": [
    "Write a cyberpunk story set in Neo-Tokyo involving a rogue AI.",
    "Generate a poem about the intersection of nature and technology.",
    "Create a concept for a futuristic mobile app that solves loneliness.",
    "Describe a dreamlike landscape with floating islands and neon waterfalls."
  ],
  "Coding": [
    "Write a Python script to scrape data from a website using BeautifulSoup.",
    "Explain the concept of React Hooks with code examples.",
    "Debug the following code snippet and explain the fix...",
    "Create a responsive CSS grid layout for a portfolio website."
  ],
  "Analysis": [
    "Analyze the potential economic impact of widespread AI adoption.",
    "Summarize the key differences between Quantum Computing and Classical Computing.",
    "Explain the theory of relativity to a 10-year-old.",
    "Critique the following argument for logical fallacies..."
  ],
  "Utility": [
    "Draft a professional email to a client regarding a project delay.",
    "Create a weekly meal plan for a vegetarian diet.",
    "Suggest 5 unique gift ideas for a tech enthusiast.",
    "Translate the following text into Spanish and French..."
  ]
};

const PromptLibrary: React.FC<PromptLibraryProps> = ({ isVisible, onClose, onSelectPrompt }) => {
  const [activeCategory, setActiveCategory] = useState<keyof typeof categories>('Creative');

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-[rgba(5,8,15,0.95)] backdrop-blur-lg flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="relative w-full max-w-4xl h-[80vh] bg-[rgba(0,25,30,0.5)] border border-[#00d9ff] rounded-lg flex flex-col font-body text-white animate-scale-in overflow-hidden shadow-[0_0_50px_-12px_rgba(0,217,255,0.3)]">
        
        {/* Header */}
        <div className="p-6 border-b border-cyan-500/30 flex justify-between items-center bg-black/40">
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded bg-cyan-500/20 border border-cyan-500 flex items-center justify-center">
                    <svg className="w-5 h-5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" /></svg>
                </div>
                <h2 className="font-title text-2xl text-[#00d9ff] tracking-wide">Command Center</h2>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/10 text-white flex items-center justify-center text-xl font-bold hover:bg-white/20 transition-colors">&times;</button>
        </div>

        <div className="flex flex-grow overflow-hidden">
            {/* Sidebar */}
            <div className="w-1/4 min-w-[150px] border-r border-cyan-500/20 bg-black/20 p-4 space-y-2">
                {Object.keys(categories).map((cat) => (
                    <button
                        key={cat}
                        onClick={() => setActiveCategory(cat as keyof typeof categories)}
                        className={`w-full text-left px-4 py-3 rounded-md transition-all duration-200 font-semibold ${activeCategory === cat ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-[0_0_10px_rgba(0,217,255,0.1)]' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            {/* Content Area */}
            <div className="flex-grow p-6 overflow-y-auto bg-gradient-to-br from-transparent to-black/40">
                <h3 className="text-xl font-bold text-white mb-6 border-b border-white/10 pb-2 flex items-center gap-2">
                    <span className="text-cyan-500">##</span> {activeCategory} Protocols
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {categories[activeCategory].map((prompt, idx) => (
                        <button
                            key={idx}
                            onClick={() => { onSelectPrompt(prompt); onClose(); }}
                            className="group relative p-4 bg-black/40 border border-white/10 rounded-xl text-left hover:border-cyan-500/50 hover:bg-cyan-900/10 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
                        >
                            <div className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <svg className="w-4 h-4 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                            </div>
                            <p className="text-gray-300 group-hover:text-white leading-relaxed text-sm">{prompt}</p>
                        </button>
                    ))}
                </div>
            </div>
        </div>

        {/* Footer Info */}
        <div className="p-3 bg-black/60 border-t border-cyan-500/20 text-xs text-gray-500 text-center font-code">
            Select a command to initiate immediate processing.
        </div>

      </div>
    </div>
  );
};

export default PromptLibrary;

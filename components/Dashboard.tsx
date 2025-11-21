import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, Image as ImageIcon, Film, Search, 
  Paperclip, Sparkles, Settings, Zap, PlayCircle,
  LayoutTemplate, History
} from 'lucide-react';
import MessageBubble from './MessageBubble';
import { Message, Role, ContentType, GenerationMode, ProjectContext } from '../types';
import { generateStrategy, generateProfessionalImage, generateCinematicVideo, conductResearch } from '../services/geminiService';

const INITIAL_MESSAGE: Message = {
  id: 'welcome',
  role: Role.ASSISTANT,
  content: "# OmniCreative Studio\n\nWelcome. I am your AI Creative Director. I can assist you with:\n\n*   **Strategic Copywriting** (Ads, PR, Social)\n*   **Market Research** (Competitor analysis, Trends)\n*   **Visuals** (High-end Image Generation)\n*   **Cinematics** (Veo Video Production)\n\nWhat is our project focus today?",
  type: ContentType.TEXT,
  timestamp: Date.now()
};

const Dashboard: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<GenerationMode>(GenerationMode.COPYWRITING);
  const [file, setFile] = useState<{ name: string, data: string, mime: string } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Project Context State
  const [context, setContext] = useState<ProjectContext>({
    brandName: 'LuxNova',
    industry: 'Tech / Lifestyle',
    tone: 'Futuristic, Premium, Minimalist'
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        // remove prefix for API usage later, but keep full for preview if needed
        const base64Data = base64String.split(',')[1]; 
        setFile({
          name: f.name,
          data: base64Data,
          mime: f.type
        });
      };
      reader.readAsDataURL(f);
    }
  };

  const handleSubmit = async () => {
    if ((!input.trim() && !file) || isLoading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: Role.USER,
      content: input + (file ? `\n[Attached: ${file.name}]` : ''),
      type: ContentType.TEXT,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    const currentFile = file; // Capture current file state
    setFile(null); // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = '';
    
    setIsLoading(true);

    try {
      let resultMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: Role.ASSISTANT,
        content: '',
        type: ContentType.TEXT,
        timestamp: Date.now()
      };

      const contextString = `Brand: ${context.brandName}, Industry: ${context.industry}, Tone: ${context.tone}`;

      switch (mode) {
        case GenerationMode.COPYWRITING:
          const strategyRes = await generateStrategy(
            input, 
            contextString, 
            currentFile ? [{ mimeType: currentFile.mime, data: currentFile.data }] : []
          );
          resultMessage.content = strategyRes.text;
          break;

        case GenerationMode.RESEARCH:
          const researchRes = await conductResearch(input);
          resultMessage.content = researchRes.text;
          resultMessage.type = ContentType.RESEARCH;
          resultMessage.metadata = { sources: researchRes.sources };
          break;

        case GenerationMode.VISUAL:
          const imageBase64 = await generateProfessionalImage(input, currentFile?.data);
          if (imageBase64) {
            resultMessage.type = ContentType.IMAGE;
            resultMessage.content = `Generated concept based on: "${input}"`;
            resultMessage.metadata = { imageUrl: imageBase64 };
          } else {
            resultMessage.content = "Failed to generate image. Please try again.";
          }
          break;

        case GenerationMode.VIDEO:
          // Temporary "Processing" message for video as it takes time
          setMessages(prev => [...prev, {
             id: 'temp-video',
             role: Role.ASSISTANT,
             content: "Producing cinematic video... This may take a minute.",
             type: ContentType.TEXT,
             timestamp: Date.now(),
             metadata: { thinking: true }
          }]);
          
          const videoUrl = await generateCinematicVideo(input);
          
          // Remove temp message
          setMessages(prev => prev.filter(m => m.id !== 'temp-video'));

          if (videoUrl) {
            resultMessage.type = ContentType.VIDEO;
            resultMessage.content = `Render complete for scene: "${input}"`;
            resultMessage.metadata = { videoUrl };
          } else {
            resultMessage.content = "Video generation failed or was cancelled.";
          }
          break;
      }

      setMessages(prev => [...prev, resultMessage]);

    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: Role.ASSISTANT,
        content: "An error occurred while processing your request. Please check your API configuration.",
        type: ContentType.TEXT,
        timestamp: Date.now()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-full bg-slate-950 text-slate-100 overflow-hidden font-sans selection:bg-indigo-500/30">
      
      {/* Left Sidebar: Controls & Context */}
      <div className="w-80 hidden lg:flex flex-col border-r border-slate-800 bg-slate-900/50 backdrop-blur-md">
        <div className="p-6 border-b border-slate-800">
          <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent tracking-tight">
            OmniCreative
          </h1>
          <p className="text-xs text-slate-400 mt-1">AI Creative Director</p>
        </div>

        <div className="p-6 space-y-8 overflow-y-auto flex-1">
          {/* Mode Selector */}
          <div className="space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Tools</h3>
            <div className="grid grid-cols-2 gap-2">
              <button 
                onClick={() => setMode(GenerationMode.COPYWRITING)}
                className={`p-3 rounded-lg flex flex-col items-center justify-center gap-2 transition-all border ${mode === GenerationMode.COPYWRITING ? 'bg-indigo-600/20 border-indigo-500 text-indigo-200' : 'bg-slate-800 border-slate-700 hover:bg-slate-700 text-slate-400'}`}
              >
                <Zap size={20} />
                <span className="text-xs font-medium">Copy & Strategy</span>
              </button>
              <button 
                onClick={() => setMode(GenerationMode.RESEARCH)}
                className={`p-3 rounded-lg flex flex-col items-center justify-center gap-2 transition-all border ${mode === GenerationMode.RESEARCH ? 'bg-blue-600/20 border-blue-500 text-blue-200' : 'bg-slate-800 border-slate-700 hover:bg-slate-700 text-slate-400'}`}
              >
                <Search size={20} />
                <span className="text-xs font-medium">Research</span>
              </button>
              <button 
                onClick={() => setMode(GenerationMode.VISUAL)}
                className={`p-3 rounded-lg flex flex-col items-center justify-center gap-2 transition-all border ${mode === GenerationMode.VISUAL ? 'bg-pink-600/20 border-pink-500 text-pink-200' : 'bg-slate-800 border-slate-700 hover:bg-slate-700 text-slate-400'}`}
              >
                <ImageIcon size={20} />
                <span className="text-xs font-medium">Visuals</span>
              </button>
              <button 
                onClick={() => setMode(GenerationMode.VIDEO)}
                className={`p-3 rounded-lg flex flex-col items-center justify-center gap-2 transition-all border ${mode === GenerationMode.VIDEO ? 'bg-orange-600/20 border-orange-500 text-orange-200' : 'bg-slate-800 border-slate-700 hover:bg-slate-700 text-slate-400'}`}
              >
                <Film size={20} />
                <span className="text-xs font-medium">Cinematics</span>
              </button>
            </div>
          </div>

          {/* Project Context Settings */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Project Context</h3>
              <Settings size={14} className="text-slate-500 cursor-pointer hover:text-white" />
            </div>
            
            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Brand Name</label>
                <input 
                  type="text" 
                  value={context.brandName} 
                  onChange={(e) => setContext({...context, brandName: e.target.value})}
                  className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Industry</label>
                <input 
                  type="text" 
                  value={context.industry} 
                  onChange={(e) => setContext({...context, industry: e.target.value})}
                  className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
               <div>
                <label className="text-xs text-slate-400 block mb-1">Tone & Voice</label>
                <textarea 
                  value={context.tone} 
                  onChange={(e) => setContext({...context, tone: e.target.value})}
                  className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 transition-colors h-20 resize-none"
                />
              </div>
            </div>
          </div>

          {/* History Placeholder */}
          <div className="space-y-4 pt-4 border-t border-slate-800">
             <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                <History size={12} /> Recent Campaigns
             </h3>
             <div className="text-xs text-slate-600 italic">No recent history stored.</div>
          </div>
        </div>
      </div>

      {/* Main Workspace */}
      <div className="flex-1 flex flex-col relative bg-slate-950">
        
        {/* Header (Mobile Only) */}
        <div className="lg:hidden h-14 border-b border-slate-800 flex items-center px-4 bg-slate-900">
           <span className="font-bold text-indigo-400">OmniCreative</span>
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6">
          {messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} />
          ))}
          
          {isLoading && (
             <div className="flex justify-start w-full animate-pulse">
                 <div className="bg-slate-800/50 rounded-full px-4 py-2 text-xs text-slate-400 flex items-center gap-2">
                    <Sparkles size={14} className="animate-spin-slow" />
                    <span>
                        {mode === GenerationMode.VIDEO ? 'Rendering video (this takes time)...' : 
                         mode === GenerationMode.RESEARCH ? 'Analyzing market data...' :
                         mode === GenerationMode.VISUAL ? 'Generating high-fidelity image...' :
                         'Crafting strategy...'}
                    </span>
                 </div>
             </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 md:p-6 bg-slate-950/80 backdrop-blur-xl border-t border-slate-800 z-10">
          <div className="max-w-4xl mx-auto relative">
            
            {/* File Preview */}
            {file && (
              <div className="absolute -top-12 left-0 bg-slate-800 rounded-lg px-3 py-1 text-xs flex items-center gap-2 border border-slate-600 shadow-lg">
                 <span className="truncate max-w-[150px]">{file.name}</span>
                 <button onClick={() => setFile(null)} className="text-slate-400 hover:text-white">×</button>
              </div>
            )}

            <div className="flex items-end gap-3 bg-slate-900/50 p-2 rounded-xl border border-slate-700 focus-within:border-indigo-500/50 focus-within:ring-1 focus-within:ring-indigo-500/20 transition-all shadow-xl">
              
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="p-3 text-slate-400 hover:text-indigo-400 transition-colors rounded-lg hover:bg-slate-800"
                title="Upload Reference (Image/Video)"
              >
                <Paperclip size={20} />
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/*,video/*"
                    onChange={handleFileUpload}
                />
              </button>

              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit();
                  }
                }}
                placeholder={
                    mode === GenerationMode.COPYWRITING ? "Describe the campaign or copy needs..." :
                    mode === GenerationMode.VISUAL ? "Describe the image to generate..." :
                    mode === GenerationMode.VIDEO ? "Describe the scene for the video..." :
                    "What market trends should we analyze?"
                }
                className="flex-1 bg-transparent border-none focus:ring-0 text-slate-100 placeholder-slate-500 resize-none py-3 max-h-32 min-h-[24px]"
                rows={1}
              />

              <button 
                onClick={handleSubmit}
                disabled={isLoading || (!input.trim() && !file)}
                className={`p-3 rounded-lg transition-all shadow-lg ${
                    isLoading || (!input.trim() && !file) 
                    ? 'bg-slate-800 text-slate-600 cursor-not-allowed' 
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-500/20'
                }`}
              >
                <Send size={20} />
              </button>
            </div>
            
            <div className="mt-2 flex justify-between text-[10px] text-slate-500 px-2">
                <span>Current Mode: <strong className="text-indigo-400 uppercase">{mode}</strong></span>
                <span>Shift + Enter for new line</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
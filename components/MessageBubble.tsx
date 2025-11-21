import React from 'react';
import { Message, Role, ContentType } from '../types';
import { User, Bot, Search, Film, Image as ImageIcon } from 'lucide-react';

interface MessageBubbleProps {
  message: Message;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isUser = message.role === Role.USER;

  const renderContent = () => {
    if (message.type === ContentType.IMAGE && message.metadata?.imageUrl) {
      return (
        <div className="space-y-2">
          <p className="text-sm text-gray-300 mb-2">{message.content}</p>
          <div className="relative group rounded-lg overflow-hidden border border-gray-700 shadow-2xl">
            <img src={message.metadata.imageUrl} alt="Generated content" className="w-full max-w-2xl h-auto object-cover" />
            <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-all" />
          </div>
        </div>
      );
    }

    if (message.type === ContentType.VIDEO && message.metadata?.videoUrl) {
      return (
        <div className="space-y-2">
          <p className="text-sm text-gray-300 mb-2">{message.content}</p>
          <div className="rounded-lg overflow-hidden border border-gray-700 shadow-2xl max-w-2xl">
            <video controls className="w-full h-auto" src={message.metadata.videoUrl} />
          </div>
        </div>
      );
    }

    // Text / Research
    return (
      <div className="prose prose-invert prose-sm max-w-none">
        <div className="whitespace-pre-wrap font-light leading-relaxed text-gray-200">
          {message.content}
        </div>
        {message.metadata?.sources && message.metadata.sources.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-700">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2 flex items-center gap-2">
                    <Search size={12} /> Sources
                </h4>
                <ul className="space-y-1">
                    {message.metadata.sources.map((source, idx) => (
                        <li key={idx}>
                            <a 
                                href={source.uri} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-xs text-brand-accent hover:text-white transition-colors truncate block max-w-md"
                            >
                                {source.title || source.uri}
                            </a>
                        </li>
                    ))}
                </ul>
            </div>
        )}
      </div>
    );
  };

  return (
    <div className={`flex w-full mb-8 ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex max-w-[85%] md:max-w-[75%] ${isUser ? 'flex-row-reverse' : 'flex-row'} gap-4`}>
        
        {/* Avatar */}
        <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center shadow-lg ${
          isUser ? 'bg-indigo-600' : 'bg-slate-700'
        }`}>
          {isUser ? <User size={18} /> : <Bot size={18} />}
        </div>

        {/* Bubble */}
        <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
            <div className={`p-5 rounded-2xl shadow-md backdrop-blur-sm border ${
            isUser 
                ? 'bg-indigo-900/40 border-indigo-500/30 rounded-tr-sm' 
                : 'bg-slate-800/60 border-slate-700 rounded-tl-sm'
            }`}>
            {message.metadata?.thinking && (
               <div className="flex items-center gap-2 text-xs text-yellow-500 mb-2 font-mono animate-pulse">
                  <span>Thinking...</span>
               </div> 
            )}
            {renderContent()}
            </div>
            <span className="text-[10px] text-slate-500 mt-2 px-1">
                {new Date(message.timestamp).toLocaleTimeString()}
            </span>
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;
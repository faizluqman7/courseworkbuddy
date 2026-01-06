import { useState, useRef, useEffect, type KeyboardEvent } from 'react';
import { Send, Bot, User, Loader2, X, MessageSquare, Sparkles, Image } from 'lucide-react';

interface Message {
    role: 'user' | 'assistant';
    content: string;
    sources?: { chunk_id: string; chunk_index: number; preview: string; source_type?: string; image_path?: string }[];
    images?: string[];  // Relevant image paths for display
}

interface ChatPanelProps {
    sessionId: string;
    isOpen: boolean;
    onClose: () => void;
}

export function ChatPanel({ sessionId, isOpen, onClose }: ChatPanelProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Auto-scroll to bottom on new messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Focus input when panel opens
    useEffect(() => {
        if (isOpen) {
            inputRef.current?.focus();
        }
    }, [isOpen]);

    const sendMessage = async () => {
        if (!input.trim() || isLoading) return;

        const userMessage = input.trim();
        setInput('');
        setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
        setIsLoading(true);

        try {
            const response = await fetch('/api/chat/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    // Include auth token if available
                    ...(localStorage.getItem('token') && {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }),
                },
                body: JSON.stringify({
                    question: userMessage,
                    session_id: sessionId
                }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.detail || 'Chat failed');
            }

            const data = await response.json();
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: data.answer,
                sources: data.sources,
                images: data.images || [],  // Include relevant images
            }]);
        } catch (error) {
            console.error('Chat error:', error);
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: `Sorry, I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`,
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed bottom-4 right-4 w-[420px] h-[600px] bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden z-50 animate-in slide-in-from-bottom-4 fade-in duration-300">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500">
                <div className="flex items-center gap-3 text-white">
                    <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                        <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                        <span className="font-semibold text-lg">Coursework Assistant</span>
                        <p className="text-xs text-white/80">Ask anything about your spec</p>
                    </div>
                </div>
                <button
                    onClick={onClose}
                    className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-950">
                {messages.length === 0 && (
                    <div className="text-center py-12">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                            <MessageSquare className="w-8 h-8 text-white" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                            Ask me anything!
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-[280px] mx-auto">
                            I can help you understand your coursework spec, explain requirements, and guide your approach.
                        </p>
                        <div className="mt-6 space-y-2">
                            <p className="text-xs text-gray-400 uppercase tracking-wider">Try asking:</p>
                            <div className="flex flex-wrap gap-2 justify-center">
                                {[
                                    "What's the deadline?",
                                    "Explain the marking criteria",
                                    "What should I start with?",
                                ].map((suggestion) => (
                                    <button
                                        key={suggestion}
                                        onClick={() => setInput(suggestion)}
                                        className="text-xs px-3 py-1.5 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-indigo-50 hover:border-indigo-300 dark:hover:bg-indigo-900/30 transition-colors"
                                    >
                                        {suggestion}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {messages.map((msg, i) => (
                    <div
                        key={i}
                        className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                    >
                        {/* Avatar */}
                        <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center ${msg.role === 'user'
                            ? 'bg-indigo-500'
                            : 'bg-gradient-to-br from-indigo-500 to-purple-600'
                            }`}>
                            {msg.role === 'user'
                                ? <User className="w-4 h-4 text-white" />
                                : <Bot className="w-4 h-4 text-white" />
                            }
                        </div>

                        {/* Message bubble */}
                        <div className={`max-w-[75%] ${msg.role === 'user' ? 'text-right' : ''}`}>
                            <div className={`rounded-2xl px-4 py-3 ${msg.role === 'user'
                                ? 'bg-indigo-500 text-white rounded-br-md'
                                : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-bl-md shadow-sm border border-gray-100 dark:border-gray-700'
                                }`}>
                                <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.content}</p>
                            </div>

                            {/* Sources (for assistant messages) */}
                            {msg.role === 'assistant' && msg.sources && msg.sources.length > 0 && (
                                <details className="mt-2 text-left">
                                    <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-600">
                                        {msg.sources.length} source{msg.sources.length > 1 ? 's' : ''} used
                                    </summary>
                                    <div className="mt-1 space-y-1">
                                        {msg.sources.slice(0, 3).map((source, j) => (
                                            <div
                                                key={j}
                                                className="text-xs p-2 bg-gray-100 dark:bg-gray-800 rounded text-gray-500 dark:text-gray-400 line-clamp-2"
                                            >
                                                {source.source_type === 'image' ? (
                                                    <span className="flex items-center gap-1">
                                                        <Image className="w-3 h-3" />
                                                        Image from Page: {source.preview}
                                                    </span>
                                                ) : (
                                                    <>Chunk {source.chunk_index}: {source.preview}</>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </details>
                            )}

                            {/* Images (for assistant messages with multimodal content) */}
                            {msg.role === 'assistant' && msg.images && msg.images.length > 0 && (
                                <div className="mt-3 flex flex-wrap gap-2">
                                    {msg.images.slice(0, 3).map((imagePath, j) => {
                                        // Extract document_id and filename from path
                                        const pathParts = imagePath.split('/');
                                        const filename = pathParts[pathParts.length - 1];
                                        const documentId = pathParts[pathParts.length - 2];
                                        const imageUrl = `/api/images/${documentId}/${filename}`;

                                        return (
                                            <div key={j} className="relative group">
                                                <img
                                                    src={imageUrl}
                                                    alt={`Relevant diagram ${j + 1}`}
                                                    className="max-w-32 max-h-24 rounded-lg border border-gray-200 dark:border-gray-700 object-cover cursor-pointer hover:scale-105 transition-transform shadow-sm"
                                                    onClick={() => window.open(imageUrl, '_blank')}
                                                    onError={(e) => {
                                                        // Hide broken images
                                                        (e.target as HTMLImageElement).style.display = 'none';
                                                    }}
                                                />
                                                <div className="absolute bottom-1 right-1 bg-black/50 text-white text-xs px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                                                    Click to enlarge
                                                </div>
                                            </div>
                                        );
                                    })}
                                    {msg.images.length > 3 && (
                                        <div className="flex items-center justify-center w-16 h-16 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-500 text-xs">
                                            +{msg.images.length - 3} more
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                ))}

                {/* Loading indicator */}
                {isLoading && (
                    <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                            <Loader2 className="w-4 h-4 text-white animate-spin" />
                        </div>
                        <div className="bg-white dark:bg-gray-800 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm border border-gray-100 dark:border-gray-700">
                            <div className="flex items-center gap-2 text-gray-500">
                                <span className="text-sm">Thinking</span>
                                <span className="flex gap-1">
                                    <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                    <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                    <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                </span>
                            </div>
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
                <form onSubmit={(e) => { e.preventDefault(); sendMessage(); }} className="flex gap-2">
                    <input
                        ref={inputRef}
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Ask about your coursework..."
                        className="flex-1 px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                        disabled={isLoading}
                    />
                    <button
                        type="submit"
                        disabled={isLoading || !input.trim()}
                        className="w-12 h-12 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:scale-105 transition-all active:scale-95"
                    >
                        {isLoading ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <Send className="w-5 h-5" />
                        )}
                    </button>
                </form>
                <p className="text-xs text-center text-gray-400 mt-2">
                    I guide your thinking — I won't write code for you
                </p>
            </div>
        </div>
    );
}

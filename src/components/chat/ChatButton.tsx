import { useState } from 'react';
import { MessageCircle } from 'lucide-react';
import { ChatPanel } from './ChatPanel';

interface ChatButtonProps {
    sessionId: string | null;
}

export function ChatButton({ sessionId }: ChatButtonProps) {
    const [isOpen, setIsOpen] = useState(false);

    // Don't render if no session ID (no document has been decomposed)
    if (!sessionId) return null;

    return (
        <>
            {/* Floating button */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 text-white shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-300 flex items-center justify-center z-40 group"
                    aria-label="Open chat assistant"
                >
                    <MessageCircle className="w-6 h-6 group-hover:scale-110 transition-transform" />

                    {/* Pulse animation */}
                    <span className="absolute inset-0 rounded-full bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 animate-ping opacity-25" />

                    {/* Tooltip */}
                    <span className="absolute right-full mr-3 px-3 py-1.5 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                        Ask about your coursework
                    </span>
                </button>
            )}

            {/* Chat panel */}
            <ChatPanel
                sessionId={sessionId}
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
            />
        </>
    );
}

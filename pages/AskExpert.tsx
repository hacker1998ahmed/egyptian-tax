import React, { useState, useEffect, useRef, FormEvent } from 'react';
import type { ChatMessage } from '../types';
import { startTaxChat } from '../services/geminiService';
import type { Chat } from '@google/genai';
import { useTranslation } from '../i18n/context';

const TypingIndicator: React.FC = () => (
    <div className="flex items-center space-x-1 p-3">
        <div className="w-2 h-2 bg-cyan-500 dark:bg-cyan-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
        <div className="w-2 h-2 bg-cyan-500 dark:bg-cyan-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
        <div className="w-2 h-2 bg-cyan-500 dark:bg-cyan-400 rounded-full animate-bounce"></div>
    </div>
);

const MessageBubble: React.FC<{ message: ChatMessage }> = ({ message }) => {
    const isUser = message.role === 'user';
    const bubbleClasses = isUser 
        ? 'bg-cyan-600 dark:bg-cyan-600/50 self-end rounded-br-none'
        : 'bg-gray-200 dark:bg-gray-700/50 self-start rounded-bl-none';
    const textClasses = isUser ? 'text-white' : 'text-gray-800 dark:text-gray-200';

    return (
        <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} animate-fade-in`}>
            <div className={`max-w-xl lg:max-w-2xl px-4 py-3 rounded-2xl ${bubbleClasses}`}>
                <p className={`text-base whitespace-pre-wrap ${textClasses}`}>{message.text}</p>
            </div>
        </div>
    );
};

const AskExpert: React.FC = () => {
    const { t } = useTranslation();
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const chatRef = useRef<Chat | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(scrollToBottom, [messages, isLoading]);

    useEffect(() => {
        const initializeChat = async () => {
            try {
                const chat = startTaxChat();
                chatRef.current = chat;
                // Get the initial welcome message
                const response = await chat.sendMessageStream({ message: "أهلاً بك" });
                let text = '';
                for await (const chunk of response) {
                    text += chunk.text;
                }
                setMessages([{ role: 'model', text }]);
            } catch (e) {
                setMessages([{ role: 'model', text: t('askExpert.error.connect') }]);
            } finally {
                setIsLoading(false);
            }
        };
        initializeChat();
    }, [t]);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading || !chatRef.current) return;

        const userMessage: ChatMessage = { role: 'user', text: input };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const stream = await chatRef.current.sendMessageStream({ message: input });
            
            let modelResponse = '';
            setMessages(prev => [...prev, { role: 'model', text: '' }]);

            for await (const chunk of stream) {
                modelResponse += chunk.text;
                setMessages(prev => {
                    const newMessages = [...prev];
                    newMessages[newMessages.length - 1] = { role: 'model', text: modelResponse };
                    return newMessages;
                });
            }
        } catch (error) {
            console.error(error);
            setMessages(prev => [...prev, { role: 'model', text: t('askExpert.error.generic') }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-180px)] max-w-4xl mx-auto animate-fade-in">
             <h2 className="text-3xl font-bold text-cyan-700 dark:text-cyan-400 mb-4 text-center border-b border-gray-200 dark:border-cyan-500/30 pb-4" style={{ textShadow: 'var(--expert-header-shadow)' }}>
                <style>{`.dark h2 { --expert-header-shadow: 0 0 5px #22d3ee; }`}</style>
                {t('askExpert.title')}
            </h2>
            <div className="flex-grow overflow-y-auto pr-2 space-y-6">
                {messages.map((msg, index) => (
                    <MessageBubble key={index} message={msg} />
                ))}
                {isLoading && messages.length > 0 && (
                    <div className="flex justify-start">
                        <div className="bg-gray-200 dark:bg-gray-700/50 rounded-2xl rounded-bl-none">
                            <TypingIndicator />
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>
            <div className="mt-6">
                <form onSubmit={handleSubmit} className="flex items-center gap-4">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder={t('askExpert.placeholder')}
                        disabled={isLoading}
                        className="flex-grow bg-white dark:bg-gray-800/70 border border-gray-300 dark:border-gray-600 rounded-full py-3 px-6 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all duration-300 disabled:opacity-50"
                    />
                    <button
                        type="submit"
                        disabled={isLoading || !input.trim()}
                        className="bg-cyan-600 dark:bg-cyan-500 text-white dark:text-black rounded-full p-3 hover:bg-cyan-700 dark:hover:bg-cyan-400 focus:outline-none focus:ring-4 focus:ring-cyan-300/50 transition-all duration-300 disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed shadow-lg shadow-cyan-500/30"
                        aria-label={t('askExpert.send')}
                    >
                       <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                       </svg>
                    </button>
                </form>
            </div>
        </div>
    );
};

export default AskExpert;
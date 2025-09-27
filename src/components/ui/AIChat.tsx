'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/hooks/use-theme';

interface Message {
  id: string;
  type: 'user' | 'agent';
  content: string;
  timestamp: Date;
}

interface AIChatProps {
  className?: string;
}

export function AIChat({ className = '' }: AIChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'agent',
      content: 'Hello! I\'m your molecular structure assistant. I can help you analyze proteins, highlight regions, isolate chains, and answer questions about molecular structures. What would you like to explore?',
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const theme = useTheme();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      const agentMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'agent',
        content: `I understand you're asking about: "${inputValue}". This is a placeholder response. In the full implementation, I would analyze your molecular structure and provide specific insights about protein folding, binding sites, or structural features.`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, agentMessage]);
      setIsTyping(false);
    }, 1500);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const quickActions = [
    'Highlight active site',
    'Show binding pocket',
    'Analyze structure',
    'Compare chains',
    'Isolate domain',
    'Export data'
  ];

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <AnimatePresence>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex items-start space-x-3 max-w-[80%] ${
                message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''
              }`}>
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold ${
                    message.type === 'user' ? 'bg-blue-500 text-white' : 'bg-purple-500 text-white'
                  }`}
                >
                  {message.type === 'user' ? 'U' : 'AI'}
                </div>
                <div
                  className={`p-3 rounded-lg border ${
                    message.type === 'user' 
                      ? 'bg-blue-500/20 border-blue-500/30' 
                      : 'bg-gray-800/50 border-gray-700/50'
                  }`}
                >
                  <p 
                    className="text-sm leading-relaxed"
                    style={{ 
                      color: theme.colors.foreground.primary,
                      fontSize: theme.typography.chat.message.fontSize,
                      lineHeight: theme.typography.chat.message.lineHeight,
                    }}
                  >
                    {message.content}
                  </p>
                  <p 
                    className="text-xs mt-2 opacity-70"
                    style={{
                      fontSize: theme.typography.chat.timestamp.fontSize,
                      opacity: theme.typography.chat.timestamp.opacity,
                    }}
                  >
                    {message.timestamp.toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Typing Indicator */}
        {isTyping && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-start"
          >
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold bg-purple-500 text-white">
                AI
              </div>
              <div className="p-3 rounded-lg border bg-gray-800/50 border-gray-700/50">
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>
                  <span className="text-sm text-gray-400">AI is thinking...</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Actions */}
      <div className="p-4 border-t border-white/10">
        <div className="mb-3">
          <p className="text-xs text-gray-400 mb-2">Quick Actions:</p>
          <div className="flex flex-wrap gap-2">
            {quickActions.map((action) => (
              <button
                key={action}
                className="px-2 py-1 text-xs border border-gray-600 text-gray-300 hover:border-blue-500 hover:text-blue-400 rounded-md transition-colors"
                onClick={() => setInputValue(action)}
              >
                {action}
              </button>
            ))}
          </div>
        </div>

        {/* Input */}
        <div className="flex space-x-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask about molecular structures..."
            className="flex-1 px-3 py-2 bg-gray-800/50 border border-gray-600 rounded-lg text-white placeholder:text-gray-400 focus:outline-none focus:border-blue-500 transition-colors"
          />
          <button
            disabled={!inputValue.trim() || isTyping}
            onClick={handleSendMessage}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

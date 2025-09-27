'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Button, 
  Input, 
  Card, 
  CardBody,
  Avatar,
  Spinner,
  Chip,
  Divider
} from '@heroui/react';

interface Message {
  id: string;
  type: 'user' | 'agent';
  content: string;
  timestamp: Date;
}

interface ProfessionalChatProps {
  className?: string;
}

export function ProfessionalChat({ className = '' }: ProfessionalChatProps) {
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
    { label: 'Highlight active site', category: 'Analysis' },
    { label: 'Show binding pocket', category: 'Analysis' },
    { label: 'Analyze structure', category: 'Analysis' },
    { label: 'Compare chains', category: 'Comparison' },
    { label: 'Isolate domain', category: 'Manipulation' },
    { label: 'Export data', category: 'Export' }
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
                <Avatar
                  size="sm"
                  name={message.type === 'user' ? 'You' : 'AI'}
                  className={message.type === 'user' ? 'bg-primary' : 'bg-secondary'}
                  showFallback
                />
                <Card
                  className={`${
                    message.type === 'user' 
                      ? 'bg-primary/10 border-primary/20' 
                      : 'bg-default-50 border-default-200'
                  }`}
                >
                  <CardBody className="p-3">
                    <p className="text-sm leading-relaxed text-foreground">
                      {message.content}
                    </p>
                    <p className="text-xs text-foreground-400 mt-2">
                      {message.timestamp.toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </p>
                  </CardBody>
                </Card>
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
              <Avatar
                size="sm"
                name="AI"
                className="bg-secondary"
                showFallback
              />
              <Card className="bg-default-50 border-default-200">
                <CardBody className="p-3">
                  <div className="flex items-center space-x-2">
                    <Spinner size="sm" />
                    <span className="text-sm text-foreground-600">AI is thinking...</span>
                  </div>
                </CardBody>
              </Card>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <Divider />

      {/* Quick Actions */}
      <div className="p-4">
        <div className="mb-4">
          <p className="text-xs font-medium text-foreground-600 mb-2">Quick Actions:</p>
          <div className="flex flex-wrap gap-2">
            {quickActions.map((action, index) => (
              <Button
                key={index}
                size="sm"
                variant="bordered"
                className="text-xs h-7"
                onClick={() => setInputValue(action.label)}
              >
                {action.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Input */}
        <div className="flex space-x-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask about molecular structures..."
            variant="bordered"
            className="flex-1"
            size="sm"
          />
          <Button
            color="primary"
            isDisabled={!inputValue.trim() || isTyping}
            onClick={handleSendMessage}
            size="sm"
            className="px-4"
          >
            Send
          </Button>
        </div>
      </div>
    </div>
  );
}

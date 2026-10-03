import React, { useState, useRef, useEffect } from 'react';
import { Bot, Sparkles, X, Send, Minimize2, RefreshCw, ShieldAlert, HeartPulse, Home, Compass } from 'lucide-react';
import { chatWithAIAPI } from '../services/api';
import toast from 'react-hot-toast';

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

const QUICK_PROMPTS = [
  { label: '🔥 Fire Safety', prompt: 'How to protect myself during a fire step by step?' },
  { label: '🌊 Flood Safety', prompt: 'What are the immediate safety steps during a flood?' },
  { label: '🏚️ Earthquake Steps', prompt: 'What should I do during an earthquake?' },
  { label: '🚑 First Aid & CPR', prompt: 'Give me emergency CPR and severe bleeding first aid steps.' },
  { label: '🏠 Relief Shelters', prompt: 'How do I locate the nearest relief shelter?' },
];

export const AIAssistantWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: '👋 **Welcome to SafeSphere AI Emergency Assistant**!\nHow can I help you with disaster safety protocols, emergency triage, or relief guidance today?',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen && !isMinimized) {
      scrollToBottom();
    }
  }, [messages, isOpen, isMinimized]);

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if (!query || loading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    if (!textToSend) setInput('');
    setLoading(true);

    try {
      const res = await chatWithAIAPI(query);
      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'assistant',
        text: res.data.reply || 'Sorry, I could not process that request.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (err: any) {
      toast.error('AI Service temporarly unreachable.');
      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'assistant',
          text: '⚠️ **Connection Error**: Unable to reach SafeSphere AI engine. Please verify network connection or try again.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatMessageText = (text: string) => {
    // Basic formatting for bold and lists
    const lines = text.split('\n');
    return lines.map((line, idx) => {
      let formatted = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      if (line.trim().startsWith('•') || line.trim().startsWith('-')) {
        return <div key={idx} style={{ paddingLeft: '12px', margin: '3px 0' }} dangerouslySetInnerHTML={{ __html: formatted }} />;
      }
      return <div key={idx} style={{ minHeight: '16px', margin: '2px 0' }} dangerouslySetInnerHTML={{ __html: formatted }} />;
    });
  };

  return (
    <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999, fontFamily: 'sans-serif' }}>
      {/* Floating Launcher Button */}
      {!isOpen && (
        <button
          onClick={() => { setIsOpen(true); setIsMinimized(false); }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '12px 20px',
            borderRadius: '50px',
            background: 'linear-[#0f172a], linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
            backgroundColor: '#1d4ed8',
            color: '#ffffff',
            border: 'none',
            boxShadow: '0 8px 25px rgba(29, 78, 216, 0.45), 0 0 15px rgba(59, 130, 246, 0.5)',
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: '0.95rem',
            transition: 'all 0.3s ease',
          }}
          className="ai-launcher-btn"
        >
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Bot size={22} color="#ffffff" />
            <span style={{
              position: 'absolute',
              top: '-3px',
              right: '-3px',
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: '#10b981',
              boxShadow: '0 0 8px #10b981'
            }} />
          </div>
          <span>SafeSphere AI</span>
          <Sparkles size={16} color="#fbbf24" />
        </button>
      )}

      {/* Main Chat Window */}
      {isOpen && (
        <div style={{
          width: isMinimized ? '320px' : '410px',
          height: isMinimized ? '56px' : '560px',
          maxHeight: '80vh',
          backgroundColor: '#0f172a',
          color: '#f8fafc',
          borderRadius: '16px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.1)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        }}>
          {/* Header */}
          <div style={{
            padding: '14px 18px',
            background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
            borderBottom: '1px solid rgba(255,255,255,0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: isMinimized ? 'pointer' : 'default'
          }}
          onClick={() => isMinimized && setIsMinimized(false)}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '34px',
                height: '34px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 10px rgba(59, 130, 246, 0.4)'
              }}>
                <Bot size={20} color="#ffffff" />
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  SafeSphere AI Assistant
                  <Sparkles size={14} color="#fbbf24" />
                </div>
                {!isMinimized && (
                  <div style={{ fontSize: '0.72rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '1px' }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10b981' }} />
                    Active Emergency Assistant
                  </div>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <button
                onClick={(e) => { e.stopPropagation(); setIsMinimized(!isMinimized); }}
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}
                title={isMinimized ? 'Expand' : 'Minimize'}
              >
                <Minimize2 size={16} />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setIsOpen(false); }}
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}
                title="Close"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Message History */}
              <div style={{
                flex: 1,
                padding: '16px',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                backgroundColor: '#0b1120'
              }}>
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                    }}
                  >
                    <div style={{
                      maxWidth: '88%',
                      padding: '10px 14px',
                      borderRadius: msg.sender === 'user' ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                      backgroundColor: msg.sender === 'user' ? '#2563eb' : '#1e293b',
                      color: '#f8fafc',
                      fontSize: '0.88rem',
                      lineHeight: '1.45',
                      boxShadow: msg.sender === 'user' ? '0 4px 12px rgba(37, 99, 235, 0.3)' : '0 4px 12px rgba(0, 0, 0, 0.2)',
                      border: msg.sender === 'assistant' ? '1px solid rgba(255,255,255,0.08)' : 'none'
                    }}>
                      {formatMessageText(msg.text)}
                    </div>
                    <span style={{ fontSize: '0.68rem', color: '#64748b', marginTop: '4px', padding: '0 4px' }}>
                      {msg.timestamp}
                    </span>
                  </div>
                ))}

                {loading && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', backgroundColor: '#1e293b', borderRadius: '12px', width: 'fit-content' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#3b82f6', animation: 'ping 1s infinite' }} />
                    <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Analyzing safety protocol...</span>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Quick Suggestion Chips - Wrapped Grid for Complete Visibility */}
              <div style={{
                padding: '10px 14px',
                backgroundColor: '#0f172a',
                borderTop: '1px solid rgba(255,255,255,0.08)',
                display: 'flex',
                flexWrap: 'wrap',
                gap: '6px 8px',
                alignItems: 'center',
                maxHeight: '90px',
                overflowY: 'auto'
              }}>
                <div style={{ width: '100%', fontSize: '0.68rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' }}>
                  ⚡ Quick Emergency Topics:
                </div>
                {QUICK_PROMPTS.map((qp, i) => (
                  <button
                    key={i}
                    onClick={() => handleSendMessage(qp.prompt)}
                    disabled={loading}
                    style={{
                      padding: '5px 11px',
                      borderRadius: '16px',
                      backgroundColor: 'rgba(30, 41, 59, 0.9)',
                      color: '#93c5fd',
                      border: '1px solid rgba(59, 130, 246, 0.3)',
                      fontSize: '0.74rem',
                      fontWeight: 500,
                      cursor: loading ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s ease',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                    onMouseEnter={(e) => {
                      if (!loading) {
                        e.currentTarget.style.backgroundColor = '#2563eb';
                        e.currentTarget.style.color = '#ffffff';
                        e.currentTarget.style.borderColor = '#3b82f6';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!loading) {
                        e.currentTarget.style.backgroundColor = 'rgba(30, 41, 59, 0.9)';
                        e.currentTarget.style.color = '#93c5fd';
                        e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.3)';
                      }
                    }}
                  >
                    {qp.label}
                  </button>
                ))}
              </div>

              {/* Input Footer */}
              <div style={{
                padding: '12px',
                backgroundColor: '#0f172a',
                borderTop: '1px solid rgba(255,255,255,0.1)',
                display: 'flex',
                gap: '8px'
              }}>
                <input
                  type="text"
                  placeholder="Ask AI safety question..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={loading}
                  style={{
                    flex: 1,
                    padding: '10px 14px',
                    borderRadius: '10px',
                    backgroundColor: '#1e293b',
                    border: '1px solid rgba(255,255,255,0.15)',
                    color: '#ffffff',
                    fontSize: '0.88rem',
                    outline: 'none',
                  }}
                />
                <button
                  onClick={() => handleSendMessage()}
                  disabled={loading || !input.trim()}
                  style={{
                    padding: '10px 14px',
                    borderRadius: '10px',
                    backgroundColor: input.trim() && !loading ? '#2563eb' : '#334155',
                    color: '#ffffff',
                    border: 'none',
                    cursor: input.trim() && !loading ? 'pointer' : 'not-allowed',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <Send size={16} />
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default AIAssistantWidget;

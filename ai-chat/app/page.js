'use client'

import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import remarkGfm from 'remark-gfm';

const LoadingSpinner = () => (
  <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);

const SendIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
    <path d="M3.105 2.289a.75.75 0 00-.826.95l1.414 4.949a.75.75 0 00.95.54l3.853-1.414a.75.75 0 000-1.328L3.23.839a.75.75 0 00-1.125.15zM1.222 10.89A.75.75 0 002.35 9.83l3.853-1.414a.75.75 0 000 1.328L2.35 11.17a.75.75 0 00-1.128-.28zM3.105 17.71a.75.75 0 00.826-.95l-1.414-4.949a.75.75 0 00-.95-.54l-3.853 1.414a.75.75 0 000 1.328l3.853 1.414a.75.75 0 001.125-.15z" />
  </svg>
);

const SunIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-6.364-.386l1.591-1.591M3 12h2.25m.386-6.364l1.591 1.591M12 12a6 6 0 100 12 6 6 0 000-12z" />
  </svg>
);

const MoonIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
    <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25c0 5.385 4.365 9.75 9.75 9.75 2.572 0 4.92-.99 6.752-2.625z" />
  </svg>
);

const CodeBlock = ({ node, inline, className, children, ...props }) => {
  const [copied, setCopied] = useState(false);
  const match = /language-(\w+)/.exec(className || '');
  const codeString = String(children).replace(/\n$/, '');

  const handleCopy = () => {
    navigator.clipboard.writeText(codeString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return !inline ? (
    <div className="relative my-4 rounded-md bg-[#2d2d2d]">
      <div className="flex items-center justify-between px-4 py-2 bg-gray-700/50 rounded-t-md">
        <span className="text-xs font-sans text-gray-400">{match ? match[1] : 'code'}</span>
        <button onClick={handleCopy} className="text-xs text-gray-300 hover:text-white">
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      <SyntaxHighlighter
        style={vscDarkPlus}
        language={match ? match[1] : null}
        PreTag="div"
        {...props}
      >
        {codeString}
      </SyntaxHighlighter>
    </div>
  ) : (
    <code className="bg-gray-200 dark:bg-gray-700 rounded-sm px-1 py-0.5 text-sm font-mono text-red-500 dark:text-red-400">
      {children}
    </code>
  );
};


export default function Home() {
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [theme, setTheme] = useState('dark');
  const chatContainerRef = useRef(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatHistory]);


  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'dark' ? 'light' : 'dark'));
  };

  const handleSubmit = async (isStreaming) => {
    if (!message) return;

    const userMessage = { role: 'user', content: message };
    setChatHistory(prev => [...prev, userMessage, { role: 'model', content: '' }]);
    setMessage('');
    setIsLoading(true);
    setError('');

    try {
      if (isStreaming) {
        const res = await fetch('/api/chat-stream', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message }),
        });
        if (!res.ok || !res.body) throw new Error(`HTTP error! Status: ${res.status}`);

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                if (data.content) {
                  setChatHistory(prev => {
                    const newHistory = [...prev];
                    newHistory[newHistory.length - 1].content += data.content;
                    return newHistory;
                  });
                }
              } catch (e) {
                console.warn('Skipping invalid JSON line:', line);
              }
            }
          }
        }
      } else {
        const res = await axios.post('/api/chat', { message });
        const aiContent = res.data.content || 'No content in response';
        setChatHistory(prev => {
          const newHistory = [...prev];
          newHistory[newHistory.length - 1].content = aiContent;
          return newHistory;
        });
      }
    } catch (err) {
      console.error('API Error:', err.message);
      setError('Failed to fetch response. Please check the console.');
      setChatHistory(prev => {
        const newHistory = [...prev];
        newHistory[newHistory.length - 1].content = 'Sorry, I ran into an error.';
        return newHistory;
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    handleSubmit(false);
  };

  const handleStreamClick = (e) => {
    e.preventDefault();
    handleSubmit(true);
  };


  return (
    <div className={theme}>
      <div className="bg-gray-100 dark:bg-black text-gray-800 dark:text-white min-h-screen font-sans flex items-center justify-center p-4 transition-colors duration-500">
        <div className="w-full max-w-6xl h-[90vh] flex flex-col md:flex-row bg-white dark:bg-gray-900/50 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-2xl shadow-2xl overflow-hidden">
          
          <div className="w-full md:w-2/5 p-6 flex flex-col border-r border-gray-200 dark:border-gray-800">
            <header className="flex-shrink-0 flex justify-between items-center">
              <div className="text-left">
                <h1 className="text-2xl md:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-500 to-indigo-600">
                  AI Chat
                </h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">Enter a prompt below.</p>
              </div>
              <button onClick={toggleTheme} className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors">
                {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
              </button>
            </header>

            <form onSubmit={handleFormSubmit} className="flex-grow flex flex-col mt-6 space-y-4">
              <textarea
                className="w-full flex-grow p-4 bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-white rounded-lg border border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-none transition-all"
                placeholder="Type your message here..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleFormSubmit(e);
                  }
                }}
              />
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg transition-all duration-300 shadow-lg hover:shadow-indigo-500/50"
                >
                  {isLoading ? <LoadingSpinner /> : <SendIcon />}
                  <span>{isLoading ? 'Thinking...' : 'Send'}</span>
                </button>
                <button
                  onClick={handleStreamClick}
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg transition-all duration-300 shadow-lg hover:shadow-purple-500/50"
                >
                  {isLoading ? <LoadingSpinner /> : <SendIcon />}
                  <span>{isLoading ? 'Thinking...' : 'Send (Stream)'}</span>
                </button>
              </div>
            </form>
          </div>
          
          <div className="w-full md:w-3/5 flex flex-col h-full bg-gray-50 dark:bg-gray-900">
            <div ref={chatContainerRef} className="flex-grow overflow-y-auto p-6 space-y-6">
              {chatHistory.length === 0 && !isLoading && (
                <div className="flex h-full items-center justify-center">
                  <p className="text-center text-gray-500 dark:text-gray-400">
                    Your conversation will appear here...
                  </p>
                </div>
              )}
              
              {chatHistory.map((chat, index) => (
                <div key={index} className={`flex gap-4 ${chat.role === 'user' ? 'justify-end' : ''}`}>
                  {chat.role === 'model' && (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-indigo-600 flex-shrink-0"></div>
                  )}
                  <div className={`max-w-xl p-4 rounded-2xl ${chat.role === 'user'
                      ? 'bg-indigo-500 text-white rounded-br-none'
                      : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-white rounded-bl-none shadow-sm'
                    }`}>
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{ code: CodeBlock }}
                      >
                        {chat.content}
                      </ReactMarkdown>
                    </div>
                  </div>
                </div>
              ))}
              {isLoading && chatHistory[chatHistory.length - 1]?.content === '' && (
                <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-indigo-600 flex-shrink-0"></div>
                    <div className="max-w-xl p-4 rounded-2xl bg-white dark:bg-gray-800 flex items-center shadow-sm">
                        <div className="dot-flashing"></div>
                    </div>
                </div>
              )}
              {error && <p className="text-red-500 dark:text-red-400 text-center">{error}</p>}
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        .dot-flashing {
          position: relative;
          width: 10px;
          height: 10px;
          border-radius: 5px;
          background-color: #9880ff;
          color: #9880ff;
          animation: dotFlashing 1s infinite linear alternate;
          animation-delay: .5s;
        }
        .dot-flashing::before, .dot-flashing::after {
          content: '';
          display: inline-block;
          position: absolute;
          top: 0;
        }
        .dot-flashing::before {
          left: -15px;
          width: 10px;
          height: 10px;
          border-radius: 5px;
          background-color: #9880ff;
          color: #9880ff;
          animation: dotFlashing 1s infinite alternate;
          animation-delay: 0s;
        }
        .dot-flashing::after {
          left: 15px;
          width: 10px;
          height: 10px;
          border-radius: 5px;
          background-color: #9880ff;
          color: #9880ff;
          animation: dotFlashing 1s infinite alternate;
          animation-delay: 1s;
        }
        @keyframes dotFlashing {
          0% { background-color: #9880ff; }
          50%, 100% { background-color: rgba(152, 128, 255, 0.2); }
        }
        .prose p { margin-top: 0; margin-bottom: 1em; }
        .prose h1, .prose h2, .prose h3, .prose h4 { margin-top: 1.5em; margin-bottom: 0.5em; font-weight: 600; }
        .prose ul, .prose ol { margin-left: 1.5em; }
        .prose a { color: #6366f1; }
        .prose.dark\\:prose-invert a { color: #818cf8; }
      `}</style>
    </div>
  );
}
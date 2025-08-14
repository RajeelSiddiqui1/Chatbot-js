'use client'

import React, { useState } from 'react';
import axios from 'axios';

export default function Home() {
  const [message, setMessage] = useState('');
  const [response, setResponse] = useState('');
  const [streamResponse, setStreamResponse] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [theme, setTheme] = useState('dark');

  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'dark' ? 'light' : 'dark'));
  };

  const handleChat = async (e) => {
    e.preventDefault();
    if (!message) return;

    setIsLoading(true);
    setResponse('');
    setStreamResponse('');
    setError('');

    try {
      const res = await axios.post('/api/chat', { message });
      console.log('Standard API Response:', res.data);
      setResponse(res.data.content || 'No content in response');
    } catch (err) {
      console.error('Standard API Error:', err.response?.data || err.message);
      setError('Failed to fetch response. Please check the console.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStreamChat = async (e) => {
  e.preventDefault();
  if (!message) return;

  setIsStreaming(true);
  setStreamResponse('');
  setResponse('');
  setError('');

  try {
    const res = await fetch('/api/chat-stream', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message }),
    });

    if (!res.ok) {
      throw new Error(`HTTP error! Status: ${res.status}`);
    }

    if (!res.body) {
      throw new Error('Response body is not readable');
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      console.log('Stream chunk:', chunk); // Debug raw chunk
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6));
            if (data.content) {
              setStreamResponse((prev) => prev + data.content); // Append chunk to response
            }
          } catch (parseError) {
            console.warn('Skipping invalid JSON line:', line);
          }
        }
      }
    }
  } catch (err) {
    console.error('Streaming API Error:', err.message);
    setError('Failed to fetch streaming response. Please check the console.');
  } finally {
    setIsStreaming(false);
  }
};

  const LoadingSpinner = () => (
    <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
  );

  const SendIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
      <path d="M3.105 2.289a.75.75 0 00-.826.95l1.414 4.949a.75.75 0 00.95.54l3.853-1.414a.75.75 0 000-1.328L3.23.839a.75.75 0 00-1.125.15z" />
      <path d="M1.222 10.89A.75.75 0 002.35 9.83l3.853-1.414a.75.75 0 000 1.328L2.35 11.17a.75.75 0 00-1.128-.28zM3.105 17.71a.75.75 0 00.826-.95l-1.414-4.949a.75.75 0 00-.95-.54l-3.853 1.414a.75.75 0 000 1.328l3.853 1.414a.75.75 0 001.125-.15z" />
    </svg>
  );

  const SunIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-6.364-.386l1.591-1.591M3 12h2.25m.386-6.364l1.591 1.591M12 12a6 6 0 100 12 6 6 0 000-12z" />
    </svg>
  );

  const MoonIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25c0 5.385 4.365 9.75 9.75 9.75 2.572 0 4.92-.99 6.752-2.625z" />
    </svg>
  );

  return (
    <div className={theme}>
      <div className="bg-gray-100 dark:bg-black text-gray-800 dark:text-white min-h-screen font-sans flex items-center justify-center p-4 transition-colors duration-500">
        <div className="w-full max-w-3xl bg-white dark:bg-gray-900/50 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-2xl shadow-2xl p-6 md:p-8 space-y-8">
          <header className="flex justify-between items-center">
            <div className="text-left">
              <h1 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-500 to-indigo-600">
                AI Chat Interface
              </h1>
              <p className="text-gray-500 dark:text-gray-400 mt-2">Enter a prompt and get a response from the AI.</p>
            </div>
            <button onClick={toggleTheme} className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors">
              {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
            </button>
          </header>

          <form className="space-y-4">
            <textarea
              className="w-full p-4 bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-white rounded-lg border border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-none transition-all"
              rows="4"
              placeholder="Type your message here..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={handleChat}
                disabled={isLoading || isStreaming}
                className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg transition-all duration-300 shadow-lg hover:shadow-indigo-500/50"
              >
                {isLoading ? <LoadingSpinner /> : <SendIcon />}
                <span>{isLoading ? 'Getting Response...' : 'Send'}</span>
              </button>
              <button
                onClick={handleStreamChat}
                disabled={isLoading || isStreaming}
                className="w-full flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg transition-all duration-300 shadow-lg hover:shadow-purple-500/50"
              >
                {isStreaming ? <LoadingSpinner /> : <SendIcon />}
                <span>{isStreaming ? 'Streaming...' : 'Send (Stream)'}</span>
              </button>
            </div>
          </form>

          <div className="bg-gray-100/50 dark:bg-gray-800/50 rounded-lg p-6 space-y-6 border border-gray-200 dark:border-gray-700 min-h-[150px] flex flex-col justify-center">
            {error && <p className="text-red-500 dark:text-red-400 text-center">{error}</p>}
            
            {response && (
              <div>
                <h2 className="text-lg font-semibold text-gray-600 dark:text-gray-300 mb-2">Standard Response:</h2>
                <p className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap">{response}</p>
                <p className="text-gray-500">Debug: Response length: {response.length}</p>
              </div>
            )}

            {streamResponse && (
              <div>
                <h2 className="text-lg font-semibold text-gray-600 dark:text-gray-300 mb-2">Streaming Response:</h2>
                <p className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap">{streamResponse}</p>
                <p className="text-gray-500">Debug: Stream response length: {streamResponse.length}</p>
              </div>
            )}
            
            {(isLoading || isStreaming) && !error && (
              <div className="flex justify-center items-center p-4">
                <LoadingSpinner />
                <span className="ml-2 text-gray-500 dark:text-gray-400">AI is thinking...</span>
              </div>
            )}

            {!isLoading && !isStreaming && !error && !response && !streamResponse && (
              <p className="text-center text-gray-500 dark:text-gray-400">Your response will appear here...</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
'use client';

import * as React from 'react';
import {useTranslations} from 'next-intl';
import {useRouter} from '@/i18n/routing';

export function Terminal() {
  const t = useTranslations('terminal');
  const router = useRouter();
  
  const [history, setHistory] = React.useState<string[]>([t('welcome')]);
  const [input, setInput] = React.useState('');
  const [username, setUsername] = React.useState('guest');
  
  const terminalBodyRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const commandList = ['help', 'about', 'blog', 'projects', 'whoami', 'clear'];

  React.useEffect(() => {
    const fetchWhoami = async () => {
      try {
        const res = await fetch('/api/whoami');
        if (res.ok) {
          const name = await res.text();
          setUsername(name.toLowerCase() || 'guest');
        }
      } catch {
        setUsername('guest');
      }
    };
    fetchWhoami();
  }, []);

  React.useEffect(() => {
    if (terminalBodyRef.current) {
      terminalBodyRef.current.scrollTop = terminalBodyRef.current.scrollHeight;
    }
  }, [history]);

  const handleCommand = () => {
    const cmd = input.trim().toLowerCase();
    if (!cmd) return;

    const newHistory = [...history, `> ${input}`];

    if (cmd === 'clear') {
      setHistory([]);
    } else if (cmd === 'blog') {
      newHistory.push(t('redirecting_blog'));
      setHistory(newHistory);
      setTimeout(() => router.push('/blog'), 500);
    } else if (cmd === 'projects') {
      newHistory.push(t('redirecting_projects'));
      setHistory(newHistory);
      setTimeout(() => router.push('/projects'), 500);
    } else if (cmd === 'help') {
      newHistory.push(t('help'));
      setHistory(newHistory);
    } else if (cmd === 'whoami') {
      newHistory.push(t('whoami'));
      setHistory(newHistory);
    } else if (cmd === 'about') {
      newHistory.push(t('about'));
      setHistory(newHistory);
    } else {
      newHistory.push(t('not_found', {cmd}));
      setHistory(newHistory);
    }

    setInput('');
  };

  const handleAutocomplete = (e: React.KeyboardEvent) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const currentInput = input.trim().toLowerCase();
      if (!currentInput) return;

      const matches = commandList.filter((c) => c.startsWith(currentInput));
      if (matches.length > 0) {
        setInput(matches[0]);
      }
    }
  };

  return (
    <div 
      className="bg-gray-950 rounded-lg shadow-2xl overflow-hidden font-mono text-sm text-green-400 border border-gray-800"
      onClick={() => inputRef.current?.focus()}
    >
      <div className="bg-gray-900 px-4 py-2 flex items-center justify-between border-b border-gray-800">
        <div className="flex space-x-2">
          <div className="w-3 h-3 rounded-full bg-red-500"></div>
          <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
        </div>
        <div className="text-xs text-gray-500">sh — {username}@valerioiacobucci.com</div>
      </div>
      <div 
        ref={terminalBodyRef}
        className="p-4 h-64 overflow-y-auto space-y-1"
      >
        {history.map((line, i) => (
          <div key={i} className="whitespace-pre-wrap">
            {line}
          </div>
        ))}
        <div className="flex items-center">
          <span className="mr-2 text-gray-400">{username}@valerioiacobucci.com:~$</span>
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCommand();
              handleAutocomplete(e);
            }}
            className="bg-transparent border-none outline-none flex-1 text-green-400 focus:ring-0 p-0"
            spellCheck="false"
            autoComplete="off"
          />
        </div>
      </div>
    </div>
  );
}

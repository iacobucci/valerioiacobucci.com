'use client';

import * as React from 'react';
import {useTranslations} from 'next-intl';
import {useRouter} from '@/i18n/routing';
import { motion } from 'framer-motion';

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
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-gray-950 rounded-2xl shadow-2xl overflow-hidden font-mono text-sm text-emerald-400 border border-white/10 ring-1 ring-white/5"
      onClick={() => inputRef.current?.focus()}
    >
      <div className="bg-white/5 backdrop-blur-md px-4 py-3 flex items-center justify-between border-b border-white/10">
        <div className="flex space-x-2">
          <div className="w-3 h-3 rounded-full bg-rose-500/80 shadow-lg shadow-rose-500/20"></div>
          <div className="w-3 h-3 rounded-full bg-amber-500/80 shadow-lg shadow-amber-500/20"></div>
          <div className="w-3 h-3 rounded-full bg-emerald-500/80 shadow-lg shadow-emerald-500/20"></div>
        </div>
        <div className="text-[10px] uppercase tracking-widest font-bold text-white/30">terminal — {username}</div>
      </div>
      <div 
        ref={terminalBodyRef}
        className="p-6 h-80 overflow-y-auto space-y-2 scrollbar-hide bg-gradient-to-b from-transparent to-emerald-500/[0.02]"
      >
        {history.map((line, i) => (
          <div key={i} className={`whitespace-pre-wrap ${line.startsWith('>') ? 'text-white/50' : 'text-emerald-400'}`}>
            {line}
          </div>
        ))}
        <div className="flex items-center group">
          <span className="mr-2 text-white/30 font-bold">{username}@valerioiacobucci:~$</span>
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCommand();
              handleAutocomplete(e);
            }}
            className="bg-transparent border-none outline-none flex-1 text-emerald-400 focus:ring-0 p-0 selection:bg-emerald-500/30"
            spellCheck="false"
            autoComplete="off"
            autoFocus
          />
        </div>
      </div>
    </motion.div>
  );
}

'use client';

import * as React from 'react';
import {useTranslations} from 'next-intl';
import {useRouter} from '@/i18n/routing';
import { motion } from 'framer-motion';
import { Interpreter } from '@/lib/lispv/lang/interpreter';

export function Terminal() {
  const t = useTranslations('terminal');
  const router = useRouter();
  
  const [history, setHistory] = React.useState<string[]>([t('welcome')]);
  const [input, setInput] = React.useState('');
  const [username, setUsername] = React.useState('guest');
  const [runningProgram, setRunningProgram] = React.useState<string | null>(null);
  const [isMobile, setIsMobile] = React.useState(false);
  
  const terminalBodyRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const commandList = ['help', 'about', 'blog', 'projects', 'whoami', 'clear', 'lispv'];

  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'c') {
        if (runningProgram) {
          setHistory(prev => [...prev, '^C', `Terminated ${runningProgram}`]);
          setRunningProgram(null);
          setInput('');
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [runningProgram]);

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
    const trimmedInput = input.trim();
    
    if (runningProgram === 'lispv') {
      const newHistory = [...history, `lispv> ${input}`];
      if (!trimmedInput) {
        setHistory(newHistory);
        setInput('');
        return;
      }
      try {
        const interpreter = new Interpreter(trimmedInput, false);
        const result = interpreter.run();
        newHistory.push(result.toString());
      } catch (err: any) {
        newHistory.push(`Error: ${err.message}`);
      }
      setHistory(newHistory);
      setInput('');
      return;
    }

    if (!trimmedInput) return;

    const parts = trimmedInput.split(' ');
    const cmd = parts[0].toLowerCase();
    const args = parts.slice(1).join(' ');

    const newHistory = [...history, `> ${input}`];

    if (cmd === 'clear') {
      setHistory([]);
      setInput('');
      return;
    } else if (cmd === 'blog') {
      newHistory.push(t('redirecting_blog'));
    } else if (cmd === 'projects') {
      newHistory.push(t('redirecting_projects'));
    } else if (cmd === 'help') {
      newHistory.push(t('help'));
    } else if (cmd === 'whoami') {
      newHistory.push(t('whoami'));
    } else if (cmd === 'about') {
      newHistory.push(t('about'));
    } else if (cmd === 'lispv') {
      if (!args) {
        setRunningProgram('lispv');
        newHistory.push('Lispv REPL started. Press Ctrl+C to exit.');
      } else {
        try {
          const interpreter = new Interpreter(args, false);
          const result = interpreter.run();
          newHistory.push(result.toString());
        } catch (err: any) {
          newHistory.push(`Error: ${err.message}`);
        }
      }
    } else {
      newHistory.push(t('not_found', {cmd}));
    }

    setHistory(newHistory);
    if (cmd === 'blog') setTimeout(() => router.push('/blog'), 500);
    if (cmd === 'projects') setTimeout(() => router.push('/projects'), 500);
    setInput('');
  };

  const handleAutocomplete = (e: React.KeyboardEvent) => {
    if (e.key === 'Tab' && !runningProgram) {
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
      onClick={() => !isMobile && inputRef.current?.focus()}
    >
      <div className="bg-white/5 backdrop-blur-md px-4 py-3 flex items-center justify-between border-b border-white/10">
        <div className="flex space-x-2">
          <div className="w-3 h-3 rounded-full bg-rose-500/80 shadow-lg shadow-rose-500/20"></div>
          <div className="w-3 h-3 rounded-full bg-amber-500/80 shadow-lg shadow-amber-500/20"></div>
          <div className="w-3 h-3 rounded-full bg-emerald-500/80 shadow-lg shadow-emerald-500/20"></div>
        </div>
        <div className="text-[10px] uppercase tracking-widest font-bold text-white/30">terminal — {username} {runningProgram && `(${runningProgram})`}</div>
      </div>
      <div 
        ref={terminalBodyRef}
        className="p-6 h-80 overflow-y-auto space-y-2 scrollbar-hide bg-gradient-to-b from-transparent to-emerald-500/[0.02]"
      >
        {history.map((line, i) => {
          const isCommand = line.startsWith('>') || line.startsWith('lispv>');
          return (
            <div key={i} className={`whitespace-pre-wrap ${isCommand ? 'text-white/50' : 'text-emerald-400'}`}>
              {line}
            </div>
          );
        })}
        <div className="flex items-center group">
          <span className="mr-2 text-white/30 font-bold">
            {runningProgram ? `${runningProgram}>` : `${username}@valerioiacobucci:~$`}
          </span>
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
            autoFocus={!isMobile}
          />
        </div>
      </div>
    </motion.div>
  );
}

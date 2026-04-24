'use client';

import * as React from 'react';
import {useTranslations} from 'next-intl';
import {useRouter} from '@/i18n/routing';
import { motion } from 'framer-motion';
import { Interpreter } from '@/lib/lispv/lang/interpreter';

interface Program {
  name: string;
  prompt: string;
  onExecute: (input: string, setHistory: React.Dispatch<React.SetStateAction<string[]>>) => void;
  welcomeMessage?: string[];
}

export function Terminal() {
  const t = useTranslations('terminal');
  const router = useRouter();
  
  const [history, setHistory] = React.useState<string[]>([t('welcome')]);
  const [input, setInput] = React.useState('');
  const [username, setUsername] = React.useState('guest');
  const [runningProgram, setRunningProgram] = React.useState<string | null>(null);
  const [isFocused, setIsFocused] = React.useState(false);
  
  // History state: maps program name (or 'shell') to an array of commands
  const [histories, setHistories] = React.useState<Record<string, string[]>>({ shell: [] });
  // Index state: maps program name (or 'shell') to the current history index
  const [historyIndices, setHistoryIndices] = React.useState<Record<string, number>>({ shell: -1 });

  const terminalBodyRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const commandList = ['help', 'about', 'blog', 'projects', 'microblog', 'whoami', 'clear', 'lispv'];

  const programs: Record<string, Program> = {
    lispv: {
      name: 'lispv',
      prompt: 'lispv>',
      welcomeMessage: [
        'Lispv REPL. Press Ctrl+C or type .quit to exit.',
        'syntax: (<op> <args>)',
        '        (defun <name> (args <params>) (<op> <args>))',
        'ops:    +, -, if, greater, less, <user defined fun>',
        'try:    (+ 1 2)',
        '        (defun f (args x) (+ x 1))',
        '        (f (f x))'
      ],
      onExecute: (input, setHistory) => {
        try {
          const interpreter = new Interpreter(input, false);
          const result = interpreter.run();
          setHistory(prev => [...prev, result.toString()]);
        } catch (err: any) {
          setHistory(prev => [...prev, `Error: ${err.message}`]);
        }
      }
    }
  };

  const currentContext = runningProgram || 'shell';
  const currentHistory = histories[currentContext] || [];
  const currentHistoryIndex = historyIndices[currentContext] ?? -1;

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Handle Ctrl+C
      if (e.ctrlKey && e.key === 'c') {
        if (runningProgram) {
          setHistory(prev => [...prev, '^C', `Terminated ${runningProgram}`]);
          setRunningProgram(null);
          setInput('');
        }
        return;
      }

      // Focus terminal on alphanumeric/symbol key press if no other input is focused
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA' ||
        (document.activeElement as HTMLElement)?.isContentEditable
      ) {
        return;
      }

      if (e.key.length === 1 && e.key !== ' ' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        inputRef.current?.focus({ preventScroll: true });
        setInput(prev => prev + e.key);
        e.preventDefault();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [runningProgram]);

  React.useEffect(() => {
    const inputEl = inputRef.current;
    if (!inputEl) return;

    const onFocus = () => setIsFocused(true);
    const onBlur = () => setIsFocused(false);

    inputEl.addEventListener('focus', onFocus);
    inputEl.addEventListener('blur', onBlur);

    return () => {
      inputEl.removeEventListener('focus', onFocus);
      inputEl.removeEventListener('blur', onBlur);
    };
  }, []);

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
    const context = runningProgram || 'shell';
    
    if (trimmedInput) {
      setHistories(prev => ({
        ...prev,
        [context]: [trimmedInput, ...(prev[context] || []).filter(c => c !== trimmedInput)].slice(0, 50)
      }));
    }
    setHistoryIndices(prev => ({ ...prev, [context]: -1 }));

    if (runningProgram && programs[runningProgram]) {
      const program = programs[runningProgram];
      if (trimmedInput === '.quit') {
        setHistory(prev => [...prev, `${program.prompt} ${input}`, 'REPL terminated.']);
        setRunningProgram(null);
        setInput('');
        return;
      }

      setHistory(prev => [...prev, `${program.prompt} ${input}`]);
      if (trimmedInput) {
        program.onExecute(trimmedInput, setHistory);
      }
      setInput('');
      return;
    }

    if (!trimmedInput) return;

    const parts = trimmedInput.split(' ');
    const cmd = parts[0].toLowerCase();
    const args = parts.slice(1).join(' ');

    const newHistory = [...history, `> ${input}`];

    switch (cmd) {
      case 'clear':
        setHistory([]);
        setInput('');
        return;
      case 'blog':
        newHistory.push(t('redirecting_blog'));
        setTimeout(() => router.push('/blog'), 500);
        break;
      case 'projects':
        newHistory.push(t('redirecting_projects'));
        setTimeout(() => router.push('/projects'), 500);
        break;
      case 'microblog':
        newHistory.push(t('redirecting_microblog'));
        setTimeout(() => router.push('/microblog'), 500);
        break;
      case 'help':
        newHistory.push(`${t('help')}${commandList.join(', ')}`);
        break;
      case 'whoami':
        newHistory.push(t('whoami'));
        break;
      case 'about':
        newHistory.push(t('about'));
        break;
      case 'lispv': {
        const program = programs.lispv;
        if (!args) {
          setRunningProgram('lispv');
          if (program.welcomeMessage) {
            newHistory.push(...program.welcomeMessage);
          }
        } else {
          program.onExecute(args, (val) => {
             if (typeof val === 'function') {
               setHistory(prev => val(prev));
             } else {
               setHistory(val);
             }
          });
        }
        break;
      }
      default:
        newHistory.push(t('not_found', { cmd }));
    }

    setHistory(newHistory);
    setInput('');
  };

  const handleHistoryNavigation = (e: React.KeyboardEvent) => {
    const context = runningProgram || 'shell';
    const history = currentHistory;
    const index = currentHistoryIndex;

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (index < history.length - 1) {
        const newIndex = index + 1;
        setHistoryIndices(prev => ({ ...prev, [context]: newIndex }));
        setInput(history[newIndex]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (index > 0) {
        const newIndex = index - 1;
        setHistoryIndices(prev => ({ ...prev, [context]: newIndex }));
        setInput(history[newIndex]);
      } else if (index === 0) {
        setHistoryIndices(prev => ({ ...prev, [context]: -1 }));
        setInput('');
      }
    }
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
      onClick={() => inputRef.current?.focus({ preventScroll: true })}
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
          const isCommand = line.startsWith('>') || (runningProgram && line.startsWith(programs[runningProgram].prompt));
          return (
            <div key={i} className={`whitespace-pre-wrap ${isCommand ? 'text-white/50' : 'text-emerald-400'}`}>
              {line}
            </div>
          );
        })}
        <div className="flex items-center group relative min-h-[1.5rem]">
          <span className="mr-2 text-white/30 font-bold shrink-0">
            {runningProgram ? programs[runningProgram].prompt : `${username}@term:~$`}
          </span>
          <div className="relative flex-1 flex items-center overflow-hidden">
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCommand();
                if (e.ctrlKey && e.key === 'l') {
                  e.preventDefault();
                  setHistory([]);
                }
                handleHistoryNavigation(e);
                handleAutocomplete(e);
              }}
              className={`bg-transparent border-none outline-none text-emerald-400 focus:ring-0 p-0 selection:bg-emerald-500/30 w-full z-10 ${!isFocused ? 'text-transparent' : ''}`}
              spellCheck="false"
              autoComplete="off"
            />
            {!isFocused && (
              <div className="absolute inset-0 flex items-center whitespace-pre pointer-events-none">
                <span className="text-emerald-400">{input}</span>
                <motion.div
                  animate={{ opacity: [1, 1, 0, 0] }}
                  transition={{ 
                    duration: 0.8, 
                    repeat: Infinity, 
                    times: [0, 0.5, 0.5, 1],
                    ease: "linear"
                  }}
                  className="w-2 h-4 bg-emerald-400 shrink-0 ml-0.5"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

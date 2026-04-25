'use client';

import { signOut, useSession } from "next-auth/react";
import Image from "next/image";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MdLogout, MdPerson, MdEdit } from "react-icons/md";
import GitHubLoginButton from "./GitHubLoginButton";
import { Link } from "@/i18n/routing";
import { useParams } from "next/navigation";

export default function UserMenu() {
  const { data: session, status } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const params = useParams();
  const locale = params.locale as string;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (status === "loading") {
    return <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse" />;
  }

  if (!session) {
    return (
      <GitHubLoginButton 
        label="GitHub" 
        responsive={true}
        className="px-3 py-1.5 h-9" 
      />
    );
  }

  const user = session.user as { email?: string | null; username?: string; image?: string | null; name?: string | null };
  const isAuthorized = 
    user?.email?.toLowerCase().trim() === "iacobuccivalerio@gmail.com" || 
    user?.username === "iacobucci";

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center w-9 h-9 rounded-full overflow-hidden border-2 border-transparent hover:border-gray-300 dark:hover:border-gray-600 transition-all focus:outline-none"
      >
        {session.user?.image ? (
          <Image
            src={session.user.image}
            alt={session.user.name || "User"}
            width={36}
            height={36}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
            <MdPerson className="w-6 h-6 text-gray-500" />
          </div>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.1 }}
            className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-900 rounded-xl shadow-xl border border-gray-100 dark:border-gray-800 py-2 z-50"
          >
            <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-800 mb-1">
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium truncate">
                {session.user?.name}
              </p>
              <p className="text-[10px] text-gray-400 dark:text-gray-500 truncate">
                {session.user?.email}
              </p>
            </div>
            
            {isAuthorized && (
              <Link
                href="/admin/editor"
                className="flex items-center w-full gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                onClick={() => setIsOpen(false)}
              >
                <MdEdit className="w-4 h-4" />
                Content Editor
              </Link>
            )}

            <button
              onClick={() => signOut()}
              className="flex items-center w-full gap-2 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors border-t border-gray-100 dark:border-gray-800 mt-1 pt-2"
            >
              <MdLogout className="w-4 h-4" />
              Sign Out
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

'use client';

import { signIn } from "next-auth/react";
import { FaGithub } from "react-icons/fa6";

interface GitHubLoginButtonProps {
  className?: string;
  label?: string;
  responsive?: boolean;
}

export default function GitHubLoginButton({ className, label = "Login with GitHub", responsive = false }: GitHubLoginButtonProps) {
  return (
    <button
      onClick={() => signIn("github")}
      className={`
        flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold
        bg-[#24292f] hover:bg-[#24292f]/90 text-white
        transition-all duration-200 shadow-sm hover:shadow-md
        whitespace-nowrap
        ${className}
      `}
    >
      <FaGithub className="w-5 h-5" />
      <span className={responsive ? "hidden sm:inline" : ""}>{label}</span>
    </button>
  );
}

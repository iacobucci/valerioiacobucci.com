'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import { Link, usePathname } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import LanguageSwitcher from './LanguageSwitcher';
import ColorModeToggle from './ColorModeToggle';
import Search from './Search';

export default function Navbar() {
	const t = useTranslations('nav');
	const pathname = usePathname();
	const [menuOpen, setMenuOpen] = useState(false);

	const navLinks = [
		{ href: '/', label: t('home') },
		{ href: '/blog', label: t('blog') },
		// { href: '/cv', label: t('cv') },
		{ href: '/favorites', label: t('favorites') },
		{ href: '/projects', label: t('projects') },
	];

	const isHome = pathname === '/';

	return (
		<nav className="bg-bg-light dark:bg-bg-dark border-b border-gray-100 dark:border-gray-800 sticky top-0 z-50">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<div className="flex justify-between h-16">

					<div className="flex items-center md:hidden">
						<AnimatePresence>
							{!isHome && (
								<motion.div
									initial={{ opacity: 0, scale: 0 }}
									animate={{ opacity: 1, scale: 1 }}
									exit={{ opacity: 0, scale: 0 }}
									transition={{ type: 'spring', damping: 15, stiffness: 200 }}
								>
									<Link href="/" className="flex items-center gap-1 text-sm font-medium text-gray-500 dark:text-gray-400">
										<div className="w-12 flex justify-center items-center h-10">
											<div className="w-10 h-10 rounded-full flex items-center justify-center overflow-hidden hover:scale-105 transition-transform border border-gray-100 dark:border-gray-800">
												<Image
													src="/drawing.png"
													alt="Logo"
													width={40}
													height={40}
													className="w-full h-full object-cover"
												/>
											</div>
										</div>
									</Link>
								</motion.div>
							)}
						</AnimatePresence>
					</div>

					<div className="flex">
						<div className="hidden md:flex md:space-x-8">
							<Link
								href="/"
								className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition duration-150 ease-in-out ${pathname === '/'
										? 'border-gray-800 dark:border-fg-dark text-fg-light dark:text-fg-dark'
										: 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-fg-dark hover:border-gray-300'
									}`}
							>
								<div className="w-12 flex justify-center items-center relative h-10">
									<AnimatePresence mode="wait">
										{!isHome ? (
											<motion.div
												key="icon"
												initial={{ opacity: 0, scale: 0 }}
												animate={{ opacity: 1, scale: 1 }}
												exit={{ opacity: 0, scale: 0 }}
												transition={{ duration: 0.2 }}
											>
												<div className="w-10 h-10 rounded-full flex items-center justify-center overflow-hidden hover:scale-105 transition-transform border border-gray-100 dark:border-gray-800">
													<Image
														src="/drawing.png"
														alt="Logo"
														width={40}
														height={40}
														className="w-full h-full object-cover"
													/>
												</div>
											</motion.div>
										) : (
											<motion.span
												key="text"
												initial={{ opacity: 0, scale: 0 }}
												animate={{ opacity: 1, scale: 1 }}
												exit={{ opacity: 0, scale: 0 }}
												transition={{ duration: 0.2 }}
											>
												{t('home')}
											</motion.span>
										)}
									</AnimatePresence>
								</div>
							</Link>

							{navLinks.slice(1).map((link) => (
								<Link
									key={link.href}
									href={link.href}
									className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition duration-150 ease-in-out ${pathname === link.href
											? 'border-gray-800 dark:border-fg-dark text-fg-light dark:text-fg-dark'
											: 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-fg-dark hover:border-gray-300'
										}`}
								>
									{link.label}
								</Link>
							))}
						</div>
					</div>

					<div className="hidden md:ml-6 md:flex md:items-center gap-2">
						<Search />
						<LanguageSwitcher />
						<ColorModeToggle />
					</div>

					<div className="-mr-2 flex items-center md:hidden gap-1">
						<Search />
						<LanguageSwitcher />
						<ColorModeToggle />
						<button
							onClick={() => setMenuOpen(!menuOpen)}
							className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none transition duration-150 ease-in-out"
							aria-label="Main menu"
						>
							{menuOpen ? <X className="h-6 w-6 text-fg-light dark:text-fg-dark" /> : <Menu className="h-6 w-6 text-fg-light dark:text-fg-dark" />}
						</button>
					</div>
				</div>
			</div>

			{/* Mobile Menu */}
			<AnimatePresence>
				{menuOpen && (
					<motion.div
						initial={{ height: 0, opacity: 0 }}
						animate={{ height: 'auto', opacity: 1 }}
						exit={{ height: 0, opacity: 0 }}
						className="md:hidden overflow-hidden bg-bg-light dark:bg-bg-dark border-t border-gray-100 dark:border-gray-800"
					>
						<div className="pt-2 pb-3 space-y-1">
							{navLinks.map((link) => (
								<Link
									key={link.href}
									href={link.href}
									onClick={() => setMenuOpen(false)}
									className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium transition duration-150 ease-in-out ${pathname === link.href
											? 'border-gray-800 dark:border-fg-dark text-fg-light dark:text-fg-dark bg-gray-50 dark:bg-gray-800'
											: 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-fg-dark hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-gray-300'
										}`}
								>
									{link.label}
								</Link>
							))}
						</div>
					</motion.div>
				)}
			</AnimatePresence>
		</nav>
	);
}

'use client';

import { useTranslations } from 'next-intl';
import { Terminal } from '@/components/Terminal';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Link } from '@/i18n/routing';
import { FaGithub, FaYoutube, FaRss } from 'react-icons/fa6';
import { MdEmail } from 'react-icons/md';
import { useLocale } from 'next-intl';

export default function HomePage() {
	const t = useTranslations();
	const locale = useLocale();

	const socialLinks = [
		{
			href: 'https://github.com/iacobucci',
			icon: FaGithub,
			label: 'GitHub',
			color: 'hover:text-[#24292e] dark:hover:text-white'
		},
		{
			href: 'https://youtube.com/@valerioiacobucci',
			icon: FaYoutube,
			label: 'YouTube',
			color: 'hover:text-[#FF0000]'
		},
		{
			href: 'mailto:valerio@valerioiacobucci.com',
			icon: MdEmail,
			label: 'Email',
			color: 'hover:text-accent-light dark:hover:text-accent-dark'
		},
		{
			href: `/${locale}/feed.xml`,
			icon: FaRss,
			label: 'RSS',
			color: 'hover:text-[#ee802f]'
		},
	];

	return (
		<div className="flex flex-col flex-1 bg-bg-light font-sans dark:bg-bg-dark overflow-hidden">
			<main className="flex-1 w-full max-w-7xl mx-auto py-12 px-6 sm:px-12 flex flex-col lg:flex-row items-center justify-center gap-12 lg:gap-24">

				{/* Hero section */}
				<div className="flex-1 flex flex-col items-center lg:items-start text-center lg:text-left space-y-10 max-w-2xl relative">

					{/* Decorative background element */}
					<div className="absolute -top-20 -left-20 w-64 h-64 bg-accent-light/5 dark:bg-accent-dark/5 rounded-full blur-3xl -z-10" />

					<motion.div
						initial={{ opacity: 0, scale: 0.8, rotate: -5 }}
						animate={{ opacity: 1, scale: 1, rotate: -3 }}
						whileHover={{ rotate: 0, scale: 1.05 }}
						transition={{ type: 'spring', damping: 12, stiffness: 100 }}
						className="relative w-56 h-56 sm:w-72 sm:h-72 mb-4 cursor-pointer"
					>
						<div className="absolute inset-0 bg-accent-light/20 dark:bg-accent-dark/10 rounded-3xl blur-2xl -z-10" />
						<div className="relative w-full h-full rounded-3xl overflow-hidden shadow-2xl border-4 border-white dark:border-gray-800 ring-1 ring-gray-100 dark:ring-gray-700">
							<Image
								src="/drawing.png"
								alt="Valerio Iacobucci"
								fill
								sizes="296 296"
								className="object-cover"
								priority
							/>
						</div>
					</motion.div>

					<div className="space-y-6">
						<motion.h1
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: 0.2 }}
							className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tighter text-fg-light dark:text-fg-dark leading-[0.9]"
						>
							Valerio Iacobucci
						</motion.h1>
						<motion.h2
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: 0.25 }}
							className="text-xl sm:text-2xl lg:text-3xl tracking-tighter text-fg-light dark:text-fg-dark leading-[0.95]"
						>
							{t("home.intro")}
						</motion.h2>
						<div className="space-y-4 w-full flex flex-col items-center lg:items-start">
							<motion.p
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ delay: 0.3 }}
								className="text-xl sm:text-2xl text-gray-500 dark:text-gray-400 max-w-lg leading-relaxed font-medium"
							>
								{t("home.connect")}
							</motion.p>

							{/* Social Links */}
							<motion.div
								initial={{ opacity: 0, y: 10 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ delay: 0.35 }}
								className="flex gap-6 justify-center"
							>
								{socialLinks.map((social) => (
									<a
										key={social.label}
										href={social.href}
										target="_blank"
										rel="noopener noreferrer"
										className={`text-3xl text-gray-400 transition-all duration-300 hover:scale-110 active:scale-95 ${social.color}`}
										aria-label={social.label}
										title={social.label}
									>
										<social.icon />
									</a>
								))}
							</motion.div>
						</div>
					</div>

					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.4 }}
						className="flex flex-wrap gap-5 justify-center lg:justify-start"
					>
						<Link
							href="/blog"
							className="group relative px-10 py-4 bg-fg-light text-bg-light dark:bg-fg-dark dark:text-bg-dark font-black rounded-2xl hover:scale-105 active:scale-95 transition-all overflow-hidden"
						>
							<span className="relative z-10">{t("home.read_blog")}</span>
							<div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
						</Link>
						<Link
							href="/projects"
							className="px-10 py-4 border-2 border-gray-200 dark:border-gray-800 text-fg-light dark:text-fg-dark font-black rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600 transition-all active:scale-95"
						>
							{t("projects.title")}
						</Link>
					</motion.div>
				</div>

				{/* Terminal section */}
				<motion.div
					initial={{ opacity: 0, x: 50 }}
					animate={{ opacity: 1, x: 0 }}
					transition={{ delay: 0.5, type: 'spring', damping: 20 }}
					className="flex-1 w-full max-w-xl lg:max-w-2xl relative"
				>
					<div className="absolute -inset-4 bg-gradient-to-tr from-accent-light/20 via-transparent to-emerald-500/20 rounded-[2rem] blur-2xl opacity-50" />
					<div className="relative bg-bg-light/50 dark:bg-bg-dark/50 backdrop-blur-sm rounded-3xl p-1 shadow-2xl ring-1 ring-gray-200 dark:ring-gray-800">
						<Terminal />
					</div>
				</motion.div>

			</main>
		</div>
	);
}

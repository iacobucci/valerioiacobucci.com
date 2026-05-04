import type { ContentMetadata } from '@/lib/content';
import { FormattedDate } from '@/components/FormattedDate';
import { Link } from '@/i18n/routing';
import Image from 'next/image';
import { MdLanguage } from 'react-icons/md';

interface BlogPostCardProps {
	post: ContentMetadata;
	locale: string;
}

export default function BlogPostCard({ post, locale }: BlogPostCardProps) {
	let finalCover = post.cover;
	if (typeof finalCover === 'string' && !finalCover.startsWith('http') && !finalCover.startsWith('/')) {
		const date = post.updated || post.date;
		const version = date ? new Date(date).getTime() : '';
		finalCover = `/assets/blog/${post.slug}/${finalCover.startsWith('./') ? finalCover.slice(2) : finalCover}`;
		if (version) {
			finalCover += `?v=${version}`;
		}
	}
	
	return (
		<Link 
			href={`/blog/${post.slug}`}
			suppressHydrationWarning
			className="group flex flex-col bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 overflow-hidden hover:shadow-2xl transition-all h-full"
		>
			{finalCover && (
				<div className="relative h-48 w-full overflow-hidden">
					<Image 
						src={finalCover as string}
						alt={post.title}
						fill
						unoptimized
						className="object-cover group-hover:scale-110 transition-transform duration-500"
					/>
				</div>
			)}
			<div className="p-6 flex flex-col flex-1">
				<div className="flex flex-wrap items-center gap-2 mb-3">
					<div className="flex gap-2">
						{post.tags?.slice(0, 2).map(tag => (
							<span key={tag} className="text-[10px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400">
								#{tag.toUpperCase()}
							</span>
						))}
					</div>
					{post.isFallback && (
						<span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 text-[10px] font-bold uppercase tracking-widest">
							<MdLanguage className="w-3 h-3" />
							{post.language.toUpperCase()} ONLY
						</span>
					)}
				</div>
				<h3 className="text-xl font-bold text-fg-light dark:text-fg-dark mb-2 group-hover:text-blue-600 transition-colors">
					{post.title}
				</h3>
				<p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-4">
					{post.description}
				</p>
				<div className="mt-auto text-xs font-bold text-gray-400">
					<FormattedDate date={post.date || ''} locale={locale} />
				</div>
			</div>
		</Link>
	);
}

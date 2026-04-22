'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { MicroblogPostSerializable } from '@/lib/db';
import MicroblogPostCard from './MicroblogPostCard';
import { motion, useAnimation } from 'framer-motion';

interface MicroblogListProps {
	posts: MicroblogPostSerializable[];
	locale: string;
	noPostsMessage: string;
}

export default function MicroblogList({ posts: initialPosts, locale, noPostsMessage }: MicroblogListProps) {
	const [posts, setPosts] = useState<MicroblogPostSerializable[]>(initialPosts);
	const [offset, setOffset] = useState(initialPosts.length);
	const [hasMore, setHasMore] = useState(initialPosts.length >= 20);
	const [isLoading, setIsLoading] = useState(false);
	const [focusedIndex, setFocusedIndex] = useState<number>(-1);
	const [isMounted, setIsMounted] = useState(false);

	const listRef = useRef<HTMLDivElement>(null);
	const observerTarget = useRef<HTMLDivElement>(null);

	useEffect(() => {
		setIsMounted(true);
	}, []);

	// Sync with initialPosts when they change (e.g., after a new post is added via Server Action)
	useEffect(() => {
		setPosts(initialPosts);
		setOffset(initialPosts.length);
		setHasMore(initialPosts.length >= 20);
	}, [initialPosts]);

	const loadMorePosts = useCallback(async () => {
		if (isLoading || !hasMore) return;

		setIsLoading(true);
		try {
			const response = await fetch(`/api/microblog?limit=20&offset=${offset}`);
			if (!response.ok) throw new Error('Failed to fetch');

			const newPosts: MicroblogPostSerializable[] = await response.json();

			if (newPosts.length === 0) {
				setHasMore(false);
			} else {
				setPosts(prev => {
					// Prevent duplicates
					const existingIds = new Set(prev.map(p => p.id));
					const filteredNewPosts = newPosts.filter(p => !existingIds.has(p.id));
					return [...prev, ...filteredNewPosts];
				});
				setOffset(prev => prev + newPosts.length);
				setHasMore(newPosts.length === 20);
			}
		} catch (error) {
			console.error('Error loading more posts:', error);
			setHasMore(false);
		} finally {
			setIsLoading(false);
		}
	}, [isLoading, hasMore, offset]);

	useEffect(() => {
		const observer = new IntersectionObserver(
			entries => {
				if (entries[0].isIntersecting && hasMore && !isLoading) {
					loadMorePosts();
				}
			},
			{ threshold: 0.1, rootMargin: '100px' }
		);

		const currentTarget = observerTarget.current;
		if (currentTarget) {
			observer.observe(currentTarget);
		}

		return () => {
			if (currentTarget) {
				observer.unobserve(currentTarget);
			}
		};
	}, [loadMorePosts, hasMore, isLoading]);

	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (
				document.activeElement?.tagName === 'INPUT' ||
				document.activeElement?.tagName === 'TEXTAREA' ||
				(document.activeElement as HTMLElement)?.isContentEditable
			) {
				return;
			}

			if (e.key === 'j' || e.key === 'ArrowDown') {
				e.preventDefault();
				setFocusedIndex(prev => (prev < posts.length - 1 ? prev + 1 : prev));
			} else if (e.key === 'k' || e.key === 'ArrowUp') {
				e.preventDefault();
				setFocusedIndex(prev => (prev > 0 ? prev - 1 : 0));
			}
		};

		window.addEventListener('keydown', handleKeyDown);
		return () => window.removeEventListener('keydown', handleKeyDown);
	}, [posts.length]);

	useEffect(() => {
		if (focusedIndex >= 0 && listRef.current) {
			const children = listRef.current.children;
			const focusedElement = children[focusedIndex] as HTMLElement;
			if (focusedElement) {
				focusedElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
			}
		}
	}, [focusedIndex]);

	if (posts.length === 0 && !isLoading) {
		return (
			<div className="text-center py-20 bg-gray-50 dark:bg-gray-900/50 rounded-3xl border-2 border-dashed border-gray-100 dark:border-gray-800">
				<p className="text-gray-500 dark:text-gray-400 font-medium">
					{noPostsMessage}
				</p>
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-6">
			<motion.div
				className="space-y-6"
				ref={listRef}
				initial={false}
				animate="show"
				variants={{
					show: {
						transition: {
							staggerChildren: 0.05
						}
					}
				}}
			>
				{posts.map((post, index) => (
					<div
						key={post.id}
						onMouseEnter={() => setFocusedIndex(index)}
						style={{ animationDelay: `${Math.min(index, 10) * 50}ms` }}
						className={`card-enter transition-all duration-200 rounded-2xl ${index === focusedIndex
								? 'ring-2 ring-blue-500 ring-offset-4 dark:ring-offset-bg-dark shadow-lg scale-[1.02]'
								: ''
							}`}
					>

						<MicroblogPostCard post={post} locale={locale} />
					</div>
				))}
			</motion.div>

			<div ref={observerTarget} className="py-8 flex justify-center">
				{isLoading && (
					<div className="flex flex-col items-center gap-2">
						<div className="w-8 h-8 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
						<span className="text-sm text-gray-500 font-medium">Loading more...</span>
					</div>
				)}
				{!hasMore && posts.length > 0 && (
					<p className="text-gray-400 text-sm italic">Lorem ipsum.</p>
				)}
			</div>
		</div >
	);
}

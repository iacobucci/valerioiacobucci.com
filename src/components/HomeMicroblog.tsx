'use client';

import React, { useEffect, useState } from 'react';
import { MicroblogPostSerializable } from '@/lib/db';
import MicroblogPostCard from './MicroblogPostCard';
import { cachedMicroblogPosts, setCachedMicroblogPosts } from '@/lib/microblog-cache';

interface HomeMicroblogProps {
	initialPosts: MicroblogPostSerializable[];
	locale: string;
}

export default function HomeMicroblog({ initialPosts, locale }: HomeMicroblogProps) {
	// Use cached posts if available, otherwise use initialPosts from server
	const [posts, setPosts] = useState<MicroblogPostSerializable[]>(() => {
		if (cachedMicroblogPosts) {
			// Return the first 3 posts from cache
			return cachedMicroblogPosts.slice(0, 3);
		}
		return initialPosts;
	});

	useEffect(() => {
		// Update cache when we get new initialPosts from server
		setCachedMicroblogPosts(initialPosts);
		setPosts(initialPosts);
	}, [initialPosts]);

	return (
		<div className="space-y-8 relative">
			<div className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-gray-200 dark:via-gray-800 to-transparent hidden sm:block" />
			{posts.map((post) => (
				<div key={post.id} className="relative z-10">
					<MicroblogPostCard post={post} locale={locale} />
				</div>
			))}
		</div>
	);
}

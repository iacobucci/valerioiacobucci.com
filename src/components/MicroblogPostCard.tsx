'use client';

import React, { useTransition } from 'react';
import { MicroblogPostSerializable } from '@/lib/db';
import Image from 'next/image';
import { FormattedDate } from './FormattedDate';
import { useSession } from 'next-auth/react';
import { toggleReactionAction } from '@/lib/actions/microblog';

import Linkify from 'linkify-react';

interface MicroblogPostCardProps {
	post: MicroblogPostSerializable;
	locale: string;
}

const linkifyOptions = {
	className: 'text-blue-600 dark:text-blue-400 hover:underline',
	target: '_blank',
	rel: 'noopener noreferrer'
};

export default function MicroblogPostCard({ post, locale }: MicroblogPostCardProps) {
	const { data: session } = useSession();
	const [isPending, startTransition] = useTransition();
	
	const user = session?.user as { id?: string; sub?: string; username?: string } | undefined;
	const userId = user ? (user.id || user.sub) : null;
	const hasReacted = post.reactions?.some(r => r.userId === userId);
	const reactionsCount = post.reactions?.length || 0;
	
	const handleReaction = () => {
		if (!session) {
			// Potremmo mostrare un messaggio o reindirizzare al login
			alert('You must be logged in with GitHub to vote!');
			return;
		}
		
		startTransition(async () => {
			try {
				await toggleReactionAction(post.id);
			} catch (error) {
				console.error('Failed to toggle reaction:', error);
			}
		});
	};

	return (
		<div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 shadow-sm hover:shadow-md transition-shadow text-left">
			<div className="flex flex-col gap-4">
				<div className="flex justify-between items-start text-xs text-gray-500 dark:text-gray-400">
					<div className="font-mono opacity-50">#{post.id}</div>
					<FormattedDate date={post.created_at} locale={locale} />
				</div>

				<div className="text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-wrap break-words">
					<Linkify options={linkifyOptions}>
						{post.content}
					</Linkify>
				</div>

				{post.image_data && (
					<div className="rounded-xl overflow-hidden mt-2 border border-gray-100 dark:border-gray-800">
						{/* eslint-disable-next-line @next/next/no-img-element */}
						<img
							src={`data:image/webp;base64,${post.image_data}`}
							alt="Post image"
							className="w-full h-auto block"
						/>
					</div>
				)}

				<div className="flex items-center justify-between mt-2 pt-3 border-t border-gray-50 dark:border-gray-800/50">
					<div className="flex items-center gap-3">
						<button
							onClick={handleReaction}
							disabled={isPending}
							className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-all text-sm font-medium ${
								hasReacted 
									? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 ring-1 ring-purple-200 dark:ring-purple-800' 
									: 'bg-gray-50 text-gray-600 dark:bg-gray-800 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
							} ${isPending ? 'opacity-50 cursor-not-allowed' : ''}`}
							title="Invadivote!"
						>
							<span className={hasReacted ? 'animate-pulse' : ''}>👾</span>
							<span>{reactionsCount > 0 ? reactionsCount : 'Invotes'}</span>
						</button>

						{post.reactions && post.reactions.length > 0 && (
							<div className="flex -space-x-2 overflow-hidden">
								{post.reactions.slice(0, 5).map((reaction) => (
									<div 
										key={reaction.id} 
										className="inline-block h-6 w-6 rounded-full ring-2 ring-white dark:ring-gray-900 overflow-hidden bg-gray-100 dark:bg-gray-800"
										title={reaction.username}
									>
										{reaction.userImage ? (
											<Image
												src={reaction.userImage}
												alt={reaction.username}
												width={24}
												height={24}
												className="h-full w-full object-cover"
											/>
										) : (
											<div className="h-full w-full flex items-center justify-center text-[10px] font-bold text-gray-400">
												{reaction.username.substring(0, 1).toUpperCase()}
											</div>
										)}
									</div>
								))}
								{post.reactions.length > 5 && (
									<div className="flex items-center justify-center h-6 w-6 rounded-full bg-gray-100 dark:bg-gray-800 ring-2 ring-white dark:ring-gray-900 text-[10px] font-medium text-gray-500 dark:text-gray-400">
										+{post.reactions.length - 5}
									</div>
								)}
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}

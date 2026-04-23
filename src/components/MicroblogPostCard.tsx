'use client';

import React, { useState, useTransition, useRef, useEffect } from 'react';
import { MicroblogPostSerializable } from '@/lib/db';
import Image from 'next/image';
import { FormattedDate } from './FormattedDate';
import { useSession } from 'next-auth/react';
import { toggleReactionAction, updatePostAction, deletePostAction } from '@/lib/actions/microblog';
import { MdEdit, MdDelete, MdCheck, MdClose, MdMoreVert } from 'react-icons/md';
import { Share2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from '@/lib/toast';

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
	const [isEditing, setIsEditing] = useState(false);
	const [editContent, setEditContent] = useState(post.content);
	const [isMenuOpen, setIsMenuOpen] = useState(false);
	const menuRef = useRef<HTMLDivElement>(null);
	
	const user = session?.user as { id?: string; sub?: string; username?: string; email?: string | null } | undefined;
	const userId = user ? (user.id || user.sub) : null;
	const hasReacted = post.reactions?.some(r => r.userId === userId);
	const reactionsCount = post.reactions?.length || 0;

	const isAuthor = 
		user?.email?.toLowerCase().trim() === 'iacobuccivalerio@gmail.com' ||
		user?.username === 'iacobucci';

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
				setIsMenuOpen(false);
			}
		};
		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);
	
	const handleReaction = () => {
		if (!session) {
			toast.info('You must be logged in with GitHub to vote!', true);
			return;
		}
		
		startTransition(async () => {
			try {
				await toggleReactionAction(post.id);
			} catch (error) {
				console.error('Failed to toggle reaction:', error);
				toast.error('Failed to toggle reaction');
			}
		});
	};

	const handleUpdate = () => {
		if (editContent === post.content) {
			setIsEditing(false);
			return;
		}

		startTransition(async () => {
			try {
				const result = await updatePostAction(post.id, editContent);
				if (result.success) {
					setIsEditing(false);
					toast.success('Post updated successfully!');
				}
			} catch (error) {
				console.error('Failed to update post:', error);
				toast.error('Failed to update post');
			}
		});
	};

	const handleDelete = () => {
		if (!confirm('Are you sure you want to delete this post?')) return;
		setIsMenuOpen(false);

		startTransition(async () => {
			try {
				await deletePostAction(post.id);
				toast.success('Post deleted successfully!');
			} catch (error) {
				console.error('Failed to delete post:', error);
				toast.error('Failed to delete post');
			}
		});
	};

	const handleShare = () => {
		const publicId = post.id - 1;
		const url = `${window.location.origin}/${locale}/microblog/${publicId}`;
		
		if (navigator.share) {
			navigator.share({
				title: `Valerio Iacobucci - Microblog Post #${publicId}`,
				text: post.content.substring(0, 100) + '...',
				url: url,
			}).catch(console.error);
		} else {
			navigator.clipboard.writeText(url).then(() => {
				toast.success('Link copied to clipboard!');
			}).catch(console.error);
		}
		setIsMenuOpen(false);
	};

	return (
		<div 
			id={`post-${post.id - 1}`}
			className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 shadow-sm hover:shadow-md transition-shadow text-left group scroll-mt-24"
		>
			<div className="flex flex-col gap-4">
				<div className="flex justify-between items-start text-xs text-gray-500 dark:text-gray-400">
					<div className="flex items-center gap-2">
						<div className="font-mono opacity-50">#{post.id - 1}</div>
					</div>
					<div className="flex items-center gap-3">
						<FormattedDate date={post.created_at} locale={locale} />
						
						{!isEditing && (
							<div 
								className={`relative transition-opacity duration-200 ${isMenuOpen ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`} 
								ref={menuRef}
							>
								<button 
									onClick={() => setIsMenuOpen(!isMenuOpen)}
									className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
								>
									<MdMoreVert className="w-5 h-5" />
								</button>

								<AnimatePresence>
									{isMenuOpen && (
										<motion.div
											initial={{ opacity: 0, y: 5, scale: 0.95 }}
											animate={{ opacity: 1, y: 0, scale: 1 }}
											exit={{ opacity: 0, y: 5, scale: 0.95 }}
											transition={{ duration: 0.1 }}
											className="absolute right-0 mt-1 w-32 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 py-1.5 z-20"
										>
											<button
												onClick={handleShare}
												className="flex items-center w-full gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
											>
												<Share2 className="w-4 h-4" />
												Share
											</button>
											
											{isAuthor && (
												<>
													<button
														onClick={() => {
															setIsEditing(true);
															setIsMenuOpen(false);
														}}
														className="flex items-center w-full gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
													>
														<MdEdit className="w-4 h-4" />
														Edit
													</button>
													<button
														onClick={handleDelete}
														className="flex items-center w-full gap-2 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
													>
														<MdDelete className="w-4 h-4" />
														Delete
													</button>
												</>
											)}
										</motion.div>
									)}
								</AnimatePresence>
							</div>
						)}
					</div>
				</div>

				{isEditing ? (
					<div className="flex flex-col gap-2">
						<div className="relative">
							<textarea
								value={editContent}
								onChange={(e) => setEditContent(e.target.value)}
								className="w-full p-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 outline-none resize-none min-h-[100px]"
								autoFocus
							/>
							<div className={`absolute bottom-2 right-2 text-[10px] font-mono ${(140 - editContent.length) < 0 ? 'text-red-500' : 'text-gray-400'}`}>
								{140 - editContent.length}
							</div>
						</div>
						<div className="flex justify-end gap-2">
							<button
								onClick={() => {
									setIsEditing(false);
									setEditContent(post.content);
								}}
								className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
							>
								<MdClose className="w-5 h-5" />
							</button>
							<button
								onClick={handleUpdate}
								disabled={isPending || editContent.length > 140 || !editContent.trim()}
								className="p-2 bg-blue-600 text-white hover:bg-blue-700 rounded-full transition-colors disabled:opacity-50"
							>
								<MdCheck className="w-5 h-5" />
							</button>
						</div>
					</div>
				) : (
					<div className="text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-wrap break-words">
						<Linkify options={linkifyOptions}>
							{post.content}
						</Linkify>
					</div>
				)}

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

					<button
						onClick={handleReaction}
						disabled={isPending}
						className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-all text-sm font-medium ${
							hasReacted 
								? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 ring-1 ring-purple-200 dark:ring-purple-800' 
								: 'bg-gray-50 text-gray-600 dark:bg-gray-800 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
						} ${isPending ? 'opacity-50 cursor-not-allowed' : ''}`}
						title="Invote!"
					>
						<span className={hasReacted ? 'animate-pulse' : ''}>👾</span>
						{reactionsCount > 0 && <span>{reactionsCount}</span>}
					</button>
				</div>
			</div>
		</div>
	);
}

'use client';

import React, { useState, useTransition, useRef, useEffect } from 'react';
import type { MicroblogPostSerializable } from '@/lib/db';
import Image from 'next/image';
import { FormattedDate } from './FormattedDate';
import { useSession } from 'next-auth/react';
import { toggleReactionAction, updatePostAction, deletePostAction } from '@/lib/actions/microblog';
import { MdEdit, MdDelete, MdCheck, MdClose, MdMoreVert, MdLink, MdOutlineWeb, MdArrowDownward } from 'react-icons/md';
import { Share2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from '@/lib/toast';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';

import Linkify from 'linkify-react';
import LinkPreview from './LinkPreview';

interface MicroblogPostCardProps {
	post: MicroblogPostSerializable;
	locale: string;
	onMenuToggle?: (isOpen: boolean) => void;
	isIndividualPage?: boolean;
}

const linkifyOptions = {
	className: 'text-blue-600 dark:text-blue-400 hover:underline',
	target: '_blank',
	rel: 'noopener noreferrer'
};

export default function MicroblogPostCard({ post, locale, onMenuToggle, isIndividualPage }: MicroblogPostCardProps) {
	const t = useTranslations('microblog');
	const { data: session } = useSession();
	const [isPending, startTransition] = useTransition();
	const [isEditing, setIsEditing] = useState(false);
	const [editContent, setEditContent] = useState(post.content);
	const [editIsThread, setEditIsThread] = useState(post.is_thread);
	const [editShowPreview, setEditShowPreview] = useState(post.show_link_preview);
	const [isMenuOpen, setIsMenuOpen] = useState(false);
	const menuRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		onMenuToggle?.(isMenuOpen);
	}, [isMenuOpen, onMenuToggle]);
	
	const user = session?.user as { id?: string; username?: string; name?: string | null; email?: string | null } | undefined;
	const username = user?.username || user?.name || null;
	const hasReacted = post.reactions?.some(r => r.username === username);
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
		if (editContent === post.content && editIsThread === post.is_thread && editShowPreview === post.show_link_preview) {
			setIsEditing(false);
			return;
		}

		startTransition(async () => {
			try {
				const result = await updatePostAction(post.id, editContent, editIsThread, editShowPreview);
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
		const url = post.hash 
			? `${window.location.origin}/${locale}/microblog/${post.hash}`
			: `${window.location.origin}/${locale}/microblog/${post.id - 1}`;
		
		const title = post.hash
			? `Valerio Iacobucci - Microblog Post`
			: `Valerio Iacobucci - Microblog Post #${post.id - 1}`;
		
		if (navigator.share) {
			navigator.share({
				title: title,
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

	// URL extraction for LinkPreview
	const urlRegex = /(https?:\/\/[^\s]+)/g;
	const firstUrl = post.content.match(urlRegex)?.[0];

	return (
		<div className="relative group/card">
			{post.is_thread && (
				<>
					<div className={`absolute ${isIndividualPage ? '-bottom-16' : '-bottom-8'} left-9 w-4 ${isIndividualPage ? 'h-16' : 'h-8'} overflow-visible pointer-events-none opacity-40 dark:opacity-20 group-hover/card:opacity-100 transition-opacity flex flex-col items-center`}>
						<svg width="16" height={isIndividualPage ? 64 : 32} viewBox={isIndividualPage ? "0 0 16 64" : "0 0 16 32"} fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full text-gray-400 dark:text-gray-500 group-hover/card:text-blue-500 transition-colors">
							<path 
								d={isIndividualPage 
									? "M8 0C8 4 14 4 14 8C14 12 2 12 2 16C2 20 14 20 14 24C14 28 8 28 8 32C8 36 14 36 14 40C14 44 2 44 2 48C2 52 14 52 14 56C14 60 8 60 8 64"
									: "M8 0C8 4 14 4 14 8C14 12 2 12 2 16C2 20 14 20 14 24C14 28 8 28 8 32"} 
								stroke="currentColor" 
								strokeWidth="2" 
								strokeLinecap="round"
							/>
						</svg>
					</div>

					{isIndividualPage && (
						<div className="absolute -bottom-16 left-9 w-4 h-16 flex flex-col items-center justify-end pointer-events-none">
							<Link
								href={`/microblog/${post.id - 2}`}
								className="pointer-events-auto flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-full shadow-sm hover:shadow-md hover:border-blue-500/50 transition-all text-xs font-bold text-gray-500 hover:text-blue-600 whitespace-nowrap group/btn z-20"
							>
								{t('go_to_next')}
								<MdArrowDownward className="w-4 h-4 group-hover/btn:translate-y-0.5 transition-transform" />
							</Link>
						</div>
					)}
				</>
			)}
			<div 
				id={`post-${post.id - 1}`}
				suppressHydrationWarning
				className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 shadow-sm hover:shadow-md transition-all text-left group scroll-mt-24 relative"
			>
			<div className="flex flex-col gap-4">
				<div className="flex justify-between items-start text-xs text-gray-500 dark:text-gray-400">
					<div className="flex items-center gap-2">
						<div className="font-mono opacity-50">#{post.id - 1}</div>
						{post.is_thread && (
							<div className="flex items-center gap-1 text-gray-400 dark:text-gray-500 font-medium">
								<MdLink className="w-3 h-3 rotate-45" />
								<span>Thread</span>
							</div>
						)}
					</div>
					<div className="flex items-center gap-3">
						<FormattedDate date={post.created_at} locale={locale} />
						
						{!isEditing && (
							<div 
								className="relative" 
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
											className="absolute right-0 mt-1 w-36 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-100 dark:border-gray-700 py-1.5 z-50 overflow-hidden"
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
														onClick={() => {
															const newThreadState = !post.is_thread;
															startTransition(async () => {
																try {
																	await updatePostAction(post.id, post.content, newThreadState);
																	toast.success(newThreadState ? 'Post threaded!' : 'Post unthreaded!');
																} catch (error) {
																	console.error('Failed to update thread status:', error);
																	toast.error('Failed to update thread status');
																}
															});
															setIsMenuOpen(false);
														}}
														className="flex items-center w-full gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
													>
														<MdLink className={`w-4 h-4 ${post.is_thread ? 'rotate-45 text-blue-500' : ''}`} />
														{post.is_thread ? 'Unthread' : 'Thread'}
													</button>
													<button
														onClick={() => {
															const newShowPreview = !post.show_link_preview;
															startTransition(async () => {
																try {
																	await updatePostAction(post.id, post.content, post.is_thread, newShowPreview);
																	toast.success(newShowPreview ? 'Preview enabled!' : 'Preview disabled!');
																} catch (error) {
																	console.error('Failed to update preview status:', error);
																	toast.error('Failed to update preview status');
																}
															});
															setIsMenuOpen(false);
														}}
														className="flex items-center w-full gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
													>
														<MdOutlineWeb className={`w-4 h-4 ${post.show_link_preview ? 'text-blue-500' : ''}`} />
														{post.show_link_preview ? 'Hide Preview' : 'Show Preview'}
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
								autoCapitalize="none"
								autoCorrect="off"
								spellCheck="true"
								className="w-full p-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 outline-none resize-none min-h-[100px]"
								autoFocus
							/>
							<div className={`absolute bottom-2 right-2 text-[10px] font-mono ${(140 - editContent.length) < 0 ? 'text-red-500' : 'text-gray-400'}`}>
								{140 - editContent.length}
							</div>
						</div>
						<div className="flex justify-between items-center">
							<button
								type="button"
								onClick={() => setEditIsThread(!editIsThread)}
								className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all text-sm font-medium ${editIsThread
									? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 ring-1 ring-blue-200 dark:ring-blue-800'
									: 'bg-gray-50 text-gray-600 dark:bg-gray-800 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
									}`}
								title={t('thread')}
							>
								<MdLink className={`w-4 h-4 ${editIsThread ? 'rotate-45' : ''}`} />
								<span className="hidden sm:inline">{t('thread')}</span>
							</button>
							<button
								type="button"
								onClick={() => setEditShowPreview(!editShowPreview)}
								className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all text-sm font-medium ${editShowPreview
									? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 ring-1 ring-blue-200 dark:ring-blue-800'
									: 'bg-gray-50 text-gray-600 dark:bg-gray-800 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
									}`}
								title={t('toggle_preview')}
							>
								<MdOutlineWeb className="w-4 h-4" />
								<span className="hidden sm:inline">{t('toggle_preview')}</span>
							</button>
							<div className="flex gap-2">
								<button
									onClick={() => {
										setIsEditing(false);
										setEditContent(post.content);
										setEditIsThread(post.is_thread);
										setEditShowPreview(post.show_link_preview);
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
					</div>
				) : (
					<div className="text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-wrap break-words">
						<Linkify options={linkifyOptions}>
							{post.content}
						</Linkify>
						{firstUrl && post.show_link_preview && <LinkPreview url={firstUrl} />}
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
	</div>
	);
}

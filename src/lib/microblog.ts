import { AppDataSource, getDataSource, MicroblogPostSerializable } from './db';
import { MicroblogPost, MicroblogReaction } from './entities/microblog';
import { createHash } from 'crypto';

function generateHash(content: string, timestamp: string | number | Date): string {
  return createHash('sha256')
    .update(`${content}-${timestamp}-${Math.random()}`)
    .digest('hex')
    .substring(0, 12);
}

export async function getMicroblogPosts(limit = 20, offset = 0): Promise<MicroblogPostSerializable[]> {
  await getDataSource();
  const repository = AppDataSource.getRepository(MicroblogPost);
  
  const posts = await repository.find({
    order: {
      created_at: 'DESC'
    },
    take: limit,
    skip: offset,
    relations: ['reactions']
  });
  
  // Convert binary image_data (Buffer) to Base64 string to be serializable
  // And convert Date to ISO string
  return posts.map(post => ({
    id: post.id,
    content: post.content,
    image_data: post.image_data ? post.image_data.toString('base64') : null,
    created_at: post.created_at.toISOString(),
    is_thread: post.is_thread,
    hash: post.hash || null,
    show_link_preview: post.show_link_preview,
    reactions: post.reactions?.map(r => ({
      id: r.id,
      userId: r.userId,
      username: r.username,
      userImage: r.userImage || null,
      emoji: r.emoji
    }))
  }));
}

export async function addMicroblogPost(content: string, imageData?: Buffer | null, isThread: boolean = false, showLinkPreview: boolean = true): Promise<number> {
  await getDataSource();
  const repository = AppDataSource.getRepository(MicroblogPost);
  
  // Trova l'ID più alto per garantire una sequenza senza buchi
  const lastPost = await repository.findOne({
    where: {},
    order: { id: 'DESC' }
  });
  
  const nextId = lastPost ? lastPost.id + 1 : 1;
  
  const post = new MicroblogPost();
  post.id = nextId;
  post.content = content;
  post.image_data = imageData || null;
  post.is_thread = isThread;
  post.hash = generateHash(content, new Date());
  post.show_link_preview = showLinkPreview;
  
  const savedPost = await repository.save(post);
  return savedPost.id;
}

export async function getMicroblogPost(id: number): Promise<MicroblogPostSerializable | null> {
  await getDataSource();
  const repository = AppDataSource.getRepository(MicroblogPost);
  
  const post = await repository.findOne({
    where: { id },
    relations: ['reactions']
  });
  
  if (!post) return null;
  
  return {
    id: post.id,
    content: post.content,
    image_data: post.image_data ? post.image_data.toString('base64') : null,
    created_at: post.created_at.toISOString(),
    is_thread: post.is_thread,
    hash: post.hash || null,
    show_link_preview: post.show_link_preview,
    reactions: post.reactions?.map(r => ({
      id: r.id,
      userId: r.userId,
      username: r.username,
      userImage: r.userImage || null,
      emoji: r.emoji
    }))
  };
}

export async function getMicroblogPostByHash(hash: string): Promise<MicroblogPostSerializable | null> {
  await getDataSource();
  const repository = AppDataSource.getRepository(MicroblogPost);
  
  const post = await repository.findOne({
    where: { hash },
    relations: ['reactions']
  });
  
  if (!post) return null;
  
  return {
    id: post.id,
    content: post.content,
    image_data: post.image_data ? post.image_data.toString('base64') : null,
    created_at: post.created_at.toISOString(),
    is_thread: post.is_thread,
    hash: post.hash || null,
    show_link_preview: post.show_link_preview,
    reactions: post.reactions?.map(r => ({
      id: r.id,
      userId: r.userId,
      username: r.username,
      userImage: r.userImage || null,
      emoji: r.emoji
    }))
  };
}

export async function toggleMicroblogReaction(postId: number, userId: string, username: string, userImage?: string): Promise<void> {
  await getDataSource();
  const reactionRepository = AppDataSource.getRepository(MicroblogReaction);
  const postRepository = AppDataSource.getRepository(MicroblogPost);

  // Find existing reactions by userId on this post
  const existingReactions = await reactionRepository.find({
    where: {
      post: { id: postId },
      userId: userId
    }
  });

  if (existingReactions.length > 0) {
    // Remove all existing reactions from this userId
    await reactionRepository.remove(existingReactions);
  } else {
    const post = await postRepository.findOneBy({ id: postId });
    if (!post) throw new Error('Post not found');

    const reaction = new MicroblogReaction();
    reaction.post = post;
    reaction.userId = userId;
    reaction.username = username;
    reaction.userImage = userImage;
    reaction.emoji = '👾';

    await reactionRepository.save(reaction);
  }
}

export async function deleteMicroblogPost(id: number): Promise<void> {
  await getDataSource();
  const repository = AppDataSource.getRepository(MicroblogPost);
  await repository.delete(id);
}

export async function updateMicroblogPost(id: number, content: string, isThread?: boolean, showLinkPreview?: boolean): Promise<void> {
  await getDataSource();
  const repository = AppDataSource.getRepository(MicroblogPost);
  const updateData: Partial<MicroblogPost> = { content };
  if (isThread !== undefined) {
    updateData.is_thread = isThread;
  }
  if (showLinkPreview !== undefined) {
    updateData.show_link_preview = showLinkPreview;
  }
  await repository.update(id, updateData);
}

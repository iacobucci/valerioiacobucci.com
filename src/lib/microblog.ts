import { AppDataSource, getDataSource, MicroblogPostSerializable } from './db';
import { MicroblogPost, MicroblogReaction } from './entities/microblog';

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
    reactions: post.reactions?.map(r => ({
      id: r.id,
      userId: r.userId,
      username: r.username,
      userImage: r.userImage || null,
      emoji: r.emoji
    }))
  }));
}

export async function addMicroblogPost(content: string, imageData?: Buffer | null): Promise<number> {
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

  // Find existing reactions by username on this post
  const existingReactions = await reactionRepository.find({
    where: {
      post: { id: postId },
      username: username
    }
  });

  if (existingReactions.length > 0) {
    // Remove all existing reactions from this username to clean up duplicates if any
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

export async function updateMicroblogPost(id: number, content: string): Promise<void> {
  await getDataSource();
  const repository = AppDataSource.getRepository(MicroblogPost);
  await repository.update(id, { content });
}

import { AppDataSource, getDataSource, MicroblogPostSerializable } from './db';
import { MicroblogPost } from './entities/MicroblogPost';
import { MicroblogReaction } from './entities/MicroblogReaction';

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
  
  const post = new MicroblogPost();
  post.content = content;
  post.image_data = imageData || null;
  
  const savedPost = await repository.save(post);
  return savedPost.id;
}

export async function toggleMicroblogReaction(postId: number, userId: string, username: string, userImage?: string): Promise<void> {
  await getDataSource();
  const reactionRepository = AppDataSource.getRepository(MicroblogReaction);
  const postRepository = AppDataSource.getRepository(MicroblogPost);

  const existingReaction = await reactionRepository.findOne({
    where: {
      post: { id: postId },
      userId: userId
    }
  });

  if (existingReaction) {
    await reactionRepository.remove(existingReaction);
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

import { AppDataSource, getDataSource, MicroblogPostSerializable } from './db';
import { MicroblogPost } from './entities/MicroblogPost';

export async function getMicroblogPosts(limit = 20, offset = 0): Promise<MicroblogPostSerializable[]> {
  await getDataSource();
  const repository = AppDataSource.getRepository(MicroblogPost);
  
  const posts = await repository.find({
    order: {
      created_at: 'DESC'
    },
    take: limit,
    skip: offset
  });
  
  // Convert binary image_data (Buffer) to Base64 string to be serializable
  // And convert Date to ISO string
  return posts.map(post => ({
    id: post.id,
    content: post.content,
    image_data: post.image_data ? post.image_data.toString('base64') : null,
    created_at: post.created_at.toISOString()
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

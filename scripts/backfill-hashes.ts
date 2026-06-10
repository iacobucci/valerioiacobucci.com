import { AppDataSource, getDataSource } from '../src/lib/db';
import { MicroblogPost } from '../src/lib/entities/microblog';
import { createHash } from 'crypto';
import { IsNull } from 'typeorm';

function generateHash(content: string, timestamp: string | number | Date): string {
  return createHash('sha256')
    .update(`${content}-${timestamp}-${Math.random()}`)
    .digest('hex')
    .substring(0, 12);
}

async function backfillHashes() {
  await getDataSource();
  const repository = AppDataSource.getRepository(MicroblogPost);
  
  const postsWithoutHash = await repository.find({
    where: { hash: IsNull() }
  });
  
  console.log(`Found ${postsWithoutHash.length} posts without hash.`);
  
  for (const post of postsWithoutHash) {
    post.hash = generateHash(post.content, post.created_at);
    await repository.save(post);
    console.log(`Backfilled hash for post ID ${post.id}: ${post.hash}`);
  }
  
  console.log('Backfill complete.');
  process.exit(0);
}

backfillHashes().catch(err => {
  console.error(err);
  process.exit(1);
});

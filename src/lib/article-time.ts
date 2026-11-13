import { AppDataSource, getDataSource } from './db';
import { ArticleWritingTime } from './entities/article-time';

export async function getArticleWritingTime(slug: string): Promise<number> {
  try {
    await getDataSource();
    const repo = AppDataSource.getRepository(ArticleWritingTime);
    const record = await repo.findOne({ where: { slug } });
    return record?.seconds_spent || 0;
  } catch (error) {
    console.error('Failed to get article writing time:', error);
    return 0;
  }
}

export async function recordArticleWritingHeartbeat(slug: string, activeSeconds: number): Promise<number> {
  try {
    await getDataSource();
    const repo = AppDataSource.getRepository(ArticleWritingTime);
    const cleanSeconds = Math.max(1, Math.min(60, Math.round(activeSeconds)));

    let record = await repo.findOne({ where: { slug } });
    if (!record) {
      record = new ArticleWritingTime();
      record.slug = slug;
      record.seconds_spent = cleanSeconds;
      record.last_active_at = new Date();
      await repo.save(record);
      return record.seconds_spent;
    } else {
      record.seconds_spent += cleanSeconds;
      record.last_active_at = new Date();
      await repo.save(record);
      return record.seconds_spent;
    }
  } catch (error) {
    console.error('Failed to record article writing heartbeat:', error);
    return 0;
  }
}

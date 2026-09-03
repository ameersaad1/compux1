import Redis from 'ioredis';
import { PrismaClient } from '@prisma/client';

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
const prisma = new PrismaClient();

export class CounterService {
  /**
   * زيادة عداد التفاعل فورياً في Redis
   */
  static async incrementPostLike(postId: string, userId: string): Promise<void> {
    const likeKey = `post:${postId}:likes_count`;
    const dirtyPostsKey = `dirty_posts:likes`;

    const pipeline = redis.pipeline();
    pipeline.incr(likeKey);
    pipeline.sadd(dirtyPostsKey, postId);
    await pipeline.exec();
  }

  /**
   * مزامنة العدادات من Redis إلى PostgreSQL دفعة واحدة (Write-Behind Pattern)
   */
  static async syncCountersToDatabase(): Promise<void> {
    const dirtyPostsKey = `dirty_posts:likes`;

    const postIds = await redis.smembers(dirtyPostsKey);
    if (!postIds || postIds.length === 0) return;

    for (const postId of postIds) {
      try {
        const countStr = await redis.get(`post:${postId}:likes_count`);
        if (countStr !== null) {
          const count = parseInt(countStr, 10);
          if (!isNaN(count)) {
            await prisma.post.update({
              where: { id: postId },
              data: { likesCount: count },
            });
          }
        }
        await redis.srem(dirtyPostsKey, postId);
      } catch (error) {
        console.error(`خطأ أثناء مزامنة العداد للمنشور ${postId}:`, error);
      }
    }
  }
}

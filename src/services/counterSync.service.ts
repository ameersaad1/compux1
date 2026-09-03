import Redis from 'ioredis';
import { PrismaClient } from '@prisma/client';

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
const prisma = new PrismaClient();

export class CounterService {
  /**
   * زيادة عداد التفاعل فورياً في Redis
   */
  static async incrementPostLike(postId: string, userId: string) {
    const likeKey = `post:${postId}:likes_count`;
    const dirtyPostsKey = `dirty_posts:likes`;

    // عملية ذرية (Atomic Transaction) في Redis
    const pipeline = redis.pipeline();
    pipeline.incr(likeKey);
    pipeline.sadd(dirtyPostsKey, postId);
    await pipeline.exec();
  }

  /**
   * مزامنة العدادات من Redis إلى PostgreSQL دفعة واحدة (Write-Behind Pattern)
   * يتم تشغيل هذه المزامنة عبر Job مبرمج (Cron / BullMQ) كل دقيقة
   */
  static async syncCountersToDatabase() {
    const dirtyPostsKey = `dirty_posts:likes`;
    
    // سحب كل المنشورات التي تغيرت عداداتها
    const postIds = await redis.smembers(dirtyPostsKey);
    if (!postIds || postIds.length === 0) return;

    for (const postId of postIds) {
      const countStr = await redis.get(`post:${postId}:likes_count`);
      if (countStr !== null) {
        const count = parseInt(countStr, 10);

        // تحديث التغييرات في PostgreSQL
        await prisma.post.update({
          where: { id: postId },
          data: { likesCount: count },
        });
      }
    }

    // تنظيف قائمة البوستات المعالجة
    await redis.srem(dirtyPostsKey, ...postIds);
  }
}

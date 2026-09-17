/**
 * Local-development seed data only. Run explicitly with `pnpm run seed`.
 * This never runs automatically, is never bundled into the app, and every
 * account it creates uses a real bcrypt hash - there is no special-cased
 * "demo login" anywhere in the auth code path.
 */
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Refusing to run the seed script against a production environment.');
  }

  const passwordHash = await bcrypt.hash('DevPassword123', 12);

  const alice = await prisma.user.upsert({
    where: { email: 'alice@university.edu' },
    update: {},
    create: {
      email: 'alice@university.edu',
      username: 'alice_dev',
      fullName: 'Alice Johnson',
      passwordHash,
      universityName: 'State University',
      graduationYear: 2027,
      emailVerifiedAt: new Date(),
      bio: 'Computer Science student, seeded for local development.',
    },
  });

  const bob = await prisma.user.upsert({
    where: { email: 'bob@university.edu' },
    update: {},
    create: {
      email: 'bob@university.edu',
      username: 'bob_dev',
      fullName: 'Bob Martinez',
      passwordHash,
      universityName: 'State University',
      graduationYear: 2026,
      emailVerifiedAt: new Date(),
    },
  });

  await prisma.follower.upsert({
    where: { followerId_followingId: { followerId: alice.id, followingId: bob.id } },
    update: {},
    create: { followerId: alice.id, followingId: bob.id, status: 'ACCEPTED' },
  });

  await prisma.post.create({
    data: {
      authorId: bob.id,
      content: 'مرحباً بالجميع في Compux! 🎓 هذا منشور تجريبي لبيئة التطوير المحلية.',
      hashtags: ['compux'],
    },
  });

  console.log('✅ Seed complete. Dev accounts (local only):');
  console.log('   alice@university.edu / DevPassword123');
  console.log('   bob@university.edu   / DevPassword123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

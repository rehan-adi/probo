import { prisma } from '@probo/database';

async function main() {
    await prisma.user.updateMany({
        where: { name: 'Rehan' },
        data: { role: 'ADMIN' }
    });
    console.log('Made Rehan ADMIN');
}

main().catch(console.error).finally(() => prisma.$disconnect());

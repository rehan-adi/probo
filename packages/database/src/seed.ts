import { prisma } from './index';

async function seedDB() {
	const data = [
		{ id: '11111111-1111-1111-1111-111111111111', categoryName: 'Cricket' },
		{ id: '22222222-2222-2222-2222-222222222222', categoryName: 'Politics' },
		{ id: '33333333-3333-3333-3333-333333333333', categoryName: 'Crypto' },
		{ id: '44444444-4444-4444-4444-444444444444', categoryName: 'Tech' },
		{ id: '55555555-5555-5555-5555-555555555555', categoryName: 'Current Affairs' },
		{ id: '66666666-6666-6666-6666-666666666666', categoryName: 'Football' },
		{ id: '77777777-7777-7777-7777-777777777777', categoryName: 'Youtube' },
		{ id: '88888888-8888-8888-8888-888888888888', categoryName: 'Motorsports' },
		{ id: '99999999-9999-9999-9999-999999999999', categoryName: 'Stock' },
		{ id: 'aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaaa', categoryName: 'Gaming' },
		{ id: 'aaaaaaa2-aaaa-aaaa-aaaa-aaaaaaaaaaaa', categoryName: 'Basketball' },
		{ id: 'aaaaaaa3-aaaa-aaaa-aaaa-aaaaaaaaaaaa', categoryName: 'Chess' },
		{ id: 'aaaaaaa4-aaaa-aaaa-aaaa-aaaaaaaaaaaa', categoryName: 'Tennis' },
		{ id: 'aaaaaaa5-aaaa-aaaa-aaaa-aaaaaaaaaaaa', categoryName: 'Probo' },
	];

	for (const item of data) {
		await prisma.category.upsert({
			where: { id: item.id },
			update: {},
			create: item,
		});
	}

	console.log('✅ Categories seeded with fixed UUIDs');
}

seedDB().then(() => process.exit(0));

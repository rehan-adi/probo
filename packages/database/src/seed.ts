import { prisma } from './index';

async function seedDB() {
	const data = [
		{ id: '11111111-1111-1111-1111-111111111111', categoryName: 'Politics' },
		{ id: '22222222-2222-2222-2222-222222222222', categoryName: 'Crypto' },
		{ id: '33333333-3333-3333-3333-333333333333', categoryName: 'Sports' },
		{ id: '44444444-4444-4444-4444-444444444444', categoryName: 'Esports' },
		{ id: '55555555-5555-5555-5555-555555555555', categoryName: 'Tech' },
		{ id: '66666666-6666-6666-6666-666666666666', categoryName: 'Geopolitics' },
		{ id: '77777777-7777-7777-7777-777777777777', categoryName: 'Economy' },
		{ id: '88888888-8888-8888-8888-888888888888', categoryName: 'Weather' },
		{ id: '99999999-9999-9999-9999-999999999999', categoryName: 'YouTube' },
		{ id: 'aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaaa', categoryName: 'Pop Culture' },
		{ id: 'aaaaaaa2-aaaa-aaaa-aaaa-aaaaaaaaaaaa', categoryName: 'Finance' },
		{ id: 'aaaaaaa3-aaaa-aaaa-aaaa-aaaaaaaaaaaa', categoryName: 'Current Affairs' },
		{ id: 'aaaaaaa4-aaaa-aaaa-aaaa-aaaaaaaaaaaa', categoryName: 'Science' },
		{ id: 'aaaaaaa5-aaaa-aaaa-aaaa-aaaaaaaaaaaa', categoryName: 'Entertainment' },
		{ id: 'aaaaaaa6-aaaa-aaaa-aaaa-aaaaaaaaaaaa', categoryName: 'Startups' },
		{ id: 'aaaaaaa7-aaaa-aaaa-aaaa-aaaaaaaaaaaa', categoryName: 'Gaming' },
	];

	for (const item of data) {
		await prisma.category.upsert({
			where: { id: item.id },
			update: {},
			create: item,
		});
	}

	console.log('✅ Categories seeded successfully');
}

seedDB().then(() => process.exit(0));

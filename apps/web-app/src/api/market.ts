import { api } from '@/lib/axios';

export const createMarket = (form: {
	title: string;
	description: string;
	startTime: string;
	endTime: string;
	sourceOfTruth: string;
	categoryId: string;
	thumbnail: string | null;
}) => {
	return api.post('/market/create', form);
};

import { api } from '@/lib/axios';

export const createMarket = (form: {
	title: string;
	eos: string;
	rules: string;
	startTime: string;
	endTime: string;
	sourceOfTruth: string;
	categoryId: string;
	thumbnail: string | null;
}) => {
	return api.post('/market/create', form);
};

export const getMarketDetails = (symbol: string) => {
	return api.get(`/markets/${symbol}`);
};

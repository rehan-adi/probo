import { createMarket } from '@/api/market';
import { useMutation } from '@tanstack/react-query';

type CreateEventPayload = {
	title: string;
	description: string;
	startTime: string;
	endTime: string;
	sourceOfTruth: string;
	categoryId: string;
	thumbnail: string | null;
};

export const useCreateEventMutation = () => {
	return useMutation({
		mutationKey: ['event'],
		mutationFn: (payload: CreateEventPayload) => createMarket(payload),
	});
};

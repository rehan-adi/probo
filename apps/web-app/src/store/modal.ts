import { create } from 'zustand';

interface ModalState {
	onboardModalOpen: boolean;
	openOnboardModal: () => void;
	closeOnboardModal: () => void;
}

export const useModalStore = create<ModalState>((set) => ({
	onboardModalOpen: false,
	openOnboardModal: () => set({ onboardModalOpen: true }),
	closeOnboardModal: () => set({ onboardModalOpen: false }),
}));

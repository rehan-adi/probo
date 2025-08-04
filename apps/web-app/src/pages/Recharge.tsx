import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useDepositMutation } from '@/hooks/mutations/balance';

export default function RechargePage() {
	const [amount, setAmount] = useState<number | null>(null);

	const { mutate, isPending } = useDepositMutation();

	const handleQuickSelect = (value: number) => {
		setAmount(value);
	};

	const handleSubmit = () => {
		if (!amount || amount <= 0) {
			alert('Please enter a valid amount greater than 0');
			return;
		}
		mutate(amount.toString(), {
			onSuccess: () => {
				setAmount(null);
			},
		});
	};

	return (
		<div className="w-full flex justify-center items-center bg-[#f4f4f5] md:py-24 py-20">
			<div className="max-w-[910px] w-full px-4">
				<h1 className="text-4xl font-semibold md:mb-8 mb-4">Deposit</h1>

				<div className="bg-white max-w-[550px] rounded-xl py-6 px-4 space-y-6">
					<div className="space-y-2">
						<div className="text-base font-semibold">Deposit amount</div>
						<input
							type="number"
							placeholder="0"
							value={amount ?? ''}
							disabled={isPending}
							onChange={(e) => setAmount(parseFloat(e.target.value))}
							className="w-full border rounded-lg px-4 py-2 focus:outline-none border-blue-600 text-black text-2xl placeholder:text-2xl disabled:opacity-60"
						/>
					</div>

					<div className="flex gap-2">
						{[250, 500, 1000].map((preset) => (
							<button
								key={preset}
								type="button"
								disabled={isPending}
								onClick={() => handleQuickSelect(preset)}
								className="bg-white text-black border border-gray-400/20 px-4 py-2 text-sm font-semibold rounded-[10px] transition disabled:opacity-60"
							>
								+{preset}
							</button>
						))}
					</div>

					<div>
						<button
							onClick={handleSubmit}
							disabled={!amount || amount <= 0 || isPending}
							className={`w-full py-3 rounded-xl text-sm font-semibold transition flex items-center justify-center ${
								!amount || amount <= 0 || isPending
									? 'bg-[#ABABAB] text-white cursor-not-allowed'
									: 'bg-[#262626] cursor-pointer text-white'
							}`}
						>
							{isPending ? (
								<>
									<Loader2 className="animate-spin w-5 h-5" />
								</>
							) : (
								'Recharge'
							)}
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}

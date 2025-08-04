import { useState } from 'react';
import { ChevronRight, Loader2 } from 'lucide-react';
import { useGetTransactionHistoryQuery } from '@/hooks/queries/transaction';

const tabs = ['All', 'Deposit', 'Withdraw'];

export default function TransactionHistoryPage() {
	const [selectedTab, setSelectedTab] = useState('All');

	const { data, isLoading, isError } = useGetTransactionHistoryQuery();

	const transactions = data?.data.data || [];

	const filteredTransactions = transactions.filter((t: any) => {
		if (selectedTab === 'All') return true;
		const isDeposit = parseFloat(t.amount) > 0;
		return selectedTab === 'Deposit' ? isDeposit : !isDeposit;
	});

	if (isLoading) {
		return (
			<div className="min-h-screen flex bg-[#f4f4f5] items-center justify-center">
				<p className="text-gray-600">
					<Loader2 className="animate-spin w-6 h-6" />
				</p>
			</div>
		);
	}

	if (isError) {
		return (
			<div className="min-h-screen flex bg-[#f4f4f5] items-center justify-center">
				<p className="text-red-600">Failed to load transaction history.</p>
			</div>
		);
	}

	return (
		<div className="w-full min-h-screen bg-[#f4f4f5] py-20 flex justify-center">
			<div className="w-full max-w-4xl px-4">
				{/* Breadcrumb */}
				<nav className="text-base mt-4 mb-8">
					<ol className="list-reset flex items-center text-[#757575] space-x-0.5">
						<li>
							<a href="/" className="hover:underline">
								Home
							</a>
						</li>
						<ChevronRight size={20} />
						<li>
							<a href="/wallet" className="hover:underline">
								Wallet
							</a>
						</li>
						<ChevronRight size={20} />
						<li className="text-[#262626]">Transaction History</li>
					</ol>
				</nav>

				<h2 className="text-xl font-semibold mb-4">Transaction History</h2>

				<div className="flex items-center border-b border-t border-gray-400/25 py-3 justify-between flex-wrap">
					<div className="flex items-center space-x-2 mt-4 md:mt-0">
						{tabs.map((tab) => (
							<button
								key={tab}
								onClick={() => setSelectedTab(tab)}
								className={`px-4 py-1 rounded-sm text-base ${
									selectedTab === tab
										? 'bg-[#262626] text-white'
										: 'bg-white border border-gray-400/20 text-gray-800'
								}`}
							>
								{tab}
							</button>
						))}
					</div>
				</div>

				{/* Transactions Section */}
				<div className="space-y-4">
					{/* Header */}
					<div className="flex justify-between text-xs font-semibold text-black py-5 border-b border-gray-400/25">
						<p className="md:w-[60%] w-[40%] text-sm font-semibold">Transactions</p>
						<div className="md:w-[40%] w-[70%] flex justify-between md:gap-10 gap-0">
							<p className="text-sm text-start font-semibold">Order ID</p>
							<p className="text-sm text-center font-semibold">Status</p>
							<p className="text-sm font-semibold text-end">Amount</p>
						</div>
					</div>

					{filteredTransactions.map((txn: any) => (
						<div key={txn.id} className="pb-4 border-b border-gray-400/25">
							<div className="flex justify-between items-start">
								<div className="md:w-2/3 w-1/3 overflow-hidden flex flex-col gap-3">
									<p className="text-sm font-medium text-black">{txn.type}</p>
									<p className="text-sm text-[#545454]">{txn.remarks}</p>
									<p className="text-xs text-[#545454] mt-1">
										{txn.createdAt
											? new Date(txn.createdAt).toLocaleString('en-US', {
													month: 'long',
													day: 'numeric',
													year: 'numeric',
													hour: 'numeric',
													minute: 'numeric',
													hour12: true,
												})
											: 'Invalid Date'}
									</p>
								</div>

								<p className="w-1/4 text-center text-sm text-[#262626] mt-0 md:mt-1 break-all">
									{txn.id.slice(0, 8).toUpperCase()}
								</p>

								<p className="w-1/6 text-center text-sm md:font-semibold font-medium text-[#05945B] md:mt-1 mt-0">
									{txn.status}
								</p>

								<p
									className={`w-1/6 text-right md:text-base text-sm font-semibold md:mt-1 mt-0 ${
										txn.amount > 0 ? 'text-green-600' : 'text-red-600'
									}`}
								>
									{txn.amount > 0 ? `+₹${txn.amount}` : `-₹${Math.abs(txn.amount)}`}
								</p>
							</div>
						</div>
					))}

					{filteredTransactions.length === 0 && (
						<p className="text-center text-gray-500 text-sm mt-10">No transactions found.</p>
					)}
				</div>
			</div>
		</div>
	);
}

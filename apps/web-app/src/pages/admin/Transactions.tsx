import { useEffect, useState } from 'react';
import { adminApi } from '@/config/axios';
import { toast } from 'sonner';
import { Loader2, Search, ArrowUpRight, ArrowDownRight, WalletCards, CreditCard, Banknote } from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import {
	flexRender,
	getCoreRowModel,
	getFilteredRowModel,
	getPaginationRowModel,
	getSortedRowModel,
	useReactTable,
} from "@tanstack/react-table";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatINR, formatDate } from '@/lib/format';

export default function AdminTransactions() {
	const [transactions, setTransactions] = useState<any[]>([]);
	const [loading, setLoading] = useState(true);
	const [globalFilter, setGlobalFilter] = useState('');
	const [typeFilter, setTypeFilter] = useState('ALL');

	const fetchTransactions = async () => {
		try {
			const res = await adminApi.get(`/transactions`);
			if (res.data.success) {
				setTransactions(res.data.data);
			}
		} catch (err) {
			console.error('Failed to fetch transactions', err);
			toast.error('Failed to fetch transactions');
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchTransactions();
	}, []);

	const filteredTransactions = transactions.filter(t => 
		typeFilter === 'ALL' ? true : t.type === typeFilter
	);

	const getTransactionIcon = (type: string) => {
		switch (type) {
			case 'DEPOSIT': return <ArrowDownRight className="w-4 h-4" />;
			case 'WITHDRAWAL': return <ArrowUpRight className="w-4 h-4" />;
			case 'TRADE': return <Banknote className="w-4 h-4" />;
			case 'FEE': return <CreditCard className="w-4 h-4" />;
			default: return <WalletCards className="w-4 h-4" />;
		}
	};

	const columns = [
		{
			accessorKey: "id",
			header: "Transaction ID",
			cell: ({ row }: any) => {
				const id = row.getValue("id");
				return (
					<div className="font-mono text-xs text-gray-500 dark:text-gray-400">
						{id.substring(0, 12)}...
					</div>
				);
			},
		},
		{
			accessorKey: "user.email",
			header: "User",
			cell: ({ row }: any) => {
				const user = row.original.user;
				return (
					<div className="flex flex-col">
						<span className="font-medium text-gray-900 dark:text-white">{user?.username || 'System'}</span>
						<span className="text-xs text-gray-500 dark:text-gray-400">{user?.email || 'N/A'}</span>
					</div>
				);
			},
		},
		{
			accessorKey: "type",
			header: "Type",
			cell: ({ row }: any) => {
				const type = row.getValue("type");
				
				let badgeClass = "bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700";
				
				if (type === 'DEPOSIT') {
					badgeClass = "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20";
				} else if (type === 'WITHDRAWAL') {
					badgeClass = "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20";
				} else if (type === 'TRADE') {
					badgeClass = "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-500/10 dark:text-purple-400 dark:border-purple-500/20";
				} else if (type === 'FEE') {
					badgeClass = "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20";
				}
				
				return (
					<Badge variant="outline" className={`flex w-fit items-center gap-1 ${badgeClass}`}>
						{getTransactionIcon(type)}
						{type}
					</Badge>
				);
			},
		},
		{
			accessorKey: "amount",
			header: "Amount",
			cell: ({ row }: any) => {
				const amount = Number(row.getValue("amount"));
				const type = row.original.type;
				
				const isPositive = ['DEPOSIT', 'WINNINGS', 'REFUND'].includes(type);
				const isNegative = ['WITHDRAWAL', 'TRADE', 'FEE'].includes(type);
				
				return (
					<div className={`font-semibold ${
						isPositive ? 'text-emerald-600 dark:text-emerald-400' : 
						isNegative ? 'text-red-600 dark:text-red-400' : 
						'text-gray-900 dark:text-white'
					}`}>
						{isPositive ? '+' : isNegative ? '-' : ''}{formatINR(Math.abs(amount))}
					</div>
				);
			},
		},
		{
			accessorKey: "status",
			header: "Status",
			cell: ({ row }: any) => {
				const status = row.getValue("status");
				if (status === 'COMPLETED' || status === 'SUCCESS') {
					return <span className="flex items-center text-sm font-medium text-emerald-600 dark:text-emerald-400"><span className="w-2 h-2 rounded-full bg-emerald-500 mr-2"></span>Completed</span>;
				}
				if (status === 'PENDING') {
					return <span className="flex items-center text-sm font-medium text-amber-600 dark:text-amber-400"><span className="w-2 h-2 rounded-full bg-amber-500 mr-2 animate-pulse"></span>Pending</span>;
				}
				if (status === 'FAILED') {
					return <span className="flex items-center text-sm font-medium text-red-600 dark:text-red-400"><span className="w-2 h-2 rounded-full bg-red-500 mr-2"></span>Failed</span>;
				}
				return <span className="text-sm text-gray-500">{status}</span>;
			},
		},
		{
			accessorKey: "createdAt",
			header: "Date",
			cell: ({ row }: any) => (
				<div className="flex flex-col">
					<span className="text-sm text-gray-900 dark:text-white whitespace-nowrap">
						{formatDate(row.getValue("createdAt"))}
					</span>
				</div>
			),
		},
	];

	const table = useReactTable({
		data: filteredTransactions,
		columns,
		getCoreRowModel: getCoreRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		globalFilterFn: "includesString",
		state: {
			globalFilter,
		},
		onGlobalFilterChange: setGlobalFilter,
		initialState: {
			pagination: {
				pageSize: 15,
			},
		},
	});

	if (loading) {
		return (
			<AdminLayout>
				<div className="flex justify-center items-center h-[calc(100vh-100px)]">
					<Loader2 className="animate-spin w-8 h-8 text-blue-600 dark:text-blue-500" />
				</div>
			</AdminLayout>
		);
	}

	return (
		<AdminLayout>
			<div className="space-y-6">
				<div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
					<div>
						<h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Transactions</h2>
						<p className="text-gray-500 dark:text-gray-400 mt-2">View all financial activity across the platform.</p>
					</div>
				</div>

				<div className="flex flex-col sm:flex-row items-center justify-between gap-4">
					<Tabs value={typeFilter} onValueChange={setTypeFilter} className="w-full sm:w-auto">
						<TabsList className="bg-gray-100 dark:bg-[#1C1C1E] h-auto flex-wrap">
							<TabsTrigger value="ALL" className="py-2">All</TabsTrigger>
							<TabsTrigger value="DEPOSIT" className="py-2">Deposits</TabsTrigger>
							<TabsTrigger value="WITHDRAWAL" className="py-2">Withdrawals</TabsTrigger>
							<TabsTrigger value="TRADE" className="py-2">Trades</TabsTrigger>
							<TabsTrigger value="FEE" className="py-2">Fees</TabsTrigger>
						</TabsList>
					</Tabs>

					<div className="relative w-full sm:w-72">
						<Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500 dark:text-gray-400" />
						<Input
							placeholder="Search transactions..."
							value={globalFilter ?? ''}
							onChange={e => setGlobalFilter(e.target.value)}
							className="pl-9 bg-white dark:bg-[#1C1C1E] border-gray-200 dark:border-white/10 focus-visible:ring-blue-500"
						/>
					</div>
				</div>

				<div className="rounded-xl border bg-white dark:bg-[#1C1C1E] dark:border-white/10 shadow-sm overflow-hidden">
					<div className="overflow-x-auto">
						<Table>
							<TableHeader className="bg-gray-50 dark:bg-[#2C2C2E]">
								{table.getHeaderGroups().map((headerGroup) => (
									<TableRow key={headerGroup.id} className="border-gray-200 dark:border-white/10 hover:bg-transparent">
										{headerGroup.headers.map((header) => (
											<TableHead key={header.id} className="text-gray-600 dark:text-gray-400 font-medium whitespace-nowrap">
												{header.isPlaceholder
													? null
													: flexRender(
															header.column.columnDef.header,
															header.getContext()
													  )}
											</TableHead>
										))}
									</TableRow>
								))}
							</TableHeader>
							<TableBody>
								{table.getRowModel().rows?.length ? (
									table.getRowModel().rows.map((row) => (
										<TableRow
											key={row.id}
											data-state={row.getIsSelected() && "selected"}
											className="border-gray-100 dark:border-white/5 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
										>
											{row.getVisibleCells().map((cell) => (
												<TableCell key={cell.id} className="py-3 px-4">
													{flexRender(cell.column.columnDef.cell, cell.getContext())}
												</TableCell>
											))}
										</TableRow>
									))
								) : (
									<TableRow>
										<TableCell colSpan={columns.length} className="h-32 text-center">
											<div className="flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
												<WalletCards className="w-8 h-8 mb-2 opacity-20" />
												<p>No transactions found.</p>
											</div>
										</TableCell>
									</TableRow>
								)}
							</TableBody>
						</Table>
					</div>
				</div>
				
				<div className="flex items-center justify-between py-4">
					<div className="text-sm text-gray-500 dark:text-gray-400">
						Showing {table.getRowModel().rows.length} of {filteredTransactions.length} transactions
					</div>
					<div className="flex items-center space-x-2">
						<Button
							variant="outline"
							size="sm"
							onClick={() => table.previousPage()}
							disabled={!table.getCanPreviousPage()}
							className="border-gray-200 dark:border-white/10 dark:bg-transparent dark:text-white dark:hover:bg-white/10"
						>
							Previous
						</Button>
						<Button
							variant="outline"
							size="sm"
							onClick={() => table.nextPage()}
							disabled={!table.getCanNextPage()}
							className="border-gray-200 dark:border-white/10 dark:bg-transparent dark:text-white dark:hover:bg-white/10"
						>
							Next
						</Button>
					</div>
				</div>
			</div>
		</AdminLayout>
	);
}

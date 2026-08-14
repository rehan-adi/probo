import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Loader2, CheckCircle, XCircle, Search, User, CreditCard, Clock } from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import { getAllPendingVerifications, verify } from '@/api/verification';
import {
	flexRender,
	getCoreRowModel,
	getFilteredRowModel,
	getPaginationRowModel,
	getSortedRowModel,
	useReactTable,
} from '@tanstack/react-table';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatDate } from '@/lib/format';

export default function AdminVerifications() {
	const [verifications, setVerifications] = useState<any[]>([]);
	const [loading, setLoading] = useState(true);
	const [processingId, setProcessingId] = useState<string | null>(null);
	const [globalFilter, setGlobalFilter] = useState('');
	const [typeFilter, setTypeFilter] = useState('ALL');

	const fetchVerifications = async () => {
		try {
			const res = await getAllPendingVerifications();
			if (res.data.success) {
				// Normalize data structure for easier filtering
				const normalized = res.data.data.map((v: any) => ({
					...v,
					pendingType:
						v.kycs?.[0]?.status === 'PENDING'
							? 'KYC'
							: v.paymentMethods?.[0]?.status === 'PENDING'
								? 'PAYMENT'
								: 'UNKNOWN',
					submittedAt:
						v.kycs?.[0]?.submittedAt ||
						v.paymentMethods?.[0]?.submittedAt ||
						new Date().toISOString(),
				}));
				setVerifications(normalized);
			}
		} catch (err) {
			console.error('Failed to fetch verifications', err);
			toast.error('Failed to fetch verifications');
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchVerifications();
	}, []);

	const handleVerify = async (
		userId: string,
		type: 'KYC' | 'PAYMENT',
		action: 'APPROVE' | 'REJECT',
	) => {
		setProcessingId(userId);
		try {
			const status = action === 'APPROVE' ? 'VERIFIED' : 'REJECTED';
			const remark = action === 'APPROVE' ? 'Approved by admin' : 'Rejected by admin';

			const res = await verify(
				userId,
				type === 'KYC' ? status : undefined,
				type === 'PAYMENT' ? status : undefined,
				type === 'KYC' ? remark : undefined,
				type === 'PAYMENT' ? remark : undefined,
			);

			if (res.data.success) {
				toast.success(`${type} ${action.toLowerCase()}d successfully`);
				fetchVerifications();
			} else {
				toast.error(res.data.error || res.data.message || 'Failed to verify');
			}
		} catch (err: any) {
			toast.error(
				err.response?.data?.error ||
					err.response?.data?.message ||
					err.message ||
					'Error processing request',
			);
		} finally {
			setProcessingId(null);
		}
	};

	const filteredVerifications = verifications.filter((v) =>
		typeFilter === 'ALL' ? true : v.pendingType === typeFilter,
	);

	const columns = [
		{
			accessorKey: 'user.email',
			header: 'User Details',
			cell: ({ row }: any) => {
				const user = row.original;
				return (
					<div className="flex items-center gap-3">
						<div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-700 dark:text-blue-400 font-bold border border-blue-200 dark:border-blue-800">
							{user.phone?.charAt(0) || 'U'}
						</div>
						<div className="flex flex-col">
							<span className="font-medium text-gray-900 dark:text-white">
								{user.phone || 'N/A'}
							</span>
							<span className="text-xs text-gray-500 dark:text-gray-400">
								ID: {user.id.substring(0, 8)}...
							</span>
						</div>
					</div>
				);
			},
		},
		{
			accessorKey: 'type',
			header: 'Verification Type',
			cell: ({ row }: any) => {
				const v = row.original;
				const isKyc = v.pendingType === 'KYC';

				return (
					<div className="flex items-center gap-2">
						{isKyc ? (
							<Badge
								variant="outline"
								className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20"
							>
								<User className="w-3 h-3 mr-1" /> KYC
							</Badge>
						) : (
							<Badge
								variant="outline"
								className="bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-500/10 dark:text-purple-400 dark:border-purple-500/20"
							>
								<CreditCard className="w-3 h-3 mr-1" /> PAYMENT
							</Badge>
						)}
					</div>
				);
			},
		},
		{
			accessorKey: 'details',
			header: 'Submitted Data',
			cell: ({ row }: any) => {
				const v = row.original;
				const isKyc = v.pendingType === 'KYC';

				if (isKyc && v.kycs?.[0]) {
					const kyc = v.kycs[0];
					return (
						<div className="text-sm">
							<div className="text-gray-900 dark:text-white font-medium">{kyc.panName}</div>
							<div className="text-gray-500 dark:text-gray-400 text-xs mt-0.5">
								PAN: {kyc.panNumber}
							</div>
						</div>
					);
				} else if (!isKyc && v.paymentMethods?.[0]) {
					const pm = v.paymentMethods[0];
					return (
						<div className="text-sm">
							<div className="text-gray-900 dark:text-white font-medium">{pm.type}</div>
							<div className="text-gray-500 dark:text-gray-400 text-xs mt-0.5">
								{pm.type === 'UPI' ? pm.upiNumber : `${pm.accountNumber} (${pm.ifscCode})`}
							</div>
						</div>
					);
				}

				return <span className="text-gray-500 text-sm">No data</span>;
			},
		},
		{
			accessorKey: 'submittedAt',
			header: 'Submitted At',
			cell: ({ row }: any) => (
				<div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
					<Clock className="w-4 h-4 mr-1 opacity-70" />
					{formatDate(row.original.submittedAt)}
				</div>
			),
		},
		{
			id: 'actions',
			header: () => <div className="text-right">Actions</div>,
			cell: ({ row }: any) => {
				const v = row.original;
				const userId = v.id;
				const isProcessing = processingId === userId;
				const type = v.pendingType;

				return (
					<div className="flex items-center justify-end gap-2">
						<Button
							size="sm"
							variant="outline"
							className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20 dark:hover:bg-emerald-500/20 disabled:opacity-50"
							disabled={isProcessing}
							onClick={() => handleVerify(userId, type, 'APPROVE')}
						>
							{isProcessing ? (
								<Loader2 className="w-4 h-4 animate-spin" />
							) : (
								<CheckCircle className="w-4 h-4 mr-1" />
							)}{' '}
							Approve
						</Button>
						<Button
							size="sm"
							variant="outline"
							className="bg-red-50 text-red-700 hover:bg-red-100 hover:text-red-800 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20 dark:hover:bg-red-500/20 disabled:opacity-50"
							disabled={isProcessing}
							onClick={() => handleVerify(userId, type, 'REJECT')}
						>
							{isProcessing ? (
								<Loader2 className="w-4 h-4 animate-spin" />
							) : (
								<XCircle className="w-4 h-4 mr-1" />
							)}{' '}
							Reject
						</Button>
					</div>
				);
			},
		},
	];

	const table = useReactTable({
		data: filteredVerifications,
		columns,
		getCoreRowModel: getCoreRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		globalFilterFn: 'includesString',
		state: {
			globalFilter,
		},
		onGlobalFilterChange: setGlobalFilter,
		initialState: {
			pagination: {
				pageSize: 10,
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
						<h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
							Verifications
						</h2>
						<p className="text-gray-500 dark:text-gray-400 mt-2">
							Review and process user KYC and payment methods.
						</p>
					</div>
				</div>

				<div className="flex flex-col sm:flex-row items-center justify-between gap-4">
					<Tabs value={typeFilter} onValueChange={setTypeFilter} className="w-full sm:w-auto">
						<TabsList className="bg-gray-100 dark:bg-[#1C1C1E]">
							<TabsTrigger value="ALL">All Pending</TabsTrigger>
							<TabsTrigger value="KYC">KYC Only</TabsTrigger>
							<TabsTrigger value="PAYMENT">Payment Only</TabsTrigger>
						</TabsList>
					</Tabs>

					<div className="relative w-full sm:w-72">
						<Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500 dark:text-gray-400" />
						<Input
							placeholder="Search by phone..."
							value={globalFilter ?? ''}
							onChange={(e) => setGlobalFilter(e.target.value)}
							className="pl-9 bg-white dark:bg-[#1C1C1E] border-gray-200 dark:border-white/10 focus-visible:ring-blue-500"
						/>
					</div>
				</div>

				<div className="rounded-xl border bg-white dark:bg-[#1C1C1E] dark:border-white/10 shadow-sm overflow-hidden">
					<div className="overflow-x-auto">
						<Table>
							<TableHeader className="bg-gray-50 dark:bg-[#2C2C2E]">
								{table.getHeaderGroups().map((headerGroup) => (
									<TableRow
										key={headerGroup.id}
										className="border-gray-200 dark:border-white/10 hover:bg-transparent"
									>
										{headerGroup.headers.map((header) => (
											<TableHead
												key={header.id}
												className="text-gray-600 dark:text-gray-400 font-medium whitespace-nowrap"
											>
												{header.isPlaceholder
													? null
													: flexRender(header.column.columnDef.header, header.getContext())}
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
											data-state={row.getIsSelected() && 'selected'}
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
										<TableCell colSpan={columns.length} className="h-40 text-center">
											<div className="flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
												<CheckSquare className="w-10 h-10 mb-3 opacity-20" />
												<p className="text-base font-medium">All caught up!</p>
												<p className="text-sm mt-1">No pending verifications found.</p>
											</div>
										</TableCell>
									</TableRow>
								)}
							</TableBody>
						</Table>
					</div>
				</div>

				{table.getRowModel().rows?.length > 0 && (
					<div className="flex items-center justify-between py-4">
						<div className="text-sm text-gray-500 dark:text-gray-400">
							Showing {table.getRowModel().rows.length} of {filteredVerifications.length}{' '}
							verifications
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
				)}
			</div>
		</AdminLayout>
	);
}

// Ensure CheckSquare icon is imported at the top
import { CheckSquare } from 'lucide-react';

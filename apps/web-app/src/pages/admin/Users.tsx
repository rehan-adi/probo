import { useEffect, useState } from 'react';
import { adminApi } from '@/config/axios';
import { toast } from 'sonner';
import { Loader2, Search, User, Mail, Phone, CalendarDays } from 'lucide-react';
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
import { formatDate } from '@/lib/format';

export default function AdminUsers() {
	const [users, setUsers] = useState<any[]>([]);
	const [loading, setLoading] = useState(true);
	const [globalFilter, setGlobalFilter] = useState('');

	const fetchUsers = async () => {
		try {
			const res = await adminApi.get(`/users`);
			if (res.data.success) {
				setUsers(res.data.data);
			}
		} catch (err) {
			console.error('Failed to fetch users', err);
			toast.error('Failed to fetch users');
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchUsers();
	}, []);

	const columns = [
		{
			accessorKey: "username",
			header: "User",
			cell: ({ row }: any) => {
				const user = row.original;
				return (
					<div className="flex items-center gap-3">
						<div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-700 dark:text-blue-400 font-bold border border-blue-200 dark:border-blue-800">
							{user.username?.charAt(0).toUpperCase() || 'U'}
						</div>
						<div className="flex flex-col">
							<span className="font-medium text-gray-900 dark:text-white">{user.username || 'No username'}</span>
							<span className="text-xs text-gray-500 dark:text-gray-400">ID: {user.id.substring(0, 8)}...</span>
						</div>
					</div>
				);
			},
		},
		{
			accessorKey: "contact",
			header: "Contact Info",
			cell: ({ row }: any) => {
				const user = row.original;
				return (
					<div className="flex flex-col gap-1">
						{user.email && (
							<div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
								<Mail className="w-3 h-3 mr-1.5 opacity-70" />
								{user.email}
							</div>
						)}
						{user.phone && (
							<div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
								<Phone className="w-3 h-3 mr-1.5 opacity-70" />
								{user.phone}
							</div>
						)}
						{!user.email && !user.phone && <span className="text-sm text-gray-500">No contact info</span>}
					</div>
				);
			},
		},
		{
			accessorKey: "kycVerificationStatus",
			header: "KYC Status",
			cell: ({ row }: any) => {
				const status = row.getValue("kycVerificationStatus");
				if (status === 'VERIFIED') return <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20">Verified</Badge>;
				if (status === 'PENDING') return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20">Pending</Badge>;
				if (status === 'REJECTED') return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20">Rejected</Badge>;
				return <Badge variant="outline" className="text-gray-500 border-gray-200 dark:border-white/10 dark:text-gray-400">Not Verified</Badge>;
			},
		},
		{
			accessorKey: "paymentVerificationStatus",
			header: "Payment Status",
			cell: ({ row }: any) => {
				const status = row.getValue("paymentVerificationStatus");
				if (status === 'VERIFIED') return <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20">Verified</Badge>;
				if (status === 'PENDING') return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20">Pending</Badge>;
				if (status === 'REJECTED') return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20">Rejected</Badge>;
				return <Badge variant="outline" className="text-gray-500 border-gray-200 dark:border-white/10 dark:text-gray-400">Not Verified</Badge>;
			},
		},
		{
			accessorKey: "role",
			header: "Role",
			cell: ({ row }: any) => {
				const role = row.getValue("role");
				if (role === 'ADMIN') return <Badge variant="secondary" className="bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400">Admin</Badge>;
				return <Badge variant="outline" className="text-gray-600 dark:text-gray-400">User</Badge>;
			},
		},
		{
			accessorKey: "createdAt",
			header: "Joined At",
			cell: ({ row }: any) => (
				<div className="flex items-center text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
					<CalendarDays className="w-4 h-4 mr-1 opacity-70" />
					{formatDate(row.getValue("createdAt"))}
				</div>
			),
		},
	];

	const table = useReactTable({
		data: users,
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
						<h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Users</h2>
						<p className="text-gray-500 dark:text-gray-400 mt-2">Manage all registered users on the platform.</p>
					</div>
				</div>

				<div className="flex items-center justify-end">
					<div className="relative w-full sm:w-80">
						<Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500 dark:text-gray-400" />
						<Input
							placeholder="Search by username, email, phone..."
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
												<User className="w-8 h-8 mb-2 opacity-20" />
												<p>No users found.</p>
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
						Showing {table.getRowModel().rows.length} of {users.length} users
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

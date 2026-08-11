import api from '@/config/axios';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllCategoary } from '@/api/category';
import { Calendar } from '@/components/ui/calendar';
import { useCreateEventMutation } from '@/hooks/mutations/event';
import { CalendarIcon, Loader2, UploadCloud, ArrowLeft } from 'lucide-react';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const steps = ['Basic Info', 'Timeline', 'Thumbnail'];

const CreateEvent = () => {
	const [step, setStep] = useState(0);
	const [form, setForm] = useState({
		title: '',
		eos: '',
		rules: '',
		startTime: '',
		endTime: '',
		sourceOfTruth: '',
		categoryId: '',
		thumbnail: null as File | null,
	});

	const [categories, setCategories] = useState<{ id: string; categoryName: string }[]>([]);

	useEffect(() => {
		const fetchCategories = async () => {
			try {
				const response = await getAllCategoary();
				const result = response.data;
				if (result.success && result.data) {
					setCategories(result.data);
				}
			} catch (err) {
				console.error('Error fetching categories:', err);
			}
		};

		fetchCategories();
	}, []);

	const handleChange = (e: any) => {
		const { name, value, files } = e.target;
		if (name === 'thumbnail') {
			setForm({ ...form, thumbnail: files[0] });
		} else {
			setForm({ ...form, [name]: value });
		}
	};

	const uploadToS3 = async (file: File): Promise<string> => {
		try {
			const res = await api.post('/market/generate-url', {
				fileName: file.name,
				fileType: file.type,
			});

			const { url, publicUrl } = res.data;

			const uploadRes = await fetch(url, {
				method: 'PUT',
				body: file,
				headers: {
					'Content-Type': file.type,
				},
			});

			if (!uploadRes.ok) {
				const text = await uploadRes.text();
				console.error('Upload failed:', uploadRes.status, text);
				throw new Error(`Upload failed: ${uploadRes.status}`);
			}

			return publicUrl;
		} catch (err) {
			console.error('Upload to S3 failed:', err);
			throw err;
		}
	};

	const navigate = useNavigate();

	const { mutate: createEvent, isPending } = useCreateEventMutation();

	const handleSubmit = async () => {
		try {
			let uploadedKey = null;

			if (form.thumbnail) {
				uploadedKey = await uploadToS3(form.thumbnail);
			}

			createEvent(
				{
					title: form.title,
					eos: form.eos,
					rules: form.rules,
					startTime: form.startTime,
					endTime: form.endTime,
					sourceOfTruth: form.sourceOfTruth,
					categoryId: form.categoryId,
					thumbnail: uploadedKey,
				},
				{
					onSuccess: () => {
						navigate('/dashboard/markets');
					},
					onError: (error) => {
						console.error('Create event error:', error);
					},
				},
			);
		} catch (err) {
			console.error('Error submitting event:', err);
		}
	};

	const renderStep = () => {
		switch (step) {
			case 0:
				return (
					<div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
						<h3 className="text-lg font-semibold text-gray-900 dark:text-white">Basic Information</h3>

						<div className="space-y-4">
							<div>
								<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
									Title or Name of Event
								</label>
								<input
									type="text"
									name="title"
									placeholder="e.g. Will Bitcoin cross $100k?"
									value={form.title}
									onChange={handleChange}
									className="w-full p-3 border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1C1C1E] text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
								/>
							</div>

							<div>
								<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
									Event Overview & Statistics
								</label>
								<textarea
									name="eos"
									rows={3}
									placeholder="Brief overview of the event context..."
									value={form.eos}
									onChange={handleChange}
									className="w-full p-3 border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1C1C1E] text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
								/>
							</div>

							<div>
								<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
									Event Rules
								</label>
								<textarea
									name="rules"
									rows={3}
									placeholder="Resolution criteria and specific rules..."
									value={form.rules}
									onChange={handleChange}
									className="w-full p-3 border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1C1C1E] text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
								/>
							</div>

							<div>
								<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
									Category
								</label>
								<Select
									value={form.categoryId}
									onValueChange={(value) => setForm({ ...form, categoryId: value })}
								>
									<SelectTrigger className="w-full p-3 border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1C1C1E] text-gray-900 dark:text-white rounded-lg h-auto">
										<SelectValue placeholder="Select Category" />
									</SelectTrigger>
									<SelectContent className="bg-white dark:bg-[#1C1C1E] border-gray-200 dark:border-white/10">
										{categories.map((category: any) => (
											<SelectItem key={category.id} value={category.id}>
												{category.categoryName}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
						</div>
					</div>
				);
			case 1:
				return (
					<div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
						<h3 className="text-lg font-semibold text-gray-900 dark:text-white">Timeline & Source</h3>
						
						<div className="space-y-4">
							<div>
								<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
									Start Time
								</label>
								<Popover>
									<PopoverTrigger asChild>
										<button
											type="button"
											className={cn(
												'w-full p-3 border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1C1C1E] text-left rounded-lg flex justify-between items-center transition-shadow hover:bg-gray-50 dark:hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-blue-500',
												!form.startTime ? 'text-gray-500' : 'text-gray-900 dark:text-white'
											)}
										>
											{form.startTime ? format(new Date(form.startTime), 'PPPp') : 'Pick start time'}
											<CalendarIcon className="h-4 w-4 text-gray-400" />
										</button>
									</PopoverTrigger>
									<PopoverContent className="w-auto p-4 space-y-4 bg-white dark:bg-[#1C1C1E] border-gray-200 dark:border-white/10">
										<Calendar
											mode="single"
											selected={form.startTime ? new Date(form.startTime) : undefined}
											onSelect={(date) => {
												if (!date) return;
												const existingTime = form.startTime ? new Date(form.startTime) : new Date();
												date.setHours(existingTime.getHours(), existingTime.getMinutes());
												setForm({ ...form, startTime: date.toISOString() });
											}}
											initialFocus
											showOutsideDays
										/>
										<input
											type="time"
											className="border border-gray-200 dark:border-white/10 bg-white dark:bg-[#2C2C2E] text-gray-900 dark:text-white rounded-lg p-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
											value={form.startTime ? format(new Date(form.startTime), 'HH:mm') : ''}
											onChange={(e) => {
												const [hours, minutes] = e.target.value.split(':').map(Number);
												const date = form.startTime ? new Date(form.startTime) : new Date();
												date.setHours(hours, minutes);
												setForm({ ...form, startTime: date.toISOString() });
											}}
										/>
									</PopoverContent>
								</Popover>
							</div>

							<div>
								<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
									End Time
								</label>
								<Popover>
									<PopoverTrigger asChild>
										<button
											type="button"
											className={cn(
												'w-full p-3 border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1C1C1E] text-left rounded-lg flex justify-between items-center transition-shadow hover:bg-gray-50 dark:hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-blue-500',
												!form.endTime ? 'text-gray-500' : 'text-gray-900 dark:text-white'
											)}
										>
											{form.endTime ? format(new Date(form.endTime), 'PPPp') : 'Pick end time'}
											<CalendarIcon className="h-4 w-4 text-gray-400" />
										</button>
									</PopoverTrigger>
									<PopoverContent className="w-auto p-4 space-y-4 bg-white dark:bg-[#1C1C1E] border-gray-200 dark:border-white/10">
										<Calendar
											mode="single"
											selected={form.endTime ? new Date(form.endTime) : undefined}
											onSelect={(date) => {
												if (!date) return;
												const existingTime = form.endTime ? new Date(form.endTime) : new Date();
												date.setHours(existingTime.getHours(), existingTime.getMinutes());
												setForm({ ...form, endTime: date.toISOString() });
											}}
											initialFocus
											showOutsideDays
										/>
										<input
											type="time"
											className="border border-gray-200 dark:border-white/10 bg-white dark:bg-[#2C2C2E] text-gray-900 dark:text-white rounded-lg p-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
											value={form.endTime ? format(new Date(form.endTime), 'HH:mm') : ''}
											onChange={(e) => {
												const [hours, minutes] = e.target.value.split(':').map(Number);
												const date = form.endTime ? new Date(form.endTime) : new Date();
												date.setHours(hours, minutes);
												setForm({ ...form, endTime: date.toISOString() });
											}}
										/>
									</PopoverContent>
								</Popover>
							</div>

							<div>
								<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
									Source of Truth URL
								</label>
								<input
									type="url"
									name="sourceOfTruth"
									placeholder="https://example.com/resolution-source"
									value={form.sourceOfTruth}
									onChange={handleChange}
									className="w-full p-3 border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1C1C1E] text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
								/>
							</div>
						</div>
					</div>
				);
			case 2:
				return (
					<div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
						<h3 className="text-lg font-semibold text-gray-900 dark:text-white">Thumbnail</h3>
						
						<label
							htmlFor="file-upload"
							className={cn(
								"cursor-pointer flex flex-col items-center justify-center w-full border-2 border-dashed p-10 rounded-xl transition-all",
								form.thumbnail 
									? 'border-blue-500 bg-blue-50 dark:bg-blue-500/10' 
									: 'border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-[#1C1C1E] hover:bg-gray-100 dark:hover:bg-[#2C2C2E]'
							)}
						>
							<UploadCloud className={cn("w-12 h-12 mb-3", form.thumbnail ? "text-blue-500" : "text-gray-400")} />
							<span className={cn("font-medium", form.thumbnail ? "text-blue-700 dark:text-blue-400" : "text-gray-600 dark:text-gray-400")}>
								{form.thumbnail ? form.thumbnail.name : 'Click to upload thumbnail image'}
							</span>
							{!form.thumbnail && <span className="text-sm text-gray-500 mt-1">PNG, JPG or WEBP up to 5MB</span>}
							<input
								id="file-upload"
								type="file"
								name="thumbnail"
								accept="image/*"
								onChange={handleChange}
								className="hidden"
							/>
						</label>
					</div>
				);
		}
	};

	return (
		<AdminLayout>
			<div className="space-y-6 max-w-3xl mx-auto py-6">
				<div className="flex items-center gap-4">
					<Button variant="ghost" size="icon" onClick={() => navigate('/dashboard/markets')} className="rounded-full">
						<ArrowLeft className="w-5 h-5" />
					</Button>
					<div>
						<h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Create New Market</h2>
						<p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">Launch a new prediction event on the platform.</p>
					</div>
				</div>

				<div className="flex items-center gap-2 mb-8">
					{steps.map((s, i) => (
						<div key={i} className="flex items-center flex-1">
							<div className={cn(
								"h-2 flex-1 rounded-full transition-colors duration-300",
								step >= i ? "bg-blue-600 dark:bg-blue-500" : "bg-gray-200 dark:bg-gray-800"
							)} />
						</div>
					))}
				</div>

				<Card className="border-gray-200 dark:border-white/10 dark:bg-[#1C1C1E] shadow-sm">
					<CardContent className="p-6 md:p-8">
						<div className="min-h-[350px]">
							{renderStep()}
						</div>

						<div className="flex items-center justify-between mt-10 pt-6 border-t border-gray-200 dark:border-white/10">
							<Button
								variant="outline"
								onClick={() => setStep((prev) => prev - 1)}
								disabled={step === 0}
								className="border-gray-200 dark:border-white/10 dark:bg-transparent dark:text-white dark:hover:bg-white/10"
							>
								Back
							</Button>

							{step < steps.length - 1 ? (
								<Button onClick={() => setStep((s) => s + 1)} className="bg-blue-600 hover:bg-blue-700 text-white min-w-[100px]">
									Next
								</Button>
							) : (
								<Button 
									onClick={handleSubmit} 
									disabled={isPending}
									className="bg-emerald-600 hover:bg-emerald-700 text-white min-w-[120px]"
								>
									{isPending ? (
										<>
											<Loader2 className="w-4 h-4 mr-2 animate-spin" />
											Creating...
										</>
									) : (
										'Create Market'
									)}
								</Button>
							)}
						</div>
					</CardContent>
				</Card>
			</div>
		</AdminLayout>
	);
};

export default CreateEvent;

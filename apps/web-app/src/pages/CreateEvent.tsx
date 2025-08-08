import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllCategoary } from '@/api/category';
import { Calendar } from '@/components/ui/calendar';
import kycTitleIcon from '@/assets/images/kyc_title.avif';
import { useCreateEventMutation } from '@/hooks/mutations/event';
import { CalendarIcon, Loader2, UploadCloud } from 'lucide-react';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

const steps = ['Basic Info', 'Timeline', 'Thumbnail'];

const CreateEvent = () => {
	const [step, setStep] = useState(0);
	const [form, setForm] = useState({
		title: '',
		description: '',
		startTime: '',
		endTime: '',
		sourceOfTruth: '',
		categoryId: '',
		thumbnail: null,
	});
	const [categories, setCategories] = useState([]);

	useEffect(() => {
		const fetchCategories = async () => {
			try {
				const response = await getAllCategoary();
				setCategories(response.data.data);
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
			const res = await fetch('http://localhost:3000/api/v1/generate/url', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					fileName: file.name,
					fileType: file.type,
				}),
			});

			if (!res.ok) throw new Error('Failed to get presigned URL');

			const { url, publicUrl } = await res.json();

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
					description: form.description,
					startTime: form.startTime,
					endTime: form.endTime,
					sourceOfTruth: form.sourceOfTruth,
					categoryId: form.categoryId,
					thumbnail: uploadedKey,
				},
				{
					onSuccess: () => {
						navigate('/events');
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
					<div className="space-y-4 w-full">
						<div className="max-w-sm space-y-5">
							<h3 className="text-lg font-semibold text-black">Step 1: Basic Info</h3>

							<div>
								<label className="block text-base text-[#262626] mb-1">
									Title or Name of Event
								</label>
								<input
									type="text"
									name="title"
									placeholder="Market Title"
									value={form.title}
									onChange={handleChange}
									className="w-full p-3 border border-gray-400/40 rounded-lg focus:outline-none"
								/>
							</div>

							<div>
								<label className="block text-base text-[#262626] mb-1">Description of Event</label>
								<textarea
									name="description"
									rows={4}
									placeholder="Market Description"
									value={form.description}
									onChange={handleChange}
									className="w-full p-3 border border-gray-400/40 rounded-lg focus:outline-none"
								/>
							</div>

							<div>
								<label className="block text-base text-[#262626] mb-1">Category</label>
								<Select
									value={form.categoryId}
									onValueChange={(value) => setForm({ ...form, categoryId: value })}
								>
									<SelectTrigger className="w-full px-4 py-6 border border-gray-400/40 rounded-lg text-left text-base">
										<SelectValue placeholder="Select Category" />
									</SelectTrigger>
									<SelectContent className="text-base">
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
					<div className="max-w-sm space-y-8">
						<div>
							<label className="block text-base text-[#262626] mb-1">Start Time</label>
							<Popover>
								<PopoverTrigger asChild>
									<button
										type="button"
										className={cn(
											'w-full p-3 border border-gray-300 rounded-lg flex justify-between items-center',
											!form.startTime && 'text-muted-foreground',
										)}
									>
										{form.startTime ? format(new Date(form.startTime), 'PPPp') : 'Pick start time'}
										<CalendarIcon className="ml-2 h-4 w-4" />
									</button>
								</PopoverTrigger>
								<PopoverContent className="w-auto p-4 space-y-4">
									<Calendar
										mode="single"
										selected={form.startTime ? new Date(form.startTime) : undefined}
										onSelect={(date) => {
											if (!date) return;
											// keep existing time if already set
											const existingTime = form.startTime ? new Date(form.startTime) : new Date();
											date.setHours(existingTime.getHours(), existingTime.getMinutes());
											setForm({ ...form, startTime: date.toISOString() });
										}}
										initialFocus
										showOutsideDays
									/>
									<input
										type="time"
										className="border border-gray-300 rounded-lg p-2 w-full"
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
							<label className="block text-base text-[#262626] mb-1">End Time</label>
							<Popover>
								<PopoverTrigger asChild>
									<button
										type="button"
										className={cn(
											'w-full p-3 border border-gray-300 rounded-lg flex justify-between items-center',
											!form.endTime && 'text-muted-foreground',
										)}
									>
										{form.endTime ? format(new Date(form.endTime), 'PPPp') : 'Pick end time'}
										<CalendarIcon className="ml-2 h-4 w-4" />
									</button>
								</PopoverTrigger>
								<PopoverContent className="w-auto p-4 space-y-4">
									<Calendar
										mode="single"
										selected={form.endTime ? new Date(form.endTime) : undefined}
										onSelect={(date) => {
											if (!date) return;
											// keep existing time if already set
											const existingTime = form.endTime ? new Date(form.endTime) : new Date();
											date.setHours(existingTime.getHours(), existingTime.getMinutes());
											setForm({ ...form, endTime: date.toISOString() });
										}}
										initialFocus
										showOutsideDays
									/>
									<input
										type="time"
										className="border border-gray-300 rounded-lg p-2 w-full"
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
							<label className="block text-base text-[#262626] mb-1">Source of Truth</label>
							<input
								type="url"
								name="sourceOfTruth"
								placeholder="https://example.com"
								value={form.sourceOfTruth}
								onChange={handleChange}
								className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none"
							/>
						</div>
					</div>
				);
			case 2:
				return (
					<div className="space-y-4">
						<div className="max-w-sm space-y-6">
							<h3 className="text-lg font-semibold text-black">Step 3: Upload Thumbnail</h3>
							<label
								htmlFor="file-upload"
								className={`cursor-pointer flex flex-col items-center justify-center w-full border-2 border-dashed p-8 rounded-xl bg-gray-50 hover:bg-gray-100 transition ${
									form.thumbnail ? 'border-[#197BFF]' : 'border-gray-400'
								}`}
							>
								<UploadCloud className="w-10 h-10 text-gray-500 mb-2" />
								<span className="text-gray-600">Click to upload thumbnail (image only)</span>
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
					</div>
				);
		}
	};

	return (
		<div className="w-full bg-[#f4f4f5] md:p-10 p-4">
			<div className="max-w-4xl mx-auto flex flex-col pt-14 rounded-2xl">
				<div className="flex items-start justify-start mb-5 gap-3">
					<div className="flex justify-center md:justify-start">
						<img src={kycTitleIcon} alt="KYC Illustration" className="w-16 h-16 object-contain" />
					</div>

					<div className="text-left">
						<h2 className="text-2xl font-semibold">Create Event</h2>
						<p className="text-[#545454] text-base">Fill all the important details</p>
					</div>
				</div>

				<h2 className="text-3xl font-semibold text-black"></h2>

				<div className="bg-white rounded-xl py-4 px-4">
					<div className="mb-10">{renderStep()}</div>

					<div className="mt-auto max-w-sm flex flex-col items-start justify-start gap-4">
						{step < steps.length - 1 ? (
							<>
								<button
									onClick={() => setStep((s) => s + 1)}
									className="px-10 w-full py-3 text-sm font-semibold bg-[#262626] cursor-pointer text-white rounded-lg"
								>
									Next
								</button>
								{step > 0 && (
									<button
										onClick={() => setStep((s) => s - 1)}
										className="px-10 w-full py-3 text-sm font-semibold text-black rounded-lg cursor-pointer border border-gray-400/40"
									>
										Back
									</button>
								)}
							</>
						) : (
							<>
								<button
									onClick={handleSubmit}
									disabled={isPending}
									className="px-10 w-full text-sm py-3 cursor-pointer bg-[#262626] text-white font-semibold rounded-lg"
								>
									{isPending ? (
										<div className="flex justify-center items-center">
											<Loader2 className="animate-spin w-6 h-6 text-white" />
										</div>
									) : (
										'Submit'
									)}
								</button>
								{step > 0 && (
									<button
										onClick={() => setStep((s) => s - 1)}
										className="px-10 w-full py-3 text-sm font-semibold text-black rounded-lg border cursor-pointer border-gray-400/40"
									>
										Back
									</button>
								)}
								<p>{`isPending: ${isPending}`}</p>
							</>
						)}
					</div>
				</div>
			</div>
		</div>
	);
};

export default CreateEvent;

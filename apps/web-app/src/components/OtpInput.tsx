import { useRef } from 'react';

export default function OTPInput({
	onChange,
	value,
}: {
	value: string;
	onChange: (value: string) => void;
}) {
	const inputsRef = useRef<HTMLInputElement[]>([]);

	const handleChange = (val: string, idx: number) => {
		if (!/^[0-9]?$/.test(val)) return;

		const otpArr = value.split('');
		otpArr[idx] = val;
		const newVal = otpArr.join('').padEnd(6, '');
		onChange(newVal);

		if (val && idx < 5) {
			inputsRef.current[idx + 1]?.focus();
		}
	};

	const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, idx: number) => {
		if (e.key === 'Backspace') {
			e.preventDefault(); // Prevent default deletion behavior

			const otpArr = value.split('');

			// If current input has a value, clear it
			if (value[idx]) {
				otpArr[idx] = '';
				onChange(otpArr.join('').padEnd(6, ''));
				return;
			}

			// If current is already empty, move back and clear previous
			if (idx > 0) {
				inputsRef.current[idx - 1]?.focus();
				otpArr[idx - 1] = '';
				onChange(otpArr.join('').padEnd(6, ''));
			}
		}
	};

	return (
		<div className="flex gap-2 sm:gap-3 mb-3 justify-center w-full">
			{[...Array(6)].map((_, i) => (
				<input
					key={i}
					ref={(el) => {
						if (el) inputsRef.current[i] = el;
					}}
					type="text"
					maxLength={1}
					value={value[i] || ''}
					onChange={(e) => handleChange(e.target.value, i)}
					onKeyDown={(e) => handleKeyDown(e, i)}
					className="w-12 h-14 sm:w-14 sm:h-16 border-2 border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl text-center text-2xl font-bold focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 text-gray-900 dark:text-white transition-all shadow-sm"
				/>
			))}
		</div>
	);
}

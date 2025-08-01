import { useRef, useState } from 'react';

export default function OTPInput({ onComplete }: { onComplete?: (code: string) => void }) {
	const [otp, setOtp] = useState(Array(6).fill(''));
	const inputsRef = useRef<HTMLInputElement[]>([]);

	const handleChange = (value: string, index: number) => {
		if (!/^[0-9]?$/.test(value)) return;

		const newOtp = [...otp];
		newOtp[index] = value;
		setOtp(newOtp);

		if (value && index < 5) {
			inputsRef.current[index + 1]?.focus();
		}

		if (newOtp.every((digit) => digit !== '') && onComplete) {
			onComplete(newOtp.join(''));
		}
	};

	const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
		if (e.key === 'Backspace' && otp[index] === '' && index > 0) {
			inputsRef.current[index - 1]?.focus();
		}
	};

	return (
		<div className="flex md:gap-4 gap-3 mb-5 justify-start">
			{otp.map((digit, i) => (
				<input
					key={i}
					ref={(el) => {
						inputsRef.current[i] = el!;
					}}
					type="text"
					maxLength={1}
					value={digit}
					onChange={(e) => handleChange(e.target.value, i)}
					onKeyDown={(e) => handleKeyDown(e, i)}
					className="md:w-12 w-10 md:h-12 h-10 border border-gray-300 rounded-md text-center text-lg focus:outline-none"
				/>
			))}
		</div>
	);
}

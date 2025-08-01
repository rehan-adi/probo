import xIcon from '@/assets/images/x.avif';
import instaIcon from '@/assets/images/instagram.avif';
import youtubeIcon from '@/assets/images/youtube.avif';
import linkedinIcon from '@/assets/images/linkedin.avif';
import datamuniIcon from '@/assets/images/datamuni.avif';
import authBridgeIcon from '@/assets/images/authbridge.avif';
import tradeViewIcon from '@/assets/images/trading-view.avif';
import googleCloudIcon from '@/assets/images/google-cloud.avif';
import googleFirebaseIcon from '@/assets/images/google-firebase.avif';

export default function Footer() {
	return (
		<footer className="bg-[#f4f4f5] bottom-0 text-gray-800 px-4 md:px-16 py-10 text-sm">
			{/* Top section */}
			<div className="grid grid-cols-1 border-t pt-10 md:grid-cols-4 gap-6 border-b border-gray-400/25 pb-10">
				<div>
					<h2 className="md:text-lg text-base font-semibold mb-2">Company</h2>
					<ul className="space-y-1">
						<li>
							<a href="#">About Us</a>
						</li>
						<li>
							<a href="#">Culture</a>
						</li>
					</ul>
				</div>

				<div>
					<h2 className="md:text-lg text-base font-semibold mb-2">Resources</h2>
					<ul className="space-y-1">
						<li>
							<a href="#">Help Centre</a>
						</li>
						<li>
							<a href="#">Contact Support</a>
						</li>
						<li>
							<a href="#">What's New</a>
						</li>
					</ul>
				</div>

				<div>
					<h2 className="md:text-lg text-base font-semibold mb-2">Careers</h2>
					<ul>
						<li>
							<a href="#">Open Roles</a>
						</li>
					</ul>
				</div>

				<div>
					<h2 className="md:text-lg text-base font-semibold mb-2">Contact Us</h2>
					<ul className="space-y-1">
						<li>
							<a href="mailto:help@probo.in">help@probo.in</a>
						</li>
						<li>
							<a href="mailto:communication@probo.in">communication@probo.in</a>
						</li>
					</ul>
				</div>
			</div>

			{/* Partnerships */}
			<div className="mt-10 w-full flex flex-col md:flex-row border-b border-gray-400/25 pb-10">
				<div className="md:w-2/4">
					<h3 className="font-semibold text-base mb-2">Probo Partnerships</h3>
					<p className="text-sm leading-relaxed">
						Probo’s experience is made possible by our partnerships with <strong>Authbridge</strong>{' '}
						for verification technology, <strong>DataMuni</strong> for data & analytics,{' '}
						<strong>Google Firebase</strong>, <strong>Google Cloud</strong> & <strong>AWS</strong>.
						Probo is also a member of <strong>FICCI</strong> and <strong>ASSOCHAM</strong>.
					</p>
				</div>
				{/* Partner logos */}
				<div className="flex md:w-2/4 gap-4 md:justify-end justify-start mt-8">
					<img src={tradeViewIcon} alt="Partner" className="h-12" />
					<img src={authBridgeIcon} alt="Partner" className="h-12" />
					<img src={datamuniIcon} alt="Partner" className="h-12" />
					<img src={googleCloudIcon} alt="Partner" className="h-12" />
					<img src={googleFirebaseIcon} alt="Partner" className="h-12" />
				</div>
			</div>

			{/* Social & Legal */}
			<div className="md:mt-5 mt-0 flex justify-center flex-col md:flex-row items-center text-center px-4 py-6 border-b border-gray-400/25 md:pb-10 pb-5">
				<div className="flex flex-wrap gap-6 text-base font-semibold mb-0">
					<a href="#" className="flex items-center gap-2">
						<img src={linkedinIcon} alt="LinkedIn icon" className="h-10" />
						<span className="hidden md:flex">LinkedIn</span>
					</a>
					<a href="#" className="flex items-center gap-2">
						<img src={xIcon} alt="X icon" className="h-10" />
						<span className="hidden md:flex">Twitter</span>
					</a>
					<a href="#" className="flex items-center gap-2">
						<img src={instaIcon} alt="Instagram icon" className="h-10" />
						<span className="hidden md:flex">Instagram</span>
					</a>
					<a href="#" className="flex items-center gap-2">
						<img src={youtubeIcon} alt="YouTube icon" className="h-10" />
						<span className="hidden md:flex">YouTube</span>
					</a>
				</div>
			</div>

			<div className="flex mt-10 flex-col md:flex-row justify-between gap-3 items-center text-sm">
				<div className="flex gap-5">
					<a href="#" className="text-[#757575] text-sm font-semibold">
						Terms and Conditions
					</a>
					<a href="#" className="text-[#757575] text-sm font-semibold">
						Privacy Policy
					</a>
					<a href="#" className="text-[#757575] text-sm font-semibold">
						Legality
					</a>
				</div>
				<p className="text-[#757575] text-center textc text-base">
					© copyright 2025 by Probo Media Technologies Pvt. Ltd.
				</p>
			</div>

			{/* Bottom disclaimer */}
			<div className="flex flex-col justify-start mt-16 text-xs text-gray-600">
				<h1 className="text-black font-semibold text-base">Disclaimer</h1>
				<p className="text-base mt-3 text-black">
					This game may be habit forming or financially risky. Play responsibly. 18+ only.
				</p>
			</div>
		</footer>
	);
}

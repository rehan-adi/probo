import { ArrowRight, ChevronDown } from 'lucide-react';
import kycWalletIcon from '@/assets/images/kyc_v2.avif';
import emailWalletIcon from '@/assets/images/email_v2.avif';
import vaultWalletIcon from '@/assets/images/VaultIconV2.avif';
import gaugeWalletIcon from '@/assets/images/gauge_icon_v2.avif';
import { useGetReferralCodeQuery } from '@/hooks/queries/referral';
import { useGetVerificationStaus } from '@/hooks/queries/verification';
import depositWalletIcon from '@/assets/images/deposit_wallet_icon.png';
import transactionWalletIcon from '@/assets/images/transaction_v2.avif';
import winningsWalletIcon from '@/assets/images/winnings_wallet_icon.png';
import promotionalWalletIcon from '@/assets/images/promotional_wallet_icon.avif';
import { useBalanceQuery, useDepositAmountQuery } from '@/hooks/queries/balance';
import { useNavigate } from 'react-router-dom';

export default function WalletPage() {
	const navigate = useNavigate();

	const { data: balance, isLoading } = useBalanceQuery();
	const { data: referralData } = useGetReferralCodeQuery();
	const { data: verificationStatus } = useGetVerificationStaus();
	const { data: depositeAmountData } = useDepositAmountQuery();

	const goToRecharge = () => {
		navigate('/wallet/recharge');
	};

	return (
		<div className="w-full bg-[#f4f4f5] flex justify-center px-4 md:pt-24 pt-20">
			<div className="w-full max-w-[910px] flex flex-col gap-8">
				<div>
					<h2 className="text-sm text-[#262626] font-normal">Total Balance</h2>
					{isLoading ? (
						<p className="text-5xl font-semibold mt-1">₹ 0</p>
					) : (
						<p className="text-5xl font-semibold mt-1">₹ {balance?.data?.data ?? 0}</p>
					)}
				</div>

				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
					<div className="bg-white py-3.5 rounded-xl border border-gray-400/20 flex flex-col items-center justify-center gap-3">
						<div className="flex flex-col px-4 items-center gap-4">
							<img src={depositWalletIcon} alt="Deposite Icon" className="w-8 h-8" />
							<h3 className="text-sm text-[#545454]">Deposit</h3>
						</div>
						{depositeAmountData ? (
							<>
								<p className="text-xl font-semibold">
									₹{depositeAmountData?.data?.data?.totalDepositAmount ?? 0}
								</p>
							</>
						) : (
							<>
								<p className="text-xl font-semibold">₹0</p>
							</>
						)}
						<div className="w-full px-4">
							<button 
							onClick={goToRecharge}
							className="px-4 cursor-pointer py-2.5 w-full text-xs font-semibold rounded-md bg-[#262626] text-white">
								Recharge
							</button>
						</div>
						<div className="w-full h-px bg-gray-400/20" />
						<div className="px-4 w-full flex justify-between items-center">
							<p className="text-xs text-gray-600">View breakdown</p>
							<ChevronDown size={20} />
						</div>
					</div>

					{/* Winnings */}
					<div className="bg-white py-3.5 rounded-xl border border-gray-400/20 flex flex-col gap-2.5 items-center justify-start">
						<div className="flex px-4 flex-col items-center gap-4">
							<img src={winningsWalletIcon} alt="Deposite Icon" className="w-8 h-8" />
							<h3 className="text-sm text-[#545454]">Winnings</h3>
						</div>

						<p
							className={`text-xl px-4 font-semibold ${
								verificationStatus?.data.data.kycVerificationStatus === 'VERIFIED'
									? 'text-black'
									: 'text-[#B0B0B0]'
							}`}
						>
							₹{isLoading ? '0' : (balance?.data?.data ?? 0)}
						</p>

						<div className="px-4 w-full">
							<button
								className={`px-4 py-2.5 w-full text-xs font-semibold rounded-md ${
									verificationStatus?.data.data.kycVerificationStatus === 'VERIFIED'
										? 'text-white cursor-pointer bg-black'
										: 'text-[#B0B0B0] cursor-not-allowed bg-[#EDEDED]'
								}`}
							>
								Withdraw
							</button>
						</div>

						{verificationStatus?.data.data.kycVerificationStatus !== 'VERIFIED' && (
							<>
								<div className="w-full mt-1 h-px bg-gray-400/20" />
								<p className="text-xs mt-1 px-4 w-full text-start text-[#B32306]">
									Complete KYC to withdraw funds
								</p>
							</>
						)}
					</div>

					{/* Promotional */}
					<div className="bg-white p-3.5 rounded-xl border border-gray-200 flex flex-col items-center gap-3">
						<div className="flex flex-col items-center gap-4">
							<img src={promotionalWalletIcon} alt="Deposite Icon" className="w-8 h-8" />
							<h3 className="text-sm text-[#545454]">Promotional</h3>
						</div>
						<p className="text-xl font-semibold">₹20</p>
						<button
							className="px-4 py-2.5 cursor-pointer w-full text-xs font-semibold rounded-md text-black border border-gray-400/30"
							onClick={() => {
								if (referralData?.data.data.referralCode) {
									navigator.clipboard.writeText(referralData?.data.data.referralCode);
								}
							}}
							disabled={!referralData?.data.data.referralCode}
						>
							Invite and earn
						</button>
					</div>
				</div>

				{/* Quick Actions */}
				<div>
					<h2 className="text-xl font-semibold mt-6 mb-4">Quick Actions</h2>
					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
						<div className="bg-[#f4f4f5] p-4 rounded-xl border border-gray-400/20 flex flex-col gap-1">
							<img src={transactionWalletIcon} className="w-8 h-8" />
							<h3 className="text-base mt-4 text-[#262626] font-normal">Transaction History</h3>
							<p className="text-xs text-[#757575]">For all balance debits & credits</p>
							<button className="w-16 h-9 cursor-pointer mt-4 flex items-center justify-center rounded-full border border-gray-400/60 transition">
								<ArrowRight className="w-6 h-6 text-black" />
							</button>
						</div>

						{/* Action 2 */}
						<div className="bg-[#f4f4f5] p-4 rounded-xl border border-gray-400/20 flex flex-col gap-1">
							<img src={vaultWalletIcon} className="w-8 h-8" />
							<h3 className="text-base mt-4 font-normal">Probo Vault</h3>
							<p className="text-xs text-[#757575]">For financial discipline</p>
							<button className="w-36 h-9 cursor-pointer mt-4 flex items-center justify-center text-sm font-semibold rounded-full text-black border border-gray-400/60 transition">
								Comming soon...
							</button>
						</div>

						<div className="bg-[#f4f4f5] p-4 rounded-xl border border-gray-400/20 flex flex-col gap-1">
							<img src={kycWalletIcon} className="w-8 h-8" />
							<h3 className="text-base mt-4 font-normal">KYC verification</h3>
							<p className="text-xs text-[#D29822]">Tap to verify</p>
							<button className="w-16 h-9 cursor-pointer mt-4 flex items-center justify-center rounded-full border border-gray-400/60 transition">
								<ArrowRight className="w-6 h-6 text-black" />
							</button>
						</div>

						<div className="bg-[#f4f4f5] p-4 rounded-xl border border-gray-400/20 flex flex-col gap-1">
							<img src={gaugeWalletIcon} className="w-8 h-8" />
							<h3 className="text-base mt-4 font-normal">Control Centre</h3>
							<p className="text-xs text-[#757575]"> Limits for responsible trading</p>
							<button className="w-36 h-9 cursor-pointer mt-4 flex items-center justify-center text-sm font-semibold rounded-full text-black border border-gray-400/60 transition">
								Comming soon...
							</button>
						</div>

						<div className="bg-[#f4f4f5] p-4 rounded-xl border border-gray-400/20 flex flex-col gap-1">
							<img src={emailWalletIcon} className="w-8 h-8" />
							<h3 className="text-base mt-4 font-normal">Statements & Certificate</h3>
							<p className="text-xs text-[#757575]">For ledger and TDS certificates</p>
							<button className="w-36 h-9 cursor-pointer mt-4 flex items-center justify-center text-sm font-semibold rounded-full text-black border border-gray-400/60 transition">
								Comming soon...
							</button>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}

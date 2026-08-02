import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Language dictionaries
const resources = {
	en: {
		translation: {
			'Search for a market': 'Search for a market...',
			'Sign In': 'Sign In',
			'Leaderboard': 'Leaderboard',
			'Refer & Earn': 'Refer & Earn',
			'Portfolio': 'Portfolio',
			'Profile': 'Profile',
			'Settings': 'Settings',
			'Dark Mode': 'Dark Mode',
			'Light Mode': 'Light Mode',
			'Status': 'Status',
			'How it works': 'How it works',
			'step1_title': '1. Pick a Event',
			'step1_desc': "Buy 'Yes' or 'No' shares based on your prediction. Odds shift in real-time as others trade.",
			'step2_title': '2. Place a Trade',
			'step2_desc': "Fund your account with crypto, debit card, or bank transfer—then you're ready to trade.",
			'step3_title': '3. Redeem',
			'step3_desc': "Sell your shares anytime or wait until the market ends to redeem winning shares for $1.",
			'btn_next': 'Next',
			'btn_get_started': 'Get started'
		},
	},
	es: {
		translation: {
			'Search for a market': 'Buscar un mercado...',
			'Sign In': 'Iniciar sesión',
			'Leaderboard': 'Tabla de clasificación',
			'Refer & Earn': 'Recomiende y Gane',
			'Portfolio': 'Portafolio',
			'Profile': 'Perfil',
			'Settings': 'Configuración',
			'Dark Mode': 'Modo Oscuro',
			'Light Mode': 'Modo Claro',
			'Status': 'Estado',
			'How it works': 'Cómo funciona',
			'step1_title': '1. Elige un Evento',
			'step1_desc': "Compra acciones 'Sí' o 'No' según tu predicción. Las probabilidades cambian en tiempo real.",
			'step2_title': '2. Haz un Intercambio',
			'step2_desc': "Fondea tu cuenta con criptomonedas, tarjeta de débito o transferencia bancaria, y estarás listo para operar.",
			'step3_title': '3. Canjear',
			'step3_desc': "Vende tus acciones en cualquier momento o espera hasta que termine el mercado para canjear las acciones ganadoras por $1.",
			'btn_next': 'Siguiente',
			'btn_get_started': 'Empezar'
		},
	},
	pt: {
		translation: {
			'Search for a market': 'Procure um mercado...',
			'Sign In': 'Entrar',
			'Leaderboard': 'Tabela de classificação',
			'Refer & Earn': 'Indique e Ganhe',
			'Portfolio': 'Portfólio',
			'Profile': 'Perfil',
			'Settings': 'Configurações',
			'Dark Mode': 'Modo Escuro',
			'Light Mode': 'Modo Claro',
			'Status': 'Status',
			'How it works': 'Como funciona',
			'step1_title': '1. Escolha um Evento',
			'step1_desc': "Compre ações 'Sim' ou 'Não' com base na sua previsão. As probabilidades mudam em tempo real.",
			'step2_title': '2. Faça uma Negociação',
			'step2_desc': "Deposite na sua conta com criptografia, cartão de débito ou transferência bancária e você estará pronto para negociar.",
			'step3_title': '3. Resgatar',
			'step3_desc': "Venda suas ações a qualquer momento ou espere o mercado terminar para resgatar ações vencedoras por $1.",
			'btn_next': 'Próximo',
			'btn_get_started': 'Começar'
		},
	},
	hi: {
		translation: {
			'Search for a market': 'बाज़ार खोजें...',
			'Sign In': 'साइन इन करें',
			'Leaderboard': 'लीडरबोर्ड',
			'Refer & Earn': 'रेफर करें और कमाएं',
			'Portfolio': 'पोर्टफोलियो',
			'Profile': 'प्रोफ़ाइल',
			'Settings': 'सेटिंग्स',
			'Dark Mode': 'डार्क मोड',
			'Light Mode': 'लाइट मोड',
			'Status': 'स्थिति',
			'How it works': 'यह कैसे काम करता है',
			'step1_title': '1. एक इवेंट चुनें',
			'step1_desc': "अपनी भविष्यवाणी पर 'हां' या 'नहीं' शेयर खरीदें। ऑड्स वास्तविक समय में बदलते हैं।",
			'step2_title': '2. व्यापार करें',
			'step2_desc': "अपने खाते में क्रिप्टो, डेबिट कार्ड या बैंक ट्रांसफर से फंड डालें- फिर आप व्यापार करने के लिए तैयार हैं।",
			'step3_title': '3. रिडीम करें',
			'step3_desc': "अपने शेयर कभी भी बेचें या $1 के लिए जीतने वाले शेयरों को भुनाने के लिए बाजार समाप्त होने तक प्रतीक्षा करें।",
			'btn_next': 'अगला',
			'btn_get_started': 'शुरू करें'
		},
	},
	bn: {
		translation: {
			'Search for a market': 'বাজার অনুসন্ধান করুন...',
			'Sign In': 'সাইন ইন করুন',
			'Leaderboard': 'লিডারবোর্ড',
			'Refer & Earn': 'রেফার করুন এবং উপার্জন করুন',
			'Portfolio': 'পোর্টফোলিও',
			'Profile': 'প্রোফাইল',
			'Settings': 'সেটিংস',
			'Dark Mode': 'ডার্ক মোড',
			'Light Mode': 'লাইট মোড',
			'Status': 'অবস্থা',
			'How it works': 'এটা কিভাবে কাজ করে',
			'step1_title': '1. একটি ইভেন্ট চয়ন করুন',
			'step1_desc': "আপনার পূর্বাভাসের উপর 'হ্যাঁ' বা 'না' শেয়ার কিনুন। প্রতিক্রিয়া রিয়েল টাইমে পরিবর্তিত হয়।",
			'step2_title': '2. ট্রেড করুন',
			'step2_desc': "আপনার অ্যাকাউন্টে ক্রিপ্টো, ডেবিট কার্ড বা ব্যাঙ্ক ট্রান্সফারের মাধ্যমে ফান্ড যোগ করুন- তারপর আপনি ট্রেড করার জন্য প্রস্তুত।",
			'step3_title': '3. ভাঙান',
			'step3_desc': "যে কোনো সময় আপনার শেয়ার বিক্রি করুন বা $1 এর জন্য বিজয়ী শেয়ার ভাঙানোর জন্য বাজার শেষ হওয়া পর্যন্ত অপেক্ষা করুন।",
			'btn_next': 'পরবর্তী',
			'btn_get_started': 'শুরু করুন'
		},
	},
};

const savedLanguage = localStorage.getItem('language') || 'en';

i18n
	.use(initReactI18next)
	.init({
		resources,
		lng: savedLanguage, // default language from storage
		fallbackLng: 'en',
		interpolation: {
			escapeValue: false, 
		},
	});

export default i18n;

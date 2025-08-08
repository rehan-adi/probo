import { useEffect, useState } from 'react';
import { getAllCategoary } from '@/api/category';

interface Category {
	id: string;
	categoryName: string;
}

interface CategoryNavProps {
	selectedCategoryId: string;
	onCategoryChange: (categoryId: string, categoryName: string) => void;
}

export default function CategoryNav({ selectedCategoryId, onCategoryChange }: CategoryNavProps) {
	const [categories, setCategories] = useState<Category[]>([]);

	useEffect(() => {
		const fetchCategories = async () => {
			try {
				const response = await getAllCategoary();
				setCategories([{ id: 'all', categoryName: 'All Events' }, ...response.data.data]);
			} catch (err) {
				console.error('Error fetching categories:', err);
			}
		};

		fetchCategories();
	}, []);

	return (
		<div className="flex gap-8 mb-4 border-b lg:px-5 border-gray-400/20 pb-2 overflow-x-auto scrollbar-hide">
			{categories.map((cat) => (
				<button
					key={cat.id}
					onClick={() => onCategoryChange(cat.id, cat.categoryName)}
					className={`relative pb-2 md:text-sm text-xs whitespace-nowrap transition-colors duration-200 ${
						selectedCategoryId === cat.id ? 'text-black font-semibold' : 'text-[#545454]'
					}`}
				>
					{cat.categoryName}
					{selectedCategoryId === cat.id && (
						<span className="absolute left-0 right-0 -bottom-[8px] h-[1px] bg-black" />
					)}
				</button>
			))}
		</div>
	);
}

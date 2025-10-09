export interface AICategory {
  id: string;
  title: string;
  category: string;
  categoryType: string;
  image: string;
  isFavorite: boolean;
}

export interface CategoryFilter {
  id: string;
  name: string;
  type: string;
}

export const categoryFilters: CategoryFilter[] = [
  { id: 'all', name: 'All', type: 'all' },
  { id: 'education', name: 'Education', type: 'education' },
  { id: 'work', name: 'Work', type: 'work' },
  { id: 'lifestyle', name: 'Lifestyle', type: 'lifestyle' },
  { id: 'family', name: 'Family', type: 'family' },
  { id: 'relationships', name: 'Relationships', type: 'relationships' },
];

export const aiCategories: AICategory[] = [
  {
    id: '1',
    title: 'Emma',
    category: 'Education',
    categoryType: 'education',
    image: require('@/assets/images/ai/ai-women1.png'),
    isFavorite: false,
  },
  {
    id: '2',
    title: 'Alexander',
    category: 'Work',
    categoryType: 'work',
    image: require('@/assets/images/ai/ai-men1.png'),
    isFavorite: true,
  },
  {
    id: '3',
    title: 'Sophia',
    category: 'Lifestyle',
    categoryType: 'lifestyle',
    image: require('@/assets/images/ai/ai-women2.png'),
    isFavorite: false,
  },
  {
    id: '4',
    title: 'James',
    category: 'Education',
    categoryType: 'education',
    image: require('@/assets/images/ai/ai-men2.png'),
    isFavorite: true,
  },
  {
    id: '5',
    title: 'Isabella',
    category: 'Work',
    categoryType: 'work',
    image: require('@/assets/images/ai/ai-women3.png'),
    isFavorite: false,
  },
  {
    id: '6',
    title: 'Michael',
    category: 'Lifestyle',
    categoryType: 'lifestyle',
    image: require('@/assets/images/ai/ai-men3.png'),
    isFavorite: false,
  },
];

export interface AICategory {
  id: string;
  title: string;
  category: string;
  categoryType: string;
  image: string;
  isFavorite: boolean;
  description: string;
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
    description: 'Ben Emma, eğitim konularında sana yardımcı olmak için buradayım. Öğrenme sürecinde yanında olacağım.',
  },
  {
    id: '2',
    title: 'Alexander',
    category: 'Work',
    categoryType: 'work',
    image: require('@/assets/images/ai/ai-men1.png'),
    isFavorite: true,
    description: 'Ben Alexander, iş konularında sana yardımcı olmak için buradayım. Kariyerinde yanında olacağım.',
  },
  {
    id: '3',
    title: 'Sophia',
    category: 'Lifestyle',
    categoryType: 'lifestyle',
    image: require('@/assets/images/ai/ai-women2.png'),
    isFavorite: false,
    description: 'Ben Sophia, yaşam tarzı konularında sana yardımcı olmak için buradayım. Hayatında yanında olacağım.',
  },
  {
    id: '4',
    title: 'James',
    category: 'Education',
    categoryType: 'education',
    image: require('@/assets/images/ai/ai-men2.png'),
    isFavorite: true,
    description: 'Ben James, eğitim konularında sana yardımcı olmak için buradayım. Öğrenme yolculuğunda yanında olacağım.',
  },
  {
    id: '5',
    title: 'Isabella',
    category: 'Work',
    categoryType: 'work',
    image: require('@/assets/images/ai/ai-women3.png'),
    isFavorite: false,
    description: 'Ben Isabella, iş konularında sana yardımcı olmak için buradayım. Profesyonel hayatında yanında olacağım.',
  },
  {
    id: '6',
    title: 'Michael',
    category: 'Lifestyle',
    categoryType: 'lifestyle',
    image: require('@/assets/images/ai/ai-men3.png'),
    isFavorite: false,
    description: 'Ben Michael, yaşam tarzı konularında sana yardımcı olmak için buradayım. Günlük hayatında yanında olacağım.',
  },
];

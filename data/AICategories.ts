export interface AICategory {
  id: string;
  title: string;
  category: string;
  categoryType: string;
  image: string;
  isFavorite: boolean;
  description: string;
  avatar_id: number;
  voice: string; // OpenAI TTS voice name
}

export interface CategoryFilter {
  id: string;
  name: string;
  type: string;
}

export const categoryFilters: CategoryFilter[] = [
  { id: 'all', name: 'Tümü', type: 'all' },
  { id: 'education', name: 'Eğitim', type: 'education' },
  { id: 'work', name: 'İş', type: 'work' },
  { id: 'lifestyle', name: 'Yaşam Tarzı', type: 'lifestyle' },
  { id: 'family', name: 'Aile', type: 'family' },
  { id: 'relationships', name: 'İlişkiler', type: 'relationships' },
];

export const aiCategories: AICategory[] = [
  {
    id: '1',
    title: 'Emma',
    category: 'Eğitim',
    categoryType: 'education',
    image: require('@/assets/images/ai/ai-women1.png'),
    isFavorite: false,
    description: 'Ben Emma, eğitim konularında sana yardımcı olmak için buradayım. Öğrenme sürecinde yanında olacağım.',
    avatar_id: 1,
    voice: 'fable', // Kadın sesi
  },
  {
    id: '2',
    title: 'Alexander',
    category: 'İş',
    categoryType: 'work',
    image: require('@/assets/images/ai/ai-men1.png'),
    isFavorite: true,
    description: 'Ben Alexander, iş konularında sana yardımcı olmak için buradayım. Kariyerinde yanında olacağım.',
    avatar_id: 2,
    voice: 'alloy', // Erkek sesi
  },
  {
    id: '3',
    title: 'Sophia',
    category: 'Yaşam Tarzı',
    categoryType: 'lifestyle',
    image: require('@/assets/images/ai/ai-women2.png'),
    isFavorite: false,
    description: 'Ben Sophia, yaşam tarzı konularında sana yardımcı olmak için buradayım. Hayatında yanında olacağım.',
    avatar_id: 3,
    voice: 'nova', // Kadın sesi
  },
  {
    id: '4',
    title: 'James',
    category: 'Eğitim',
    categoryType: 'education',
    image: require('@/assets/images/ai/ai-men2.png'),
    isFavorite: true,
    description: 'Ben James, eğitim konularında sana yardımcı olmak için buradayım. Öğrenme yolculuğunda yanında olacağım.',
    avatar_id: 4,
    voice: 'echo', // Erkek sesi
  },
  {
    id: '5',
    title: 'Isabella',
    category: 'İş',
    categoryType: 'work',
    image: require('@/assets/images/ai/ai-women3.png'),
    isFavorite: false,
    description: 'Ben Isabella, iş konularında sana yardımcı olmak için buradayım. Profesyonel hayatında yanında olacağım.',
    avatar_id: 5,
    voice: 'shimmer', // Kadın sesi
  },
  {
    id: '6',
    title: 'Michael',
    category: 'Yaşam Tarzı',
    categoryType: 'lifestyle',
    image: require('@/assets/images/ai/ai-men3.png'),
    isFavorite: false,
    description: 'Ben Michael, yaşam tarzı konularında sana yardımcı olmak için buradayım. Günlük hayatında yanında olacağım.',
    avatar_id: 6,
    voice: 'onyx', // Erkek sesi
  },
];

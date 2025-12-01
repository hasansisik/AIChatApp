export interface AICategory {
  id: string;
  title: string;
  category: string;
  categoryType: string;
  image: string;
  description: string;
  avatar_id: number;
  voice: string; // OpenAI TTS voice name
  video: any; // Normal video source (require path)
  videoTTS: any; // TTS video source (require path)
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
    category: 'ai.categories.lifestyle',
    categoryType: 'lifestyle',
    image: require('@/assets/images/ai/ai-women1.png'),
    description: 'ai.descriptions.emma',
    avatar_id: 1,
    voice: 'alloy', // Kadın sesi
    video: require('@/assets/video/aiexample.mp4'),
    videoTTS: require('@/assets/video/aiexample1.mp4'),
  },
  {
    id: '2',
    title: 'Alexander',
    category: 'ai.categories.education',
    categoryType: 'education',
    image: require('@/assets/images/ai/ai-men1.png'),
    description: 'ai.descriptions.alexander',
    avatar_id: 2,
    voice: 'ash', // Erkek sesi
    video: require('@/assets/video/aiexample.mp4'),
    videoTTS: require('@/assets/video/aiexample1.mp4'),
  },
  {
    id: '3',
    title: 'Sophia',
    category: 'ai.categories.education',
    categoryType: 'education',
    image: require('@/assets/images/ai/ai-women2.png'),
    description: 'ai.descriptions.sophia',
    avatar_id: 3,
    voice: 'shimmer', // Kadın sesi
    video: require('@/assets/video/aiexample.mp4'),
    videoTTS: require('@/assets/video/aiexample1.mp4'),
  },
  {
    id: '4',
    title: 'James',
    category: 'ai.categories.lifestyle',
    categoryType: 'lifestyle',
    image: require('@/assets/images/ai/ai-men2.png'),
    description: 'ai.descriptions.james',
    avatar_id: 4,
    voice: 'onyx', // Erkek sesi
    video: require('@/assets/video/aiexample.mp4'),
    videoTTS: require('@/assets/video/aiexample1.mp4'),
  },
  {
    id: '5',
    title: 'Isabella',
    category: 'ai.categories.work',
    categoryType: 'work',
    image: require('@/assets/images/ai/ai-women3.png'),
    description: 'ai.descriptions.isabella',
    avatar_id: 5,
    voice: 'shimmer', // Kadın sesi
    video: require('@/assets/video/aiexample.mp4'),
    videoTTS: require('@/assets/video/aiexample1.mp4'),
  },
  {
    id: '6',
    title: 'Michael',
    category: 'ai.categories.education',
    categoryType: 'education',
    image: require('@/assets/images/ai/ai-men3.png'),
    description: 'ai.descriptions.michael',
    avatar_id: 6,
    voice: 'onyx', // Erkek sesi
    video: require('@/assets/video/aiexample.mp4'),
    videoTTS: require('@/assets/video/aiexample1.mp4'),
  },
];

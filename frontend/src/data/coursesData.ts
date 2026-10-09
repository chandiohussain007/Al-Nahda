// Images are served from `public/images` (see Phase 5.3). Referenced as URL
// strings so the static `Course.image` field stays a plain `string`.
export const COURSE_IMAGES = {
  tajweed: '/images/course_tajweed_quran_1791457364040.jpg',
  arabic: '/images/course_arabic_manuscript_1791457374795.jpg',
  history: '/images/about_sanctuary_scholars_1791457351969.jpg',
  academy: '/images/hero_islamic_academy_1791457340472.jpg',
} as const;

export interface Course {
  id: string;
  title: string;
  category: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced' | 'All Levels' | 'Beginner to Advanced';
  duration: string;
  instructor: {
    name: string;
    title: string;
    credential: string;
  };
  description: string;
  certificate: boolean;
  image: string;
  studentsEnrolled: number;
  rating: number;
  syllabusHighlights: string[];
}

export const COURSES: Course[] = [
  {
    id: 'tajweed-mastery',
    title: 'Quran Recitation & Tajweed Mastery',
    category: 'Quranic Sciences',
    level: 'Beginner to Advanced',
    duration: '16 Weeks',
    instructor: {
      name: 'Shaykh Ahmad Al-Azhari',
      title: 'Senior Qari & Ijazah Holder',
      credential: 'Ten Qira\'at Sanad, Al-Azhar University',
    },
    description: 'Master the rules of articulation (Makharij) and characteristics (Sifat) with direct one-on-one audio corrective feedback and systematic memorization support.',
    certificate: true,
    image: COURSE_IMAGES.tajweed,
    studentsEnrolled: 1840,
    rating: 4.9,
    syllabusHighlights: [
      'Anatomy of vocal articulation & breath control',
      'Rules of Nun Sakinah, Meem Sakinah, and Madd',
      'Live weekly recitation circles with Ijazah holders',
      'Recorded oral pronunciation diagnostics',
    ],
  },
  {
    id: 'classical-arabic',
    title: 'Classical Arabic & Nahw Grammar',
    category: 'Arabic Language',
    level: 'Intermediate',
    duration: '24 Weeks',
    instructor: {
      name: 'Dr. Fatima Zahra Al-Tunisi',
      title: 'Professor of Classical Linguistics',
      credential: 'PhD in Semitic Philology, Zitouna University',
    },
    description: 'Unlock the linguistic nuances of the Quran and classical texts through systematic study of Nahw, Sarf, and authentic literary prose.',
    certificate: true,
    image: COURSE_IMAGES.arabic,
    studentsEnrolled: 1290,
    rating: 4.95,
    syllabusHighlights: [
      'Morphological patterns (Awzan) and root derivations',
      'Syntactic parsing (I\'rab) of Quranic verses',
      'Classical vocabulary retention frameworks',
      'Direct translation of early classical commentaries',
    ],
  },
  {
    id: 'golden-age-history',
    title: 'Islamic Civilizations & Intellectual History',
    category: 'History & Thought',
    level: 'All Levels',
    duration: '12 Weeks',
    instructor: {
      name: 'Prof. Tariq Al-Baghdadi',
      title: 'Historian & Manuscript Scholar',
      credential: 'Faculty of Islamic Studies, Cambridge & Fes',
    },
    description: 'An immersive historical journey exploring the Golden Age of science, statecraft, philosophy, and architectural splendor from Baghdad to Cordoba.',
    certificate: true,
    image: COURSE_IMAGES.history,
    studentsEnrolled: 960,
    rating: 4.88,
    syllabusHighlights: [
      'The House of Wisdom (Bayt al-Hikmah) translation movement',
      'Scientific breakthroughs in astronomy, medicine, and optics',
      'Andalusian architectural synthesis and cultural co-existence',
      'Historiography through Ibn Khaldun\'s Muqaddimah',
    ],
  },
  {
    id: 'foundations-fiqh',
    title: 'Foundations of Fiqh & Contemporary Ethics',
    category: 'Islamic Law',
    level: 'Beginner',
    duration: '14 Weeks',
    instructor: {
      name: 'Mufti Yahya Al-Qurtubi',
      title: 'Jurisprudence Researcher',
      credential: 'Dar al-Mustafa & Al-Qarawiyyin Graduate',
    },
    description: 'Understand the legal methodology of jurisprudence (Usul al-Fiqh) and its practical application to modern bioethics, technology, and commerce.',
    certificate: true,
    image: COURSE_IMAGES.academy,
    studentsEnrolled: 1420,
    rating: 4.92,
    syllabusHighlights: [
      'Sources of Islamic Law: Quran, Sunnah, Ijma, and Qiyas',
      'Purposes of the Shariah (Maqasid al-Shariah)',
      'Modern ethical dilemmas in digital finance and genetics',
      'Case study deliberations with guided peer review',
    ],
  },
  {
    id: 'hadith-sciences',
    title: 'Sciences of Hadith & Isnad Criticism',
    category: 'Hadith Sciences',
    level: 'Intermediate',
    duration: '18 Weeks',
    instructor: {
      name: 'Shaykha Mariam Al-Dimashqi',
      title: 'Hadith Scholar & Archivist',
      credential: 'Traditional Sanad in Kutub al-Sittah',
    },
    description: 'Study the rigorous historical methodology of transmitter evaluation (Ilm al-Rijal) and the preservation of the Prophet\'s verbal traditions.',
    certificate: true,
    image: COURSE_IMAGES.arabic,
    studentsEnrolled: 810,
    rating: 4.94,
    syllabusHighlights: [
      'Classification of Hadith: Sahih, Hasan, Da\'if, and Mawdu',
      'Principles of Jarh wa Ta\'dil (Transmitter Criticism)',
      'Examination of early manuscript variants and chains',
      'Practical reading of Muwatta Imam Malik',
    ],
  },
  {
    id: 'islamic-finance-principles',
    title: 'Ethical Wealth & Islamic Finance',
    category: 'Economics & Ethics',
    level: 'All Levels',
    duration: '10 Weeks',
    instructor: {
      name: 'Dr. Zaid Al-Farabi',
      title: 'Certified Shariah Advisor (AAOIFI)',
      credential: 'MSc Financial Economics, LSE',
    },
    description: 'Master Shariah-compliant financial contracts, venture structures, estate planning, and ethical investments tailored for modern professionals.',
    certificate: true,
    image: COURSE_IMAGES.tajweed,
    studentsEnrolled: 1150,
    rating: 4.87,
    syllabusHighlights: [
      'Prohibition of Riba, Gharar, and Maysir in practical terms',
      'Mudarabah, Musharakah, and modern Murabaha financing',
      'Screening methodologies for equities and digital assets',
      'Islamic inheritance distribution and Zakat calculation',
    ],
  },
];

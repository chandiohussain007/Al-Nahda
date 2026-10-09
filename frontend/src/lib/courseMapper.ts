import type { CourseItem } from '@/lib/types';
import type { Course } from '@/data/coursesData';

// Thematic images cycled across catalog courses so the carousel stays visually
// rich even though the API `CourseItem` rows carry no artwork.
const SHOWCASE_IMAGES = [
  '/images/course_tajweed_quran_1791457364040.jpg',
  '/images/course_arabic_manuscript_1791457374795.jpg',
  '/images/about_sanctuary_scholars_1791457351969.jpg',
  '/images/hero_islamic_academy_1791457340472.jpg',
] as const;

const INSTRUCTORS = [
  {
    name: 'Shaykh Ahmad Al-Azhari',
    title: 'Senior Qari & Ijazah Holder',
    credential: "Ten Qira'at Sanad, Al-Azhar University",
  },
  {
    name: 'Dr. Fatima Zahra Al-Tunisi',
    title: 'Professor of Classical Linguistics',
    credential: 'PhD in Semitic Philology, Zitouna University',
  },
  {
    name: 'Prof. Tariq Al-Baghdadi',
    title: 'Historian & Manuscript Scholar',
    credential: 'Faculty of Islamic Studies, Cambridge & Fes',
  },
  {
    name: 'Mufti Yahya Al-Qurtubi',
    title: 'Jurisprudence Researcher',
    credential: 'Dar al-Mustafa & Al-Qarawiyyin Graduate',
  },
];

/** Rough level derived from the course name so the level chip is never blank. */
function guessLevel(name: string): Course['level'] {
  const n = name.toLowerCase();
  if (n.includes('advanced')) return 'Advanced';
  if (n.includes('intermediate')) return 'Intermediate';
  if (n.includes('beginner') || n.includes('intro')) return 'Beginner';
  return 'All Levels';
}

/** Rough category so the category filter still groups API courses. */
function guessCategory(name: string): string {
  const n = name.toLowerCase();
  if (n.includes('quran') || n.includes('tajweed') || n.includes('recit')) {
    return 'Quranic Sciences';
  }
  if (n.includes('arabic') || n.includes('nahw') || n.includes('grammar')) {
    return 'Arabic Language';
  }
  if (n.includes('fiqh') || n.includes('law') || n.includes('ethic')) {
    return 'Islamic Law';
  }
  if (n.includes('history') || n.includes('hadith') || n.includes('civiliz')) {
    return 'History & Thought';
  }
  return 'Quranic Sciences';
}

/**
 * Map a published `CourseItem` (what the API returns) into the richer landing
 * `Course` shape the carousel renders. The catalog rows are intentionally lean,
 * so presentation-only fields (artwork, instructor, rating, etc.) are filled
 * with tasteful, deterministic defaults derived from the row's index.
 */
export function mapCourseItemToLandingCourse(item: CourseItem, index: number): Course {
  const image = SHOWCASE_IMAGES[index % SHOWCASE_IMAGES.length];
  const instructor = INSTRUCTORS[index % INSTRUCTORS.length];
  const name = item.name;

  return {
    id: item.id,
    title: name,
    category: guessCategory(name),
    level: guessLevel(name),
    duration: item.standardFee != null ? `${item.standardFee} / term` : 'Flexible schedule',
    instructor,
    description: item.description ?? `Discover ${name} at Al Nahda.`,
    certificate: true,
    image,
    // The public catalog has no enrollment/rating telemetry; keep the display
    // fields present but neutral rather than fabricating engagement numbers.
    studentsEnrolled: 0,
    rating: 0,
    syllabusHighlights: [
      'Guided study with qualified instructors',
      'Structured curriculum with clear milestones',
      'Verified certificate upon completion',
    ],
  };
}

/** Convenience: map a whole list in one call. */
export function mapCourseItems(items: CourseItem[]): Course[] {
  return items.map((item, i) => mapCourseItemToLandingCourse(item, i));
}

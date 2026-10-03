import prismaClient from '@prisma/client';

const { Course, Level, PrismaClient } = prismaClient;

const prisma = new PrismaClient();

const questions = [
  {
    course: Course.LEARN_ARABIC,
    level: Level.BEGINNER,
    question: 'What does the Arabic word "كتاب" (kitaab) mean?',
    options: ['Book', 'Pen', 'Door', 'Chair'],
    correctAnswer: 'Book',
  },
  {
    course: Course.LEARN_ARABIC,
    level: Level.BEGINNER,
    question: 'Which letter is the first letter of the Arabic alphabet?',
    options: ['Alif', 'Ba', 'Ta', 'Meem'],
    correctAnswer: 'Alif',
  },
  {
    course: Course.LEARN_ARABIC,
    level: Level.INTERMEDIATE,
    question: 'What is the plural form of "طالب" (student)?',
    options: ['طلاب', 'طالبين', 'مطالب', 'طالبات'],
    correctAnswer: 'طلاب',
  },
  {
    course: Course.LEARN_ARABIC,
    level: Level.ADVANCED,
    question: 'Which case is used for the direct object in Classical Arabic?',
    options: ['An-nasb (accusative)', 'Al-jarr (genitive)', 'Ar-raf (nominative)', 'Al-jazm'],
    correctAnswer: 'An-nasb (accusative)',
  },
  {
    course: Course.LEARN_QURAN,
    level: Level.BEGINNER,
    question: 'How many surahs are in the Quran?',
    options: ['114', '110', '120', '99'],
    correctAnswer: '114',
  },
  {
    course: Course.LEARN_QURAN,
    level: Level.INTERMEDIATE,
    question: 'Which surah is known as the "Heart of the Quran"?',
    options: ['Yasin', 'Al-Fatihah', 'Al-Kahf', 'Ar-Rahman'],
    correctAnswer: 'Yasin',
  },
  {
    course: Course.LEARN_QURAN,
    level: Level.ADVANCED,
    question: 'In tajweed, what does "Idghaam" describe?',
    options: [
      'Merging a noon sakinah into the following letter',
      'Holding the sound of a letter',
      'Nasalising at the end of a verse',
      'Pausing in the middle of a word',
    ],
    correctAnswer: 'Merging a noon sakinah into the following letter',
  },
];

async function main() {
  for (const question of questions) {
    const existing = await prisma.evaluationQuestion.findFirst({
      where: { question: question.question },
    });

    if (!existing) {
      await prisma.evaluationQuestion.create({ data: question });
    }
  }

  console.log(`Seeded ${questions.length} evaluation questions.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

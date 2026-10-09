'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/landing/Navbar';
import { Hero } from '@/components/landing/Hero';
import { AudioRecitationPlayer } from '@/components/landing/AudioRecitationPlayer';
import { CoursesSection } from '@/components/landing/CoursesSection';
import { FeaturesSection } from '@/components/landing/FeaturesSection';
import { TestimonialsSection } from '@/components/landing/TestimonialsSection';
import { AboutSection } from '@/components/landing/AboutSection';
import { ContactSection } from '@/components/landing/ContactSection';
import { Footer } from '@/components/landing/Footer';
import { DonateModal, EnrollModal } from '@/components/landing/Modals';
import { COURSES, type Course } from '@/data/coursesData';
import { fetchCourses } from '@/lib/api';
import { mapCourseItems } from '@/lib/courseMapper';

export default function HomePage() {
  const router = useRouter();
  const [isDonateOpen, setIsDonateOpen] = useState(false);
  const [selectedCourseForEnroll, setSelectedCourseForEnroll] = useState<Course | null>(null);
  // Start from the curated showcase courses, then swap in the live catalog if
  // the API responds. This keeps the landing page useful even when the backend
  // is unreachable (e.g. offline demo) without ever showing a blank carousel.
  const [courses, setCourses] = useState<Course[]>(COURSES);

  useEffect(() => {
    let cancelled = false;
    fetchCourses()
      .then((items) => {
        if (cancelled || items.length === 0) return;
        setCourses(mapCourseItems(items));
      })
      .catch(() => {
        // Keep the static showcase courses on failure.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleExploreCourses = () => {
    const el = document.getElementById('courses');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const handleLearnMore = () => {
    const el = document.getElementById('about');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8F5EC] dark:bg-[#06131F] text-[#17212B] dark:text-[#F8F5EC] font-sans selection:bg-[#E5D09A] selection:text-[#0B1F33] transition-colors duration-300">
      <Navbar
        onOpenDonate={() => setIsDonateOpen(true)}
        onOpenSignUp={() => router.push('/register')}
      />

      <main className="flex-1">
        <Hero onExploreCourses={handleExploreCourses} onLearnMore={handleLearnMore} />

        <AudioRecitationPlayer />

        <CoursesSection
          onEnrollCourse={(course) => setSelectedCourseForEnroll(course)}
          courses={courses}
        />

        <FeaturesSection onLearnMore={handleLearnMore} />

        <TestimonialsSection />

        <AboutSection />

        <ContactSection />
      </main>

      <Footer
        onOpenDonate={() => setIsDonateOpen(true)}
        onOpenSignUp={() => router.push('/register')}
      />

      <DonateModal isOpen={isDonateOpen} onClose={() => setIsDonateOpen(false)} />

      <EnrollModal
        isOpen={!!selectedCourseForEnroll}
        course={selectedCourseForEnroll}
        onClose={() => setSelectedCourseForEnroll(null)}
      />
    </div>
  );
}

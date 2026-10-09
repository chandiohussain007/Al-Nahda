'use client';

import React, { useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Award, Clock, Star, Search } from 'lucide-react';
import { COURSES, Course } from '@/data/coursesData';
import { useLanguage } from '@/context/LanguageContext';

interface CoursesSectionProps {
  onEnrollCourse: (course: Course) => void;
  /** Live catalog from the API; falls back to the static showcase data. */
  courses?: Course[];
}

export const CoursesSection: React.FC<CoursesSectionProps> = ({ onEnrollCourse, courses }) => {
  const { t, isRtl, language } = useLanguage();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [canScrollLeft, setCanScrollLeft] = useState<boolean>(false);
  const [canScrollRight, setCanScrollRight] = useState<boolean>(true);

  const categories = [
    { id: 'All', label: t.courses.allCategories },
    { id: 'Quranic Sciences', label: language === 'ar' ? 'علوم القرآن والتجويد' : language === 'ur' ? 'قرآنی علوم و تجوید' : 'Quranic Sciences' },
    { id: 'Arabic Language', label: language === 'ar' ? 'اللغة العربية والنحو' : language === 'ur' ? 'عربی زبان و نحو' : 'Arabic Language' },
    { id: 'Islamic Law', label: language === 'ar' ? 'الفقه وأصوله' : language === 'ur' ? 'فقہ و شریعت' : 'Islamic Law' },
    { id: 'History & Thought', label: language === 'ar' ? 'التاريخ والحضارة' : language === 'ur' ? 'تاریخ و تہذیب' : 'History & Thought' },
  ];

  const filteredCourses = (courses ?? COURSES).filter((c) => {
    const matchesCategory =
      selectedCategory === 'All' ||
      c.category === selectedCategory ||
      (selectedCategory === 'Islamic Law' && c.category === 'Economics & Ethics');

    const matchesSearch =
      searchQuery.trim() === '' ||
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.instructor.name.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesCategory && matchesSearch;
  });

  const checkScrollBounds = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setCanScrollLeft(Math.abs(scrollLeft) > 10);
      setCanScrollRight(Math.abs(scrollLeft) + clientWidth < scrollWidth - 10);
    }
  };

  const handleScroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 380;
      const factor = isRtl ? -1 : 1;
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount * factor : scrollAmount * factor,
        behavior: 'smooth',
      });
      setTimeout(checkScrollBounds, 300);
    }
  };

  return (
    <section
      id="courses"
      className="py-20 bg-[#F8F5EC] dark:bg-[#06131F] border-b border-[#DED7C8] dark:border-white/10 transition-colors duration-300"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
          <div>
            <div className="text-xs uppercase font-bold tracking-widest text-[#176B68] dark:text-[#E5D09A] mb-1.5">
              {t.courses.kicker}
            </div>
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-[#0B1F33] dark:text-white tracking-tight">
              {t.courses.title}
            </h2>
            <p className="text-sm md:text-base text-[#17212B]/75 dark:text-gray-300 mt-2 max-w-xl">
              {t.courses.subtitle}
            </p>
          </div>

          {/* Carousel Arrows */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => handleScroll('left')}
              disabled={!canScrollLeft}
              className="w-10 h-10 rounded-full border border-[#DED7C8] dark:border-white/20 bg-white dark:bg-[#0B1F33] text-[#0B1F33] dark:text-white flex items-center justify-center hover:bg-[#E5D09A]/20 hover:border-[#C6A15B] transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-xs cursor-pointer"
              aria-label="Scroll courses left"
            >
              {isRtl ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
            </button>
            <button
              onClick={() => handleScroll('right')}
              disabled={!canScrollRight}
              className="w-10 h-10 rounded-full border border-[#DED7C8] dark:border-white/20 bg-white dark:bg-[#0B1F33] text-[#0B1F33] dark:text-white flex items-center justify-center hover:bg-[#E5D09A]/20 hover:border-[#C6A15B] transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-xs cursor-pointer"
              aria-label="Scroll courses right"
            >
              {isRtl ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          {/* Category Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                  selectedCategory === cat.id
                    ? 'bg-[#0B1F33] dark:bg-[#C6A15B] text-white dark:text-[#0B1F33] shadow-sm font-bold'
                    : 'bg-white dark:bg-[#0B1F33] text-[#17212B]/75 dark:text-gray-300 border border-[#DED7C8] dark:border-white/20 hover:border-[#C6A15B]'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Quick Search */}
          <div className="relative sm:w-64">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 rtl:left-auto rtl:right-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              placeholder={t.courses.searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 rtl:pl-3 rtl:pr-9 py-2 text-xs bg-white dark:bg-[#0B1F33] text-[#17212B] dark:text-white border border-[#DED7C8] dark:border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#176B68]"
            />
          </div>
        </div>

        {/* Horizontally scrollable container (carousel style) */}
        <div
          ref={scrollContainerRef}
          onScroll={checkScrollBounds}
          className="flex gap-6 overflow-x-auto no-scrollbar scroll-smooth py-2 px-1 focus:outline-none"
          tabIndex={0}
          aria-label="Courses carousel"
        >
          {filteredCourses.map((course) => (
            <article
              key={course.id}
              className="w-[310px] sm:w-[350px] md:w-[370px] shrink-0 bg-white dark:bg-[#0B1F33] rounded-xl border border-[#DED7C8] dark:border-[#C6A15B]/30 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden group hover:-translate-y-1"
            >
              {/* Course Image */}
              <div className="relative aspect-[16/10] overflow-hidden bg-[#06131F]">
                <img
                  src={course.image}
                  alt={course.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  referrerPolicy="no-referrer"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

                {/* Badge: Certificate Offered in Gold Light (#E5D09A) */}
                {course.certificate && (
                  <div className="absolute top-3 left-3 rtl:left-auto rtl:right-3 bg-[#E5D09A] text-[#0B1F33] px-2.5 py-1 rounded text-[11px] font-bold tracking-wide flex items-center gap-1 shadow-sm">
                    <Award className="w-3.5 h-3.5 text-[#0B1F33]" />
                    <span>{t.courses.certificateOffered}</span>
                  </div>
                )}

                {/* Duration & Rating */}
                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-[11px] text-white font-medium drop-shadow">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-[#E5D09A]" />
                    {course.duration}
                  </span>
                  <span className="flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 fill-[#C6A15B] text-[#C6A15B]" />
                    {course.rating > 0 ? `\$\{course.rating.toFixed(1)} (\$\{course.studentsEnrolled})` : <span>New</span>}
                  </span>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <div className="text-[11px] font-semibold text-[#176B68] dark:text-[#E5D09A] uppercase tracking-wider mb-1">
                    {course.category}
                  </div>

                  <h3 className="text-lg font-serif font-bold text-[#0B1F33] dark:text-white line-clamp-1 group-hover:text-[#176B68] dark:group-hover:text-[#E5D09A] transition-colors">
                    {course.title}
                  </h3>

                  <p className="text-xs text-[#17212B]/80 dark:text-gray-300 mt-2 line-clamp-3 leading-relaxed">
                    {course.description}
                  </p>

                  <div className="mt-4 pt-3 border-t border-[#DED7C8]/60 dark:border-white/10 flex items-center justify-between text-xs">
                    <div className="truncate mr-2 rtl:mr-0 rtl:ml-2">
                      <span className="font-semibold text-[#0B1F33] dark:text-white">{course.instructor.name}</span>
                      <div className="text-[11px] text-[#A96845] dark:text-[#E5D09A]/80 truncate">{course.instructor.title}</div>
                    </div>
                  </div>
                </div>

                {/* Button: "Enroll Now" in Jade Teal (#176B68) */}
                <div className="mt-5 pt-2">
                  <button
                    onClick={() => onEnrollCourse(course)}
                    type="button"
                    className="w-full py-2.5 px-4 bg-[#176B68] hover:bg-[#125553] text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-all duration-200 shadow-xs hover:shadow-md active:scale-98 cursor-pointer flex items-center justify-center gap-2"
                  >
                    <span>{t.courses.enrollNow}</span>
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>

        {/* Scroll hint */}
        <div className="mt-4 text-center">
          <p className="text-xs text-[#17212B]/50 dark:text-gray-400">
            {t.courses.filterHint}
          </p>
        </div>
      </div>
    </section>
  );
};

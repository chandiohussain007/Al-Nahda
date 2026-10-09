'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

export type Language = 'en' | 'ar' | 'ur' | 'fr';

export interface LanguageInfo {
  code: Language;
  label: string;
  nativeName: string;
  dir: 'ltr' | 'rtl';
}

export const LANGUAGES: LanguageInfo[] = [
  { code: 'en', label: 'English', nativeName: 'English', dir: 'ltr' },
  { code: 'ar', label: 'Arabic', nativeName: 'العربية', dir: 'rtl' },
  { code: 'ur', label: 'Urdu', nativeName: 'اردو', dir: 'rtl' },
  { code: 'fr', label: 'French', nativeName: 'Français', dir: 'ltr' },
];

export const translations = {
  en: {
    // Top Announcement / Hijri
    hijriDate: '26 Rabiʻ al-Thani 1448 AH · Global Academic Term Open',

    // Navigation
    nav: {
      home: 'Home',
      courses: 'Courses',
      features: 'Features',
      about: 'About',
      contact: 'Contact',
      donate: 'Donate',
      signUp: 'Sign Up',
    },

    // Hero
    hero: {
      kicker: 'Traditional Sanad · Modern Pedagogy',
      headline: 'Enlighten Your Mind with Authentic Islamic Education.',
      subheadline: 'Empowering students through a modern, secure, and interactive learning experience.',
      exploreCourses: 'Explore Courses',
      learnMore: 'Learn More',
      statStudents: 'Active Learners',
      statScholars: 'Sanad Scholars',
      statCompletion: 'Course Completion',
      mentorshipBadge: 'Direct Scholar Mentorship',
      accreditedBadge: 'Accredited',
      classicalPedagogy: 'Authentic Classical Pedagogy',
    },

    // Audio Recitation Preview (One More Thing)
    audioFeature: {
      kicker: 'Auditory Learning Studio',
      title: 'Interactive Tajweed Audio Preview',
      subtitle: 'Listen to sample recitation calibrated by Senior Qaris. Practice articulation with real-time audio waveform and speed controls.',
      surahTitle: 'Surat Al-Fatiha (Verses 1-4)',
      reciter: 'Recited by Shaykh Ahmad Al-Azhari (Ten Qira’at Sanad)',
      play: 'Play Sample',
      pause: 'Pause Sample',
      speed: 'Speed',
      listeningTip: 'Note the precise elongation (Madd) and throat articulation (Halaq) in verse 2.',
    },

    // Courses
    courses: {
      kicker: 'Scholarly Curricula',
      title: 'Featured Academic Courses',
      subtitle: 'Authentic sciences structured for modern schedules. Choose your field of study, select authorized instructors, and earn verified credentials.',
      allCategories: 'All',
      filterHint: 'Swipe horizontally or use arrows to discover all pathways.',
      certificateOffered: 'Certificate Offered',
      enrollNow: 'Enroll Now',
      searchPlaceholder: 'Search courses or instructors...',
    },

    // Features
    features: {
      kicker: 'Modern Educational Infrastructure',
      title: 'Designed for Dignified, Rigorous Learning',
      subtitle: 'Every layer of Al Nahda combines traditional pedagogy with clean, robust technology engineered for students, parents, and scholars.',
      secureLms: {
        title: 'Secure LMS',
        desc: 'State-of-the-art security for a safe learning environment.',
        badge: 'Privacy Protected',
        detail: 'Ad-free student portals, encrypted live streams, and COPPA & GDPR compliant child safety protocols.',
      },
      attendance: {
        title: 'Attendance Tracking',
        desc: 'Keep track of your progress and consistency effortlessly.',
        badge: 'Real-time Metrics',
        detail: 'Automated attendance logs, revision reminders, and detailed parental oversight reports.',
      },
      chooseTeacher: {
        title: 'Choose Your Teacher',
        desc: 'Browse profiles and select the instructor that fits your learning style.',
        badge: 'Vetted Sanad',
        detail: 'Review verified teacher certifications, auditory recitation samples, and schedule flexible timezone slots.',
      },
      certificates: {
        title: 'Verified Certificates',
        desc: 'Earn recognized certificates upon course completion.',
        badge: 'Accredited',
        detail: 'Blockchain-backed verifiable credentials with digital seals recognized by partner institutes globally.',
      },
    },

    // Testimonials
    testimonials: {
      kicker: 'Voices of Our Community',
      title: 'Trusted by Families & Scholars Worldwide',
      subtitle: 'Read verified feedback from dedicated students and parents experiencing our secure e-learning portal.',
      parentReview: 'Parent Review',
      studentReview: 'Student Review',
    },

    // About
    about: {
      kicker: 'Our Heritage & Vision',
      title: 'Bridging Traditional Islamic Sciences with Modern E-Learning',
      lead: 'At Al Nahda, we believe authentic sacred knowledge belongs at the intersection of timeless scholarly tradition and state-of-the-art educational technology.',
      paragraph: 'Founded by educators and scholars from renowned institutions, our mission is to eliminate geographic and language barriers. Whether you are a parent seeking safe, foundational Tajweed for your children, or an adult student pursuing classical Arabic syntax and jurisprudence, Al Nahda provides an organized, verified sanctuary for intellectual and spiritual growth.',
      est: 'Est. 1445 AH / 2024 CE',
      imageTag: 'Preserving Classical Excellence',
      imageSub: 'Direct Mentorship in Small Cohorts',
    },

    // Contact
    contact: {
      kicker: 'Admissions & Inquiries',
      title: 'Connect with Academic Advisors',
      subtitle: 'Have questions about course placement or teacher schedules? Our team is honored to assist you.',
      nameLabel: 'Your Name',
      emailLabel: 'Email Address',
      subjectLabel: 'Subject',
      messageLabel: 'Message',
      sendButton: 'Send Message',
      sending: 'Sending In Progress...',
      successTitle: 'Message Received',
      successMessage: 'Your inquiry has been routed to our academic admissions team. We will respond within 24 hours.',
      sendAnother: 'Send Another Message',
      campus: 'Global Campus',
      email: 'Admissions Email',
      phone: 'Direct Line',
    },

    // Footer
    footer: {
      donateTitle: 'Support Our Mission',
      donateDesc: 'Help expand access to classical Islamic knowledge across the globe.',
      donateCta: 'Donate Now',
      joinCta: 'Join as Student',
      bio: 'Al Nahda is a premier global online Islamic institute dedicated to uniting the unbroken scholarly traditions of sacred learning with state-of-the-art virtual education.',
      tagline: 'Authentic Ijazah Curricula · High-Definition Classrooms · Verified Instructors',
      quickLinks: 'Quick Links',
      legal: 'Legal & Policies',
      privacy: 'Privacy Policy',
      terms: 'Terms of Service',
      conduct: 'Student Code of Conduct',
      hours: 'Office Hours',
      hoursText: 'Monday – Saturday\n08:00 – 20:00 UTC',
      backToTop: 'Back to top',
      copyright: 'Al Nahda Online Islamic Education Platform. All rights reserved.',
      motto: 'Dedicated to authentic knowledge, character, and global service.',
    },

    // Theme selector
    theme: {
      system: 'System Theme',
      light: 'Light Mode',
      dark: 'Dark Mode',
    },
  },

  ar: {
    // Top Announcement / Hijri
    hijriDate: '٢٦ ربيع الثاني ١٤٤٨ هـ · الفصل الدراسي الأكاديمي مفتوح الآن',

    // Navigation
    nav: {
      home: 'الرئيسية',
      courses: 'المسارات الدراسية',
      features: 'المميزات',
      about: 'عن المنصة',
      contact: 'اتصل بنا',
      donate: 'تبرع',
      signUp: 'تسجيل حساب',
    },

    // Hero
    hero: {
      kicker: 'سند أصيل · طرائق تعليمية حديثة',
      headline: 'أنِر بصيرتك بتعليم إسلامي رصين وموثوق.',
      subheadline: 'تمكين طلاب العلم حول العالم عبر بيئة تفاعلية آمنة، متطورة، وميسّرة.',
      exploreCourses: 'استكشف المقررات',
      learnMore: 'تعرّف علينا',
      statStudents: 'طالب وطالبة',
      statScholars: 'علماء مجازون بالسند',
      statCompletion: 'نسبة الإتمام الأكاديمي',
      mentorshipBadge: 'تلقٍّ مباشر وملازمة للعلماء',
      accreditedBadge: 'معتمد أكاديمياً',
      classicalPedagogy: 'منهجية علمية أصيلة',
    },

    // Audio Recitation Preview
    audioFeature: {
      kicker: 'استوديو الإقراء السمعي',
      title: 'معاينة تجويدية صوتية تفاعلية',
      subtitle: 'استمع إلى تلاوة نموذجية بإقراء كبار القرّاء المجازين. تدرب على مخارج الحروف مع تحكم مباشر بالسرعة ورسم بياني للصوت.',
      surahTitle: 'سورة الفاتحة (الآيات ١ - ٤)',
      reciter: 'بصوت فضيلة الشيخ أحمد الأزهري (مجاز بالقراءات العشر)',
      play: 'تشغيل المقطع',
      pause: 'إيقاف مؤقت',
      speed: 'السرعة',
      listeningTip: 'لاحظ دقة المد العارض للسكون وتحقيق مخارج حروف الحلق في الآية الكريمة الثانية.',
    },

    // Courses
    courses: {
      kicker: 'العلوم الشرعية واللغوية',
      title: 'المقررات الأكاديمية المميزة',
      subtitle: 'علوم شرعية أصيلة مصممة لتناسب مختلف الأوقات. اختر مجالك وتعلّم على يد مشايخ مجازين ونل شهادات معتمدة.',
      allCategories: 'جميع المسارات',
      filterHint: 'مرر أفقياً أو استخدم الأسهم لاستعراض كافة البرامج الدراسية.',
      certificateOffered: 'شهادة معتمدة متوفرة',
      enrollNow: 'التحق بالبرنامج',
      searchPlaceholder: 'ابحث عن مقرر أو أستاذ...',
    },

    // Features
    features: {
      kicker: 'بنية تقنية وتعليمية حديثة',
      title: 'بيئة مصممة لطلب العلم بوقار وإتقان',
      subtitle: 'تجمع منصة النهضة بين أصالة المحتوى وتطور التقنية لخدمة الطالب والولي والمدرّس.',
      secureLms: {
        title: 'نظام آمن ومحمي',
        desc: 'أعلى معايير الأمان الرقمي لبيئة تعليمية منضبطة وخالية من المشتتات.',
        badge: 'خصوصية تامة',
        detail: 'بوابات خاصة بدون إعلانات، بث مباشر مشفر، وتوافق كامل مع معايير حماية الأطفال الدولية.',
      },
      attendance: {
        title: 'متابعة الحضور والإنجاز',
        desc: 'تتبع تقدمك الدراسي والتزامك اليومي بكل يسر وسهولة.',
        badge: 'تقارير فورية',
        detail: 'سجلات حضور آلية، تذكيرات ذكية بالمراجعة الدورية، ولوحة تحكم خاصة لأولياء الأمور.',
      },
      chooseTeacher: {
        title: 'اختر معلّمك المفضل',
        desc: 'تصفح ملفات العلماء واختر من يلائم أسلوبك في التعلم وأوقاتك.',
        badge: 'سند موثق',
        detail: 'اطلع على إجازات المدرسين ومقاطع مسجلة لأدائهم، واختر الحلقات المناسبة لجدولك الزمني.',
      },
      certificates: {
        title: 'شهادات معتمدة وموثقة',
        desc: 'احصل على شهادات موثقة رقمياً ومجازة عند إتمام المقررات بنجاح.',
        badge: 'اعتماد رسمي',
        detail: 'شهادات رقمية مشفرة بختم معتمد مقبولة لدى المعاهد والمؤسسات الإسلامية العالمية.',
      },
    },

    // Testimonials
    testimonials: {
      kicker: 'آراء مجتمعنا المبارك',
      title: 'ثقة الأسر وطلاب العلم حول العالم',
      subtitle: 'شهادات وانطباعات حقيقية من أولياء الأمور والطلاب في تجربتهم مع منصة النهضة.',
      parentReview: 'رأي ولي أمر',
      studentReview: 'رأي طالب علم',
    },

    // About
    about: {
      kicker: 'رؤيتنا ورسالتنا',
      title: 'الربط بين أصالة العلوم الشرعية وحداثة التعليم الإلكتروني',
      lead: 'في منصة النهضة، نؤمن بأن المعرفة الإسلامية الأصيلة تزدهر حين تجتمع عراقة التلقي بالسند مع أحدث تقنيات التعليم الرقمي.',
      paragraph: 'انطلقت المنصة بمبادرة من كوكبة من العلماء والأكاديميين لكسر الحواجز الجغرافية واللغوية. سواء كنت ولي أمر يبحث عن تعليم قرآني آمن لأبنائه، أو طالب علم يبتغي التوسع في علوم النحو والفقه، فإن النهضة تفتح لك أبوابها.',
      est: 'تأسست عام ١٤٤٥ هـ / ٢٠٢٤ م',
      imageTag: 'حفظ التراث بروح العصر',
      imageSub: 'حلقات دراسية مصغرة وملازمة حية',
    },

    // Contact
    contact: {
      kicker: 'القبول والتسجيل',
      title: 'تواصل مع المرشدين الأكاديميين',
      subtitle: 'لديك استفسار حول تحديد المستوى أو جداول المشايخ؟ فريقنا يسعد بخدمتك.',
      nameLabel: 'الاسم الكريم',
      emailLabel: 'البريد الإلكتروني',
      subjectLabel: 'موضوع الاستفسار',
      messageLabel: 'تفاصيل الرسالة',
      sendButton: 'إرسال الرسالة',
      sending: 'جارٍ الإرسال...',
      successTitle: 'تم استلام رسالتكم بنجاح',
      successMessage: 'تم توجيه رسالتكم إلى لجنة القبول الأكاديمي، وسيتم الرد عليكم خلال ٢٤ ساعة بإذن الله.',
      sendAnother: 'إرسال رسالة أخرى',
      campus: 'المقر الأكاديمي الرئيسي',
      email: 'البريد الإلكتروني للقبول',
      phone: 'الاتصال المباشر',
    },

    // Footer
    footer: {
      donateTitle: 'ساهم في رعاية طالب علم',
      donateDesc: 'ساهم في توسيع الوصول إلى علوم الإسلام الأصيلة حول العالم.',
      donateCta: 'تبرع الآن',
      joinCta: 'التحق كطالب',
      bio: 'منصة النهضة صرح تعليمي إسلامي رقمي رائد يجمع بين جلال السند وأصالة المنهج وتقنيات العصر.',
      tagline: 'مناهج معتمدة بالإجازة · فصول دراسية فائقة الدقة · نخبة من العلماء المجازين',
      quickLinks: 'روابط سريعة',
      legal: 'السياسات والشروط',
      privacy: 'سياسة الخصوصية',
      terms: 'شروط الاستخدام',
      conduct: 'ميثاق طالب العلم',
      hours: 'ساعات العمل',
      hoursText: 'من الإثنين إلى السبت\n٠٨:٠٠ – ٢٠:٠٠ بتوقيت غرينتش',
      backToTop: 'العودة للأعلى',
      copyright: 'جميع الحقوق محفوظة لمنصة النهضة للتعليم الإسلامي.',
      motto: 'خدمة للعلم النافع والعمل الصالح وخلق المسلم.',
    },

    // Theme selector
    theme: {
      system: 'وضع النظام',
      light: 'الوضع الفاتح',
      dark: 'الوضع الداكن',
    },
  },

  ur: {
    // Top Announcement / Hijri
    hijriDate: '۲۶ ربیع الثانی ۱۴۴۸ ھ · نیا تعلیمی سال جاری ہے',

    // Navigation
    nav: {
      home: 'ہوم',
      courses: 'کورسز',
      features: 'خصوصیات',
      about: 'ہمارے بارے میں',
      contact: 'رابطہ',
      donate: 'تعاون',
      signUp: 'اکاؤنٹ بنائیں',
    },

    // Hero
    hero: {
      kicker: 'مستند اسناد · جدید تدریسی نظام',
      headline: 'مستند اسلامی علوم سے اپنے ذہن کو روشن کریں۔',
      subheadline: 'جدید، محفوظ اور انٹرایکٹو پلیٹ فارم کے ذریعے طلبہ کی علمی و فکری رہنمائی۔',
      exploreCourses: 'کورسز دیکھیں',
      learnMore: 'مزید جانیے',
      statStudents: 'فعال طلبہ',
      statScholars: 'سند یافتہ اساتذہ',
      statCompletion: 'تکمیل کورس کا تناسب',
      mentorshipBadge: 'اساتذہ سے براہ راست تربیت',
      accreditedBadge: 'تسلیم شدہ',
      classicalPedagogy: 'روایتی علمی طریقہ کار',
    },

    // Audio Recitation Preview
    audioFeature: {
      kicker: 'آڈیو تجوید اسٹوڈیو',
      title: 'انٹرایکٹو تجوید نمونہ سماعت',
      subtitle: 'ماہر قراء کے زیرِ اہتمام قرات سنیں، مخارج حروف اور رفتار کنٹرول کی سہولت کے ساتھ مشق کریں۔',
      surahTitle: 'سورۃ الفاتحہ (آیات ۱ - ۴)',
      reciter: 'قاری شیخ احمد الازہری (عشرہ قراءات سند یافتہ)',
      play: 'تلاوت سنیں',
      pause: 'توقف',
      speed: 'رفتار',
      listeningTip: 'آیت نمبر ۲ میں مد اور حلق کے مخارج کی ادائیگی پر خصوصی غور فرمائیں۔',
    },

    // Courses
    courses: {
      kicker: 'علمی نصاب',
      title: 'منتخب تعلیمی کورسز',
      subtitle: 'جدید تقاضوں کے مطابق کلاسیکی اسلامی علوم۔ اپنے پسندیدہ اساتذہ کا انتخاب کریں اور مستند اسناد حاصل کریں۔',
      allCategories: 'تمام کورسز',
      filterHint: 'تمام کورسز دیکھنے کے لیے دائیں بائیں اسکرول کریں۔',
      certificateOffered: 'سند کی فراہمی',
      enrollNow: 'داخلہ لیں',
      searchPlaceholder: 'کورس یا استاد تلاش کریں...',
    },

    // Features
    features: {
      kicker: 'جدید تعلیمی سہولیات',
      title: 'بامقصد اور باوقار تعلیمی ماحول',
      subtitle: 'النہضہ روایتی اسلامی طریقہ کار کو جدید ٹیکنالوجی کے ساتھ یکجا کرتی ہے۔',
      secureLms: {
        title: 'محفوظ پورٹل',
        desc: 'طلبہ کے لیے محفوظ ترین تعلیمی نظام۔',
        badge: 'رازداری کی ضمانت',
        detail: 'اشتہارات سے پاک، خفیہ لائیو کلاسز اور طلبہ کے تحفظ کا عالمی معیار۔',
      },
      attendance: {
        title: 'حاضری اور پیش رفت',
        desc: 'اپنی تعلیمی پیش رفت کا باآسانی روزانہ جائزہ لیں۔',
        badge: 'براہ راست ریکارڈ',
        detail: 'خودکار حاضری ریکارڈ، دہرائی کی یاد دہانی اور والدین کے لیے رپورٹس۔',
      },
      chooseTeacher: {
        title: 'پسند کے استاد کا انتخاب',
        desc: 'اساتذہ کی پروفائل دیکھ کر اپنی مرضی کے مطابق انتخاب کریں۔',
        badge: 'مستند اسناد',
        detail: 'اساتذہ کے اسناد اور نمونہ تلاوت دیکھیں اور اپنی سہولت کے مطابق وقت چنیں۔',
      },
      certificates: {
        title: 'تصدیق شدہ اسناد',
        desc: 'کورس کی کامیابی پر تسلیم شدہ اسناد حاصل کریں۔',
        badge: 'معیاری سند',
        detail: 'دنیا بھر کے اسلامی اداروں میں قابلِ قبول ڈیجیٹل اسناد۔',
      },
    },

    // Testimonials
    testimonials: {
      kicker: 'ہمارے طلبہ اور والدین کی رائے',
      title: 'دنیا بھر کے خاندانوں کا قابل اعتماد انتخاب',
      subtitle: 'ہمارے محفوظ تعلیمی نظام کے بارے میں والدین اور طلبہ کے حقیقی تاثرات۔',
      parentReview: 'والدین کا تاثر',
      studentReview: 'طالب علم کا تاثر',
    },

    // About
    about: {
      kicker: 'ہمارا مشن اور وژن',
      title: 'روایتی اسلامی علوم اور جدید ای لرننگ کا سنگم',
      lead: 'النہضہ میں ہمارا عزم ہے کہ مستند دینی علوم کو اعلیٰ ترین جدید ٹیکنالوجی کے ساتھ پیش کیا جائے۔',
      paragraph: 'یہ پلیٹ فارم جغرافیائی اور لسانی فاصلے ختم کرنے کے لیے قائم کیا گیا ہے تاکہ ہر شخص کو گھر بیٹھے بہترین اساتذہ میسر ہوں۔',
      est: 'قیام ۱۴۴۵ھ / ۲۰۲۴ء',
      imageTag: 'کلاسیکی روایت کا تحفظ',
      imageSub: 'چھوٹے گروپس میں براہ راست رہنمائی',
    },

    // Contact
    contact: {
      kicker: 'داخلہ و رہنمائی',
      title: 'تعلیمی مشیروں سے رابطہ کریں',
      subtitle: 'داخلے، فیس یا اسکالرشپ کے متعلق کسی بھی سوال کے لیے ہم حاضر ہیں۔',
      nameLabel: 'آپ کا نام',
      emailLabel: 'ای میل پتہ',
      subjectLabel: 'عنوان',
      messageLabel: 'پیغام',
      sendButton: 'پیغام بھیجیں',
      sending: 'ارسال ہو رہا ہے...',
      successTitle: 'پیغام موصول ہو گیا',
      successMessage: 'آپ کا پیغام داخلہ کمیٹی کو پہنچ گیا ہے، ہم جلد رابطہ کریں گے۔',
      sendAnother: 'نیا پیغام بھیجیں',
      campus: 'گلوبل کیمپس',
      email: 'ای میل برائے داخلہ',
      phone: 'براہ راست فون',
    },

    // Footer
    footer: {
      donateTitle: 'ہمارے تعلیمی مشن میں معاون بنیں',
      donateDesc: 'دنیا بھر میں مستند اسلامی علوم تک رسائی بڑھانے میں تعاون کریں۔',
      donateCta: 'ابھی تعاون کریں',
      joinCta: 'بطور طالب علم داخلہ لیں',
      bio: 'النہضہ ایک عالمی آن لائن تعلیمی ادارہ ہے جو مستند اسناد اور جدید ٹیکنالوجی کا امتزاج ہے۔',
      tagline: 'مستند نصاب · ایچ ڈی کلاس رومز · سند یافتہ اساتذہ',
      quickLinks: 'فوری روابط',
      legal: 'قوانین و ضوابط',
      privacy: 'پرائیویسی پالیسی',
      terms: 'شرائط و ضوابط',
      conduct: 'طالب علم کے ضوابط',
      hours: 'اوقاتِ کار',
      hoursText: 'پیر تا ہفتہ\nصبح ۸ تا رات ۸ بجے UTC',
      backToTop: 'اوپر جائیں',
      copyright: 'النہضہ پلیٹ فارم۔ جملہ حقوق محفوظ ہیں۔',
      motto: 'خدمتِ علم اور کردار سازی کے لیے وقف۔',
    },

    theme: {
      system: 'سسٹم کے مطابق',
      light: 'روشن موڈ',
      dark: 'ڈارک موڈ',
    },
  },

  fr: {
    // Top Announcement / Hijri
    hijriDate: '26 Rabiʻ al-Thani 1448 AH · Semestre académique mondial ouvert',

    // Navigation
    nav: {
      home: 'Accueil',
      courses: 'Formations',
      features: 'Avantages',
      about: 'À propos',
      contact: 'Contact',
      donate: 'Faire un don',
      signUp: 'S\'inscrire',
    },

    // Hero
    hero: {
      kicker: 'Tradition Authentique · Pédagogie Moderne',
      headline: 'Éclairez votre esprit avec un enseignement islamique authentique.',
      subheadline: 'Accompagner les étudiants grâce à une expérience d\'apprentissage moderne, sécurisée et interactive.',
      exploreCourses: 'Explorer les cours',
      learnMore: 'En savoir plus',
      statStudents: 'Étudiants actifs',
      statScholars: 'Savants accrédités',
      statCompletion: 'Taux de réussite',
      mentorshipBadge: 'Mentorat direct par des savants',
      accreditedBadge: 'Accrédité',
      classicalPedagogy: 'Pédagogie classique rigoureuse',
    },

    // Audio Recitation Preview
    audioFeature: {
      kicker: 'Studio d\'apprentissage audio',
      title: 'Aperçu audio interactif de Tajweed',
      subtitle: 'Écoutez un extrait de récitation guidé par des maîtres qualifiés. Pratiquez l\'articulation avec forme d\'onde et contrôle de vitesse.',
      surahTitle: 'Sourate Al-Fatiha (Versets 1-4)',
      reciter: 'Récité par Shaykh Ahmad Al-Azhari (Titulaire de Sanad des 10 lectures)',
      play: 'Écouter l\'extrait',
      pause: 'Mettre en pause',
      speed: 'Vitesse',
      listeningTip: 'Observez la précision de l\'élongation (Madd) et l\'articulation de la gorge au verset 2.',
    },

    // Courses
    courses: {
      kicker: 'Cursus Académiques',
      title: 'Formations d\'Excellence',
      subtitle: 'Des sciences traditionnelles adaptées aux emplois du temps modernes. Choisissez vos enseignants autorisés et obtenez des certificats reconnus.',
      allCategories: 'Tous les cours',
      filterHint: 'Faites défiler horizontalement ou utilisez les flèches pour découvrir les programmes.',
      certificateOffered: 'Certificat délivré',
      enrollNow: 'S\'inscrire',
      searchPlaceholder: 'Rechercher un cours ou un professeur...',
    },

    // Features
    features: {
      kicker: 'Infrastructure Éducative Moderne',
      title: 'Conçu pour un Apprentissage Rigoureux et Digne',
      subtitle: 'Al Nahda associe la rigueur traditionnelle aux technologies modernes pour les étudiants, parents et professeurs.',
      secureLms: {
        title: 'Plateforme Sécurisée',
        desc: 'Une sécurité de pointe pour un environnement d\'apprentissage sain.',
        badge: 'Protection Privée',
        detail: 'Portail sans publicité, flux vidéo chiffrés et respect strict des normes de protection des mineurs.',
      },
      attendance: {
        title: 'Suivi de l\'Assiduité',
        desc: 'Suivez vos progrès et votre régularité en toute simplicité.',
        badge: 'Données en direct',
        detail: 'Historique de présence automatisé, rappels de révision et rapports pour les parents.',
      },
      chooseTeacher: {
        title: 'Choisissez votre Professeur',
        desc: 'Consultez les profils et sélectionnez l\'enseignant qui convient à votre rythme.',
        badge: 'Sanad Vérifié',
        detail: 'Certifications vérifiées, extraits de récitation audio et créneaux horaires flexibles.',
      },
      certificates: {
        title: 'Certificats Vérifiés',
        desc: 'Obtenez des certifications reconnues dès la fin du cursus.',
        badge: 'Accrédité',
        detail: 'Diplômes numériques infalsifiables reconnus par nos instituts partenaires dans le monde.',
      },
    },

    // Testimonials
    testimonials: {
      kicker: 'Témoignages',
      title: 'La confiance des familles et des étudiants',
      subtitle: 'Découvrez les retours authentiques de notre communauté d\'apprentissage mondiale.',
      parentReview: 'Avis Parent',
      studentReview: 'Avis Étudiant',
    },

    // About
    about: {
      kicker: 'Notre Histoire & Vision',
      title: 'Allier les Sciences Islamiques Traditionnelles au E-Learning Moderne',
      lead: 'Chez Al Nahda, nous croyons que le savoir sacré se transmet avec excellence à la croisée de la tradition et de la technologie.',
      paragraph: 'Fondée par des universitaires et savants renommés, notre mission est de supprimer les barrières géographiques. Que vous soyez un parent cherchant un enseignement sécurisé pour vos enfants ou un adulte approfondissant l\'arabe et le droit, Al Nahda est votre sanctuaire d\'apprentissage.',
      est: 'Fondé en 1445 H / 2024',
      imageTag: 'Excellence Classique',
      imageSub: 'Mentorat direct en petits groupes',
    },

    // Contact
    contact: {
      kicker: 'Admissions & Renseignements',
      title: 'Contactez nos conseillers académiques',
      subtitle: 'Des questions sur le niveau d\'entrée ou les horaires ? Notre équipe est à votre entière disposition.',
      nameLabel: 'Votre Nom',
      emailLabel: 'Adresse E-mail',
      subjectLabel: 'Sujet',
      messageLabel: 'Message',
      sendButton: 'Envoyer le message',
      sending: 'Envoi en cours...',
      successTitle: 'Message Reçu',
      successMessage: 'Votre demande a été transmise à notre service des admissions. Nous répondrons dans les 24 heures.',
      sendAnother: 'Envoyer un autre message',
      campus: 'Campus Mondial',
      email: 'E-mail Admissions',
      phone: 'Ligne directe',
    },

    // Footer
    footer: {
      donateTitle: 'Soutenez Notre Mission',
      donateDesc: 'Aidez-nous à élargir l’accès au savoir islamique authentique dans le monde.',
      donateCta: 'Faire un don',
      joinCta: 'Rejoindre l\'académie',
      bio: 'Al Nahda est un institut islamique en ligne de référence alliant la noblesse de la transmission par Sanad et l\'excellence numérique.',
      tagline: 'Cursus avec Ijaza · Classes virtuelles HD · Savants certifiés',
      quickLinks: 'Liens rapides',
      legal: 'Mentions Légales',
      privacy: 'Politique de confidentialité',
      terms: 'Conditions d\'utilisation',
      conduct: 'Code de conduite étudiant',
      hours: 'Horaires d\'ouverture',
      hoursText: 'Lundi – Samedi\n08:00 – 20:00 UTC',
      backToTop: 'Haut de page',
      copyright: 'Al Nahda Online Islamic Education Platform. Tous droits réservés.',
      motto: 'Dédié au savoir authentique, à l\'éthique et au service mondial.',
    },

    theme: {
      system: 'Thème Système',
      light: 'Mode Clair',
      dark: 'Mode Sombre',
    },
  },
};

interface LanguageContextType {
  language: Language;
  languageInfo: LanguageInfo;
  setLanguage: (lang: Language) => void;
  t: typeof translations['en'];
  isRtl: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Default to English during SSR/hydration; the saved preference is restored
  // right after mount so server and client markup match (Next.js requirement).
  const [language, setLanguageState] = useState<Language>('en');

  useEffect(() => {
    const saved = localStorage.getItem('alnahda_language');
    if (saved === 'en' || saved === 'ar' || saved === 'ur' || saved === 'fr') {
      setLanguageState(saved);
      return;
    }
    // Check navigator language
    if (typeof navigator !== 'undefined' && navigator.language) {
      if (navigator.language.startsWith('ar')) setLanguageState('ar');
      else if (navigator.language.startsWith('ur')) setLanguageState('ur');
      else if (navigator.language.startsWith('fr')) setLanguageState('fr');
    }
  }, []);

  const languageInfo = LANGUAGES.find((l) => l.code === language) || LANGUAGES[0];
  const isRtl = languageInfo.dir === 'rtl';

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('lang', language);
    root.setAttribute('dir', languageInfo.dir);
    if (isRtl) {
      root.classList.add('rtl');
    } else {
      root.classList.remove('rtl');
    }
  }, [language, languageInfo.dir, isRtl]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('alnahda_language', lang);
  };

  const t = translations[language] || translations.en;

  return (
    <LanguageContext.Provider value={{ language, languageInfo, setLanguage, t, isRtl }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

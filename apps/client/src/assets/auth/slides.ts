import auth1 from '@/assets/auth/auth1.png';
import auth2 from '@/assets/auth/auth2.png';
import auth3 from '@/assets/auth/auth3.png';
import auth4 from '@/assets/auth/auth4.png';

export interface AuthSlide {
  id: string;
  title: string;
  description: string;
  image: string;
  tagline?: string;
}

/**
 * Manage auth carousel slides here.
 * Add or re-order images and copy for the login/register carousel.
 */
export const authCarouselSlides: AuthSlide[] = [
  {
    id: 'explore-ux',
    title: 'Explore screens. Understand UX.',
    description: 'Explore real products with UX insights, principles and context built into every screen.',
    image: auth1,
  },
  {
    id: 'benchmark-vault',
    title: 'Benchmark against market leaders.',
    description: 'Discover conversion-tested patterns, heuristics and interaction teardowns from the world’s best apps.',
    image: auth2,
  },
  {
    id: 'design-decisions',
    title: 'Where Great Design Makes Sense.',
    description: 'Deconstruct complex user flows, onboarding journeys, and checkout patterns with deep reasoning.',
    image: auth3,
  },
  {
    id: 'collaborative-canvas',
    title: 'Organize, annotate & collaborate.',
    description: 'Save reference screens to interactive boards, invite teammates, and craft production-ready interfaces.',
    image: auth4,
  },
];

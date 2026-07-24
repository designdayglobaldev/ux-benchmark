import logoImg from '@/assets/app/logo.png'
import screenImg from '@/assets/app/screen.png'

export type AppStatus = 'LIVE' | 'DRAFT'

export interface MockApp {
  id: string
  categoryId: string
  categoryName: string
  name: string
  slug: string
  appLogo: string
  appThumbnail: string
  status: AppStatus
  isStaffPick: boolean
  sourceUrl: string
  description: string
  platform: string[]
  tags: string[]
  palette: string[]
  visualUiTags: string[]
  visualUiText: string
  experienceUxTags: string[]
  experienceUxText: string
  lookAndFeelTags: string[]
  lookAndFeelText: string
  easeOfUseTags: string[]
  easeOfUseText: string
  contentClarityTags: string[]
  contentClarityText: string
  trustTags: string[]
  trustText: string
  accessibilityTags: string[]
  accessibilityText: string
  takeawayText: string
}

export const mockApps: MockApp[] = [
  {
    id: '1',
    categoryId: 'cat-finance',
    categoryName: 'Finance',
    name: 'Revolut',
    slug: 'revolut',
    appLogo: logoImg,
    appThumbnail: screenImg,
    status: 'LIVE',
    isStaffPick: true,
    sourceUrl: '/products/revolut',
    description: 'A dark, precise money super-app that treats your finances like a live dashboard, every currency, card, and account controllable in a tap.',
    platform: ['iOS', 'Android'],
    tags: ['Finance', 'Management'],
    palette: ['#000000', '#1C2BFF', '#7A80FE', '#FFFFFF', '#00E5C0'],
    visualUiTags: ['Dark mode canvas', 'Electric signature accents'],
    visualUiText: 'Cool, premium, high-contrast.',
    experienceUxTags: ['Action-first UI', 'Data visualization driven'],
    experienceUxText: 'Soft, reserved, secure. Less discovery, more utility-heavy.',
    lookAndFeelTags: ['Dark & sleek', 'Neon accents', 'Data-focused'],
    lookAndFeelText: 'A near-black canvas with a single electric-indigo signature makes balances and charts glow.',
    easeOfUseTags: ['Tab bar navigation', 'Dense but clear'],
    easeOfUseText: 'A massive list of features packed into tab navigation. It relies on layout to prevent clutter.',
    contentClarityTags: ['Direct', 'Number-heavy'],
    contentClarityText: 'Copy is short, numbers are highly legible. Great use of hierarchy for the most important data.',
    trustTags: ['Bank-grade', 'Secure visuals'],
    trustText: 'Real-time status notifications, crisp feature releases, and biometric protection.',
    accessibilityTags: ['High contrast', 'Clear hierarchy'],
    accessibilityText: 'Excellent contrast ratios. The dark theme is actually easier to read due to high-contrast neons.',
    takeawayText: 'Revolut proves that massive utility - from currency to cards - can be packed into a terminal-like interface without losing the premium feel.'
  }
]

import {
  LayoutDashboard,
  Smartphone,
  Layers,
  GitBranch,
  FolderTree,
  Component,
  Puzzle,
  Settings,
  HelpCircle,
  Monitor,
  Bell,
  Palette,
  Wrench,
  UserCog,
  AudioWaveform,
  Command,
  GalleryVerticalEnd,
  Users,
  MessageSquare,
} from 'lucide-react'
import { type SidebarData } from '../types'

export const sidebarData: SidebarData = {
  user: {
    name: 'admin',
    email: 'admin@designday.io',
    avatar: '/avatars/shadcn.jpg',
  },
  teams: [
    {
      name: 'Admin Panel',
      logo: Command,
      plan: 'Vite + ShadcnUI',
    },
    {
      name: 'Acme Inc',
      logo: GalleryVerticalEnd,
      plan: 'Enterprise',
    },
    {
      name: 'Acme Corp.',
      logo: AudioWaveform,
      plan: 'Startup',
    },
  ],
  navGroups: [
    {
      title: 'Content Management',
      items: [
        {
          title: 'Dashboard',
          url: '/',
          icon: LayoutDashboard,
        },
        {
          title: 'Apps',
          url: '/apps',
          icon: Smartphone,
        },
        {
          title: 'Screens',
          url: '/screens',
          icon: Layers,
        },
        {
          title: 'Flows',
          url: '/flows',
          icon: GitBranch,
        },
      ],
    },
    {
      title: 'Taxonomy',
      items: [
        {
          title: 'Categories',
          url: '/categories',
          icon: FolderTree,
        },
        {
          title: 'Subcategories',
          url: '/subcategories',
          icon: FolderTree,
        },
        {
          title: 'UI Elements',
          url: '/ui-elements',
          icon: Component,
        },
        {
          title: 'Patterns',
          url: '/patterns',
          icon: Puzzle,
        },
      ],
    },
    {
      title: 'Other',
      items: [
        {
          title: 'App Requests',
          url: '/app-requests',
          icon: MessageSquare,
        },
        {
          title: 'Users',
          url: '/users',
          icon: Users,
        },
        {
          title: 'Settings',
          icon: Settings,
          items: [
            {
              title: 'Profile',
              url: '/settings',
              icon: UserCog,
            },
            {
              title: 'Account',
              url: '/settings/account',
              icon: Wrench,
            },
            {
              title: 'Appearance',
              url: '/settings/appearance',
              icon: Palette,
            },
            {
              title: 'Notifications',
              url: '/settings/notifications',
              icon: Bell,
            },
            {
              title: 'Display',
              url: '/settings/display',
              icon: Monitor,
            },
          ],
        },
        {
          title: 'Staff Management',
          url: '/staff',
          icon: UserCog,
        },
        {
          title: 'Help Center',
          url: '/help-center',
          icon: HelpCircle,
        },
      ],
    },
  ],
}

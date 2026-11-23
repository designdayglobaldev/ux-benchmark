/**
 * Arm C-lite Component Alias Dictionary
 * Constructed purely from standard design systems (Material Design 3 & iOS HIG)
 * and existing database UiElement slugs.
 *
 * NOTE: As required by the specification, this vocabulary is independent of the benchmark
 * queries to prevent evaluation data leakage.
 */

export interface ComponentDefinition {
  canonicalSlug: string;
  title: string;
  weight: number; // Inverse screen frequency weight (1.0 for rare, 0.0 for generic >20%)
  aliases: string[];
}

export const COMPONENT_DICTIONARY: ComponentDefinition[] = [
  // 1. Rare / Specialized controls (<5% screen coverage, high informational specificity)
  {
    canonicalSlug: 'slider',
    title: 'Slider',
    weight: 1.0,
    aliases: ['slider', 'sliders', 'range slider', 'seek bar', 'scrubber', 'thumb slider'],
  },
  {
    canonicalSlug: 'stepper',
    title: 'Stepper',
    weight: 1.0,
    aliases: ['stepper', 'steppers', 'step indicator', 'step count', 'increment decrement'],
  },
  {
    canonicalSlug: 'toast',
    title: 'Toast',
    weight: 1.0,
    aliases: ['toast', 'toasts', 'snackbar', 'snackbars', 'toast notification', 'transient banner'],
  },
  {
    canonicalSlug: 'color-picker',
    title: 'Color Picker',
    weight: 1.0,
    aliases: ['color picker', 'color-picker', 'palette', 'swatch', 'color swatch', 'hue picker'],
  },
  {
    canonicalSlug: 'date-picker',
    title: 'Date Picker',
    weight: 0.95,
    aliases: ['date picker', 'datepicker', 'calendar picker', 'date selection', 'calendar modal'],
  },
  {
    canonicalSlug: 'accordion',
    title: 'Accordion',
    weight: 0.95,
    aliases: ['accordion', 'accordions', 'expandable list', 'disclosure panel', 'collapsible panel', 'faq disclosure'],
  },
  {
    canonicalSlug: 'time-picker',
    title: 'Time Picker',
    weight: 0.95,
    aliases: ['time picker', 'timepicker', 'clock picker', 'hour minute selector'],
  },
  {
    canonicalSlug: 'rating-control',
    title: 'Rating Control',
    weight: 0.95,
    aliases: ['rating control', 'star rating', 'rating bar', 'review stars'],
  },
  {
    canonicalSlug: 'tooltip',
    title: 'Tooltip',
    weight: 0.9,
    aliases: ['tooltip', 'tooltips', 'hover tip', 'info popup', 'hint tooltip'],
  },
  {
    canonicalSlug: 'context-menu',
    title: 'Context Menu',
    weight: 0.9,
    aliases: ['context menu', 'long press menu', 'contextual popup', 'overflow popup'],
  },
  {
    canonicalSlug: 'action-sheet',
    title: 'Action Sheet',
    weight: 0.9,
    aliases: ['action sheet', 'actionsheet', 'bottom action sheet', 'activity sheet'],
  },
  {
    canonicalSlug: 'popover',
    title: 'Popover',
    weight: 0.9,
    aliases: ['popover', 'popovers', 'flyout', 'anchored popup'],
  },

  // 2. Medium frequency controls (5% - 15% screen coverage)
  {
    canonicalSlug: 'switch',
    title: 'Switch',
    weight: 0.8,
    aliases: ['switch', 'switches', 'toggle', 'toggles', 'toggle switch', 'on off toggle'],
  },
  {
    canonicalSlug: 'carousel',
    title: 'Carousel',
    weight: 0.8,
    aliases: ['carousel', 'carousels', 'slider banner', 'horizontal carousel', 'image carousel', 'swiping banner'],
  },
  {
    canonicalSlug: 'segmented-control',
    title: 'Segmented Control',
    weight: 0.75,
    aliases: ['segmented control', 'segmented-control', 'segmented button', 'tab switcher', 'pill switcher'],
  },
  {
    canonicalSlug: 'progress-indicator',
    title: 'Progress Indicator',
    weight: 0.75,
    aliases: ['progress indicator', 'progress bar', 'progress stepper', 'linear progress', 'circular progress', 'step header'],
  },
  {
    canonicalSlug: 'empty-state',
    title: 'Empty State',
    weight: 0.75,
    aliases: ['empty state', 'empty view', 'no data state', 'placeholder screen', 'zero state'],
  },
  {
    canonicalSlug: 'radio-button',
    title: 'Radio Button',
    weight: 0.75,
    aliases: ['radio button', 'radio buttons', 'radio option', 'single select'],
  },
  {
    canonicalSlug: 'checkbox',
    title: 'Checkbox',
    weight: 0.75,
    aliases: ['checkbox', 'checkboxes', 'check box', 'multi select box', 'checklist item'],
  },
  {
    canonicalSlug: 'chip',
    title: 'Chip',
    weight: 0.7,
    aliases: ['chip', 'chips', 'filter chip', 'input chip', 'choice chip', 'tag pill'],
  },
  {
    canonicalSlug: 'badge',
    title: 'Badge',
    weight: 0.7,
    aliases: ['badge', 'badges', 'notification pill', 'count badge', 'status badge', 'dot badge'],
  },
  {
    canonicalSlug: 'page-control',
    title: 'Page Control',
    weight: 0.7,
    aliases: ['page control', 'pagination dots', 'dot indicator', 'indicator dots'],
  },
  {
    canonicalSlug: 'search-bar',
    title: 'Search Bar',
    weight: 0.65,
    aliases: ['search bar', 'search field', 'search input', 'searchbox', 'query input'],
  },
  {
    canonicalSlug: 'banner',
    title: 'Banner',
    weight: 0.65,
    aliases: ['banner', 'hero banner', 'promotional banner', 'in-app banner'],
  },

  // 3. Generic Elements (>20% of screens) -> Zero or near-zero weight per spec
  // button, card, icon, top-navigation-bar, divider, stacked-list, avatar, bottom-sheet-modal
  {
    canonicalSlug: 'button',
    title: 'Button',
    weight: 0.0,
    aliases: ['button', 'cta', 'action button'],
  },
  {
    canonicalSlug: 'card',
    title: 'Card',
    weight: 0.0,
    aliases: ['card', 'cards', 'card view'],
  },
  {
    canonicalSlug: 'icon',
    title: 'Icon',
    weight: 0.0,
    aliases: ['icon', 'icons', 'glyph'],
  },
  {
    canonicalSlug: 'top-navigation-bar',
    title: 'Top Navigation Bar',
    weight: 0.0,
    aliases: ['top navigation bar', 'app bar', 'header bar', 'nav bar'],
  },
  {
    canonicalSlug: 'divider',
    title: 'Divider',
    weight: 0.0,
    aliases: ['divider', 'separator', 'hairline'],
  },
  {
    canonicalSlug: 'stacked-list',
    title: 'Stacked List',
    weight: 0.0,
    aliases: ['stacked list', 'list view', 'table list', 'menu list'],
  },
  {
    canonicalSlug: 'avatar',
    title: 'Avatar',
    weight: 0.0,
    aliases: ['avatar', 'profile icon', 'user picture'],
  },
  {
    canonicalSlug: 'bottom-sheet-modal',
    title: 'Bottom Sheet/Modal',
    weight: 0.0,
    aliases: ['bottom sheet', 'modal sheet', 'modal dialog', 'bottom sheet modal'],
  },
];


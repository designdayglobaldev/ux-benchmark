import { prisma } from './src/db/prisma';

const uiElements = [
  // NAVIGATION & STRUCTURE
  "Tab Bar", "Top Navigation Bar", "Toolbar", "Sidebar / Side Navigation", "Drawer", "Breadcrumbs", "Pagination", "Page Control", "Table of Contents", "Tree", "Accordion", "Divider", "Segmented Control",
  
  // ACTIONS & CONTROLS
  "Button", "Icon", "Chip", "Switch", "Checkbox", "Radio Button", "Slider", "Stepper", "Tile", "Rating Control",
  
  // INPUTS & PICKERS
  "Text field", "Text area", "Search Bar", "Combobox", "Date Picker", "Time Picker", "Color Picker", "File Upload", "Command Palette",
  
  // CONTAINERS & CONTENT
  "Card", "Carousel", "Stacked List", "Table", "Banner", "Avatar", "Logo", "Photo", "Illustration", "Map", "Video Player",
  
  // OVERLAYS & MENUS
  "Dialog", "Bottom Sheet/Modal", "Popover", "Tooltip", "Toast", "Context Menu", "Action Sheet",
  
  // STATUS & FEEDBACK
  "Badge", "Status Dot", "Progress Indicator", "Loading Indicator", "Empty State", "Splash Screen"
];

function slugify(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

async function main() {
  for (const title of uiElements) {
    const slug = slugify(title);
    await prisma.uiElement.upsert({
      where: { slug },
      update: { title, status: 'LIVE' },
      create: { title, slug, status: 'LIVE' }
    });
  }
  console.log('Successfully seeded ' + uiElements.length + ' UI elements!');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

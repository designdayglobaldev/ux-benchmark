import { prisma } from './src/db/prisma';

const flows = [
  "Browsing Tutorial", "Creating Account", "Onboarding",
  "Editing Profile", "Deleting & Deactivating Account", "Login", "Logout", "Resetting Password", "Switching Account",
  "Adding to Cart & Bag", "Booking & Reserving", "Cancelling Order & Refunding", "Cancelling Subscription", "Listing", "Purchasing & Ordering", "Redeeming", "Subscribing & Upgrading", "Transferring Money",
  "Banning & Blocking", "Calling", "Chatting & sending Messages", "Commenting & Replying", "Following & Subscribing", "Gifting", "Giving Feedbacks", "Inviting Teammates & Friends", "Joining & Accepting", "Leaving", "Liking & Upvoting", "Muting", "Referring Friends", "Registering", "Reporting", "Requesting", "Reviewing & Rating", "Scheduling", "Sharing",
  "Adding & Creating", "Archiving", "Copying & Duplicating", "Deleting & Removing", "Drawing", "Editing & Updating", "Favoriting & Pinning", "Filtering & Sorting", "Importing & Exporting", "Listening to Audio", "Logging & Tracking", "Marking", "Moving", "Publishing", "Recording Audio & Video", "Reordering", "Saving to Collection", "Scanning", "Searching & Finding", "Selecting & Choosing", "Starting & Completing", "Taking Photos", "Uploading & Downloading", "Watching Video",
  "Changing Language", "Connecting & Linking", "Enabling & Disabling", "Setting Up", "Showing & Hiding", "Switching to Dark Mode", "Switching View", "Turning On/Off", "Verifying"
];

function slugify(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

async function main() {
  for (const name of flows) {
    const slug = slugify(name);
    await prisma.flow.upsert({
      where: { slug },
      update: { name, status: 'LIVE' },
      create: { name, slug, status: 'LIVE' }
    });
  }
  console.log('Successfully seeded ' + flows.length + ' flows!');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

/**
 * Helper to get default image URLs for Hanoi SportZone based on sport types and names.
 */

export const SPORT_IMAGES = {
  football: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=800&q=80", // Football/soccer field
  badminton: "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=800&q=80", // Badminton court & rackets
  tennis: "https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?auto=format&fit=crop&w=800&q=80", // Tennis court & ball
  pickleball: "https://i.pinimg.com/1200x/14/e4/0f/14e40f8add45c16b856c1647038a9d60.jpg", // Pickleball direct image link
  general: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=800&q=80" // General fallback
};

/**
 * Gets the default sport image based on name, description, or explicit sportId.
 */
export function getDefaultSportImage(name: string = "", description: string = "", sportId?: string): string {
  const n = name.toLowerCase();
  const d = description.toLowerCase();

  // 1. Match by sportId if explicitly provided
  if (sportId === "s-1" || sportId === "football" || sportId === "soccer") {
    return SPORT_IMAGES.football;
  }
  if (sportId === "s-2" || sportId === "badminton") {
    return SPORT_IMAGES.badminton;
  }
  if (sportId === "s-3" || sportId === "pickleball") {
    return SPORT_IMAGES.pickleball;
  }
  if (sportId === "s-4" || sportId === "tennis") {
    return SPORT_IMAGES.tennis;
  }

  // 2. Match by keywords in name or description
  if (n.includes("cầu lông") || n.includes("badminton") || d.includes("cầu lông") || d.includes("badminton")) {
    return SPORT_IMAGES.badminton;
  }
  if (n.includes("bóng đá") || n.includes("football") || n.includes("soccer") || n.includes("sân cỏ") || d.includes("bóng đá") || d.includes("football") || d.includes("soccer") || d.includes("sân cỏ")) {
    return SPORT_IMAGES.football;
  }
  if (n.includes("pickleball") || n.includes("pickle") || d.includes("pickleball") || d.includes("pickle")) {
    return SPORT_IMAGES.pickleball;
  }
  if (n.includes("tennis") || n.includes("quần vợt") || d.includes("tennis") || d.includes("quần vợt")) {
    return SPORT_IMAGES.tennis;
  }

  // Fallback to general sport image
  return SPORT_IMAGES.general;
}

/**
 * Returns whether a given image URL is a placeholder or default image that can be replaced
 * by a more specific sport image once courts are added.
 */
export function isPlaceholderImage(url: string = ""): boolean {
  if (!url) return true;
  // If it's the general default image, it can be replaced with sport-specific default images
  return url === SPORT_IMAGES.general;
}

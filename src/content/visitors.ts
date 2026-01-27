export type VisitorConfig = {
  id: string;
  name: string;
  greeting: string;
  message: string;
  emojiRain?: string; // Optional emoji to rain down
  hideAsciiNoise?: boolean; // Hide the ASCII background for this visitor
};

// Visitor configurations keyed by URL parameter
export const visitors: Record<string, VisitorConfig> = {
  silas: {
    id: "silas",
    name: "Silas",
    greeting: "Hey Silas!",
    message: "Thanks for checking out my portfolio. I've put together some of my recent work for you to explore. You can either browse the projects normally, or if you'd prefer, I can walk you through them in presentation mode.",
  },
  ratpack: {
    id: "ratpack",
    name: "Rat Pack",
    greeting: "Welcome, Rat Pack!",
    message: "You've unlocked rat mode. Browse the projects like a normal human, or embrace your inner rodent and scurry through presentation mode. The choice is yours, fellow rat.",
    emojiRain: "🐀",
    hideAsciiNoise: true,
  },
};

export function getVisitor(id: string | undefined): VisitorConfig | null {
  if (!id) return null;
  return visitors[id.toLowerCase()] ?? null;
}

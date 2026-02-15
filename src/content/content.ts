import pagesJson from './generated/pages.json';
import aiEvolutionCardsJson from './generated/ai-evolution-cards.json';
import aigGatewayNodesJson from './generated/aig-gateway-nodes.json';
import productsJson from './generated/products.json';
import eventsJson from './generated/events.json';
import hackathonsJson from './generated/hackathons.json';
import universityCollaborationsJson from './generated/university-collaborations.json';
import publicationsJson from './generated/publications.json';

import type { PublicationVenueLocation, UniversityCollaborationLocation } from '../types';

export type PageCopyEntry = { text: string; iconKey?: string };
export type PageCopyMap = Record<string, PageCopyEntry>;

export type AppContent = {
  pages: {
    landing: PageCopyMap;
    mcProducts: PageCopyMap;
    topicLanding: PageCopyMap;
    topicSidebar: PageCopyMap;
    eventsHackathons: PageCopyMap;
    aigGateway: PageCopyMap;
    app: PageCopyMap;
  };
  aiEvolutionCards: Array<{ id: string; title: string; description: string; accent: string; iconKey: string }>;
  aigGatewayNodes: Array<{ id: string; title: string; subtitle: string; tint: string; iconKey: string }>;
  products: Array<{ id: string; label: string; iconKey: string }>;
  events: Array<{ name: string; destination: string; description: string; link: string; imagePath: string; year?: number }>;
  hackathons: Array<{ name: string; destination: string; description: string; link: string; imagePath: string; position?: string }>;
  universityCollaborations: UniversityCollaborationLocation[];
  publications: PublicationVenueLocation[];
};

export const content: AppContent = {
  pages: pagesJson,
  aiEvolutionCards: aiEvolutionCardsJson,
  aigGatewayNodes: aigGatewayNodesJson,
  products: productsJson,
  events: eventsJson,
  hackathons: hackathonsJson,
  universityCollaborations: universityCollaborationsJson,
  publications: publicationsJson as unknown as PublicationVenueLocation[]
};

export function formatTemplate(text: string, vars: Record<string, string>): string {
  let out = text;
  for (const [key, value] of Object.entries(vars)) {
    const token = `{{${key}}}`;
    out = out.split(token).join(value);
  }
  return out;
}

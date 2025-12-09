import { AgentRouletteDisplay } from '@/components/agent-roulette-display';
import { ValorantIcon } from '@/components/icons/valorant-icon';
import { type ValorantAgent } from '@/lib/types';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal } from 'lucide-react';

async function getAgents(): Promise<ValorantAgent[]> {
  try {
    const response = await fetch('https://valorant-api.com/v1/agents?isPlayableCharacter=true', { next: { revalidate: 2592000 } }); // Revalidate once a month (30 days)
    if (!response.ok) {
      console.error('Failed to fetch agents:', response.statusText);
      return [];
    }
    const data = await response.json();
    return data.data.filter((agent: ValorantAgent) => agent.fullPortraitV2 && agent.role && agent.abilities.length > 3);
  } catch (error) {
    console.error('Error fetching agents:', error);
    return [];
  }
}

export default async function Home() {
  const agents = await getAgents();

  return (
    <div className="relative min-h-screen w-full bg-background overflow-x-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/5 via-background to-background dark:from-primary/10"></div>
      <main className="container relative z-10 mx-auto flex min-h-screen flex-col items-center justify-center p-4 text-center">
        <header className="mb-8 max-w-4xl">
          <div className="flex items-center justify-center gap-4">
            <ValorantIcon className="h-10 w-10 text-primary sm:h-12 sm:w-12" />
            <h1 className="font-headline text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl">
              Valo Agent Roulette
            </h1>
          </div>
          <p className="mt-4 text-muted-foreground md:text-lg">
            Let fate choose your next agent. Spin the roulette to get a random agent suggestion for your next match.
          </p>
        </header>

        {agents.length > 0 ? (
          <AgentRouletteDisplay agents={agents} />
        ) : (
          <Alert variant="destructive" className="max-w-md">
            <Terminal className="h-4 w-4" />
            <AlertTitle>Could Not Load Agents</AlertTitle>
            <AlertDescription>
              There was an issue fetching agent data from the Valorant API. Please try refreshing the page later.
            </AlertDescription>
          </Alert>
        )}
        
        <footer className="absolute bottom-4 text-xs text-muted-foreground">
          Valorant agent data provided by{' '}
          <a href="https://valorant-api.com/" target="_blank" rel="noopener noreferrer" className="underline hover:text-primary">
            valorant-api.com
          </a>
          . This app is not affiliated with Riot Games.
        </footer>
      </main>
    </div>
  );
}

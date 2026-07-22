import { AgentRouletteDisplay } from '@/components/agent-roulette-display';
import { ValorantIcon } from '@/components/icons/valorant-icon';
import { type ValorantAgent } from '@/lib/types';

async function getAgents(): Promise<ValorantAgent[]> {
  try {
    const response = await fetch('https://valorant-api.com/v1/agents?isPlayableCharacter=true', { cache: 'force-cache' }); // Fetched at build time and baked into the static export
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
      <main className="container relative z-10 mx-auto flex min-h-screen flex-col items-center px-3 pb-16 pt-8 text-center sm:px-4 sm:pt-12">
        <header className="w-full max-w-[900px]">
          <div className="flex flex-wrap items-center justify-center gap-3.5">
            <ValorantIcon className="h-7 w-7 text-primary sm:h-9 sm:w-9 md:h-10 md:w-10" />
            <h1 className="font-headline text-[28px] font-bold tracking-[-0.02em] sm:text-[34px] md:text-[40px]">
              Valo Agent Roulette
            </h1>
          </div>
          <p className="mx-auto mt-3 max-w-[560px] text-sm text-muted-foreground sm:text-[17px]">
            Spin to get a random agent for your next match — build your own pool first so you only
            ever land on someone you&apos;ll actually play.
          </p>
        </header>

        {agents.length > 0 ? (
          <AgentRouletteDisplay agents={agents} />
        ) : (
          <div className="mt-8 w-full max-w-[420px] rounded-lg border border-destructive bg-destructive/10 p-4 text-left text-[hsl(0,84.2%,80%)]">
            <div className="mb-1 font-semibold">Could not load agents</div>
            <div className="text-sm opacity-90">
              There was an issue reaching the Valorant API. Refresh to try again.
            </div>
          </div>
        )}

        <footer className="fixed inset-x-0 bottom-3 z-10 px-4 text-center text-xs text-[hsl(240,5%,50%)]">
          Agent data provided by{' '}
          <a
            href="https://valorant-api.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[hsl(240,5%,55%)] underline"
          >
            valorant-api.com
          </a>
          . Not affiliated with Riot Games.
        </footer>
      </main>
    </div>
  );
}

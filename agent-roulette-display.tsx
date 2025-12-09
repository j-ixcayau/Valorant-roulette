'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from '@/components/ui/badge';
import { useToast } from "@/hooks/use-toast"
import { type ValorantAgent } from '@/lib/types';
import { Loader2, RotateCw } from 'lucide-react';

function SpinningAnimation({ agents }: { agents: ValorantAgent[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex(prevIndex => (prevIndex + 1) % agents.length);
    }, 100); // Change agent every 100ms for a fast spinning effect

    return () => clearInterval(interval);
  }, [agents.length]);

  if (!agents.length) {
    return (
        <Card className="overflow-hidden shadow-2xl shadow-primary/20">
          <div className="relative flex aspect-square w-full items-center justify-center bg-secondary/20">
             <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent"></div>
          </div>
          <CardHeader className="items-center text-center">
             <CardTitle className="font-headline flex items-center gap-2 text-2xl">
                <Loader2 className="h-6 w-6 animate-spin" />
                Finding your agent...
             </CardTitle>
          </CardHeader>
        </Card>
    );
  }

  return (
    <Card className="w-full max-w-sm overflow-hidden shadow-2xl shadow-primary/20">
      <div className="relative flex aspect-square w-full items-center justify-center bg-secondary/20 p-8">
        <Image
          key={agents[currentIndex].uuid}
          src={agents[currentIndex].displayIcon}
          alt="Spinning agent icon"
          width={256}
          height={256}
          className="animate-in fade-in duration-100"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent"></div>
      </div>
      <CardHeader className="items-center text-center">
        <CardTitle className="font-headline flex items-center gap-2 text-2xl">
          <Loader2 className="h-6 w-6 animate-spin" />
          Finding your agent...
        </CardTitle>
      </CardHeader>
    </Card>
  );
}


function AgentCard({ selectedAgent }: { selectedAgent: ValorantAgent }) {
    return (
        <Card className="w-full max-w-4xl overflow-hidden animate-in fade-in-50 duration-500">
            <div className="grid md:grid-cols-2">
                <div className="relative min-h-[400px] md:min-h-[600px] bg-secondary/50">
                    <Image
                        src={selectedAgent.fullPortraitV2!}
                        alt={selectedAgent.displayName}
                        fill
                        className="object-contain object-bottom"
                        priority
                        sizes="(max-width: 768px) 100vw, 50vw"
                    />
                    <div 
                        className="absolute inset-0"
                        style={{ background: `linear-gradient(to top, hsl(var(--background)), transparent 70%)` }}
                    />
                </div>
                <div className="flex flex-col p-6">
                    <CardHeader className="p-0">
                        <div className="flex items-center gap-4">
                            {selectedAgent.role?.displayIcon && (
                                <Image src={selectedAgent.role.displayIcon} alt={selectedAgent.role.displayName} width={32} height={32} className="dark:invert"/>
                            )}
                            <div>
                                <Badge variant="secondary">{selectedAgent.role?.displayName}</Badge>
                                <CardTitle className="font-headline mt-1 text-4xl">{selectedAgent.displayName}</CardTitle>
                            </div>
                        </div>
                        <CardDescription className="pt-4 text-left text-base">{selectedAgent.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-grow p-0 mt-6 space-y-4">
                        <div>
                            <h3 className="font-headline text-lg font-semibold mb-2 text-left">Abilities</h3>
                            <Accordion type="single" collapsible className="w-full">
                                {selectedAgent.abilities.filter(a => a.displayIcon).map((ability) => (
                                    <AccordionItem value={ability.slot} key={ability.slot}>
                                        <AccordionTrigger>
                                            <div className="flex items-center gap-3">
                                                <Image src={ability.displayIcon!} alt={ability.displayName} width={24} height={24} className="dark:invert-[.25]"/>
                                                <span className="font-semibold">{ability.displayName}</span>
                                            </div>
                                        </AccordionTrigger>
                                        <AccordionContent className="text-left">
                                            {ability.description}
                                        </AccordionContent>
                                    </AccordionItem>
                                ))}
                            </Accordion>
                        </div>
                    </CardContent>
                </div>
            </div>
        </Card>
    );
}


export function AgentRouletteDisplay({ agents }: { agents: ValorantAgent[] }) {
  const [status, setStatus] = useState<'idle' | 'spinning' | 'revealed'>('idle');
  const [selectedAgent, setSelectedAgent] = useState<ValorantAgent | null>(null);
  const { toast } = useToast();

  const handleSpin = () => {
    if (status === 'spinning') return;
    setStatus('spinning');
    setSelectedAgent(null);

    setTimeout(() => {
      try {
        const randomIndex = Math.floor(Math.random() * agents.length);
        const agent = agents[randomIndex];

        setSelectedAgent(agent);
        setStatus('revealed');
      } catch (error) {
        console.error(error);
        toast({
          variant: "destructive",
          title: "Roulette Error",
          description: "An error occurred while spinning the roulette. Please try again.",
        });
        setStatus('idle');
      }
    }, 2000);
  };

  const handleReset = () => {
    handleSpin();
  }
  
  const isButtonDisabled = status === 'spinning';

  return (
    <div className="flex w-full flex-col items-center justify-center gap-8">
      <div className="min-h-[450px] md:min-h-[650px] w-full flex items-center justify-center">
        {status === 'spinning' && <SpinningAnimation agents={agents} />}
        {status !== 'spinning' && selectedAgent && <AgentCard selectedAgent={selectedAgent} />}
      </div>

      {status !== 'revealed' ? (
         <Button
            size="lg"
            className="font-headline text-lg rounded-full px-12 py-8 shadow-lg hover:shadow-accent/50 transition-shadow duration-300"
            onClick={handleSpin}
            disabled={isButtonDisabled}
            aria-label="Spin the agent roulette"
          >
            {isButtonDisabled ? (
                <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Spinning...
                </>
            ) : "Spin Roulette"}
          </Button>
      ) : (
        <Button
            size="lg"
            variant="outline"
            className="font-headline text-lg rounded-full px-12 py-8 animate-in fade-in duration-500"
            onClick={handleReset}
            disabled={isButtonDisabled}
            aria-label="Spin the roulette again"
        >
          {isButtonDisabled ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Spinning...
            </>
          ) : (
            <>
              <RotateCw className="mr-2 h-5 w-5" />
              Spin Again
            </>
          )}
        </Button>
      )}
    </div>
  );
}

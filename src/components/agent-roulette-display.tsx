'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import { Settings, Check, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { type ValorantAgent } from '@/lib/types';

const STORAGE_KEY = 'valo-roulette-prefs';

type Status = 'idle' | 'spinning' | 'revealed';

interface HistoryEntry {
  uuid: string;
  name: string;
  icon: string;
}

interface StoredPrefs {
  excluded?: string[];
  roles?: string[] | null;
  noRepeat?: boolean;
  history?: HistoryEntry[];
}

// Reel geometry — kept in sync with the markup below (icon size + 12px flex gap).
const REEL_LEN = 24;
function reelMetrics(vw: number) {
  const isMobile = vw < 640;
  const itemSize = isMobile ? 64 : 100;
  const itemStep = itemSize + 12; // flex gap is 12px
  const container = Math.min(isMobile ? 360 : 550, vw - 48);
  return { itemSize, itemStep, container };
}

export function AgentRouletteDisplay({ agents }: { agents: ValorantAgent[] }) {
  // Core spin state
  const [status, setStatus] = useState<Status>('idle');
  const [selectedAgent, setSelectedAgent] = useState<ValorantAgent | null>(null);
  const [lastAgentUuid, setLastAgentUuid] = useState<string | null>(null);
  const [openAbilities, setOpenAbilities] = useState<Record<string, boolean>>({});

  // Pool customization
  const [poolOpen, setPoolOpen] = useState(false);
  const [selectedRoles, setSelectedRoles] = useState<Set<string> | null>(null);
  const [excludedUuids, setExcludedUuids] = useState<Set<string>>(new Set());
  const [noRepeat, setNoRepeat] = useState(true);
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  // Reel animation
  const [reelAgents, setReelAgents] = useState<string[]>([]);
  const [reelTransform, setReelTransform] = useState('translateX(0px)');
  const [reelTransition, setReelTransition] = useState('none');
  const [reelContainerWidth, setReelContainerWidth] = useState(550);
  const [reelItemSize, setReelItemSize] = useState(100);

  // Responsive width
  const [vw, setVw] = useState(1200);

  const loadedRef = useRef(false);
  const spinTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const reelTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const resizeTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const isMobile = vw < 640;
  const isTablet = vw >= 640 && vw < 1024;

  // ---- Restore prefs + set initial viewport width (client only) ----
  useEffect(() => {
    setVw(window.innerWidth);
    try {
      const saved: StoredPrefs = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      if (saved.excluded) setExcludedUuids(new Set(saved.excluded));
      if (saved.roles) setSelectedRoles(new Set(saved.roles));
      if (saved.noRepeat !== undefined) setNoRepeat(saved.noRepeat);
      if (saved.history) setHistory(saved.history);
    } catch {
      /* ignore malformed storage */
    }
    loadedRef.current = true;
  }, []);

  // ---- Persist prefs whenever they change (after initial load) ----
  useEffect(() => {
    if (!loadedRef.current) return;
    const payload: StoredPrefs = {
      excluded: Array.from(excludedUuids),
      roles: selectedRoles ? Array.from(selectedRoles) : null,
      noRepeat,
      history,
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {
      /* ignore quota errors */
    }
  }, [excludedUuids, selectedRoles, noRepeat, history]);

  // ---- Debounced resize tracking (reel math depends on width) ----
  useEffect(() => {
    const onResize = () => {
      clearTimeout(resizeTimeout.current);
      resizeTimeout.current = setTimeout(() => setVw(window.innerWidth), 100);
    };
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      clearTimeout(resizeTimeout.current);
    };
  }, []);

  // ---- Cleanup spin timers on unmount ----
  useEffect(() => {
    return () => {
      clearTimeout(spinTimeout.current);
      clearTimeout(reelTimeout.current);
    };
  }, []);

  const roles = Array.from(new Set(agents.map((a) => a.role!.displayName)));

  const getPool = useCallback(() => {
    return agents.filter(
      (a) =>
        (!selectedRoles || selectedRoles.has(a.role!.displayName)) &&
        !excludedUuids.has(a.uuid)
    );
  }, [agents, selectedRoles, excludedUuids]);

  const pool = getPool();
  const poolEmpty = pool.length === 0;

  // ---- Pool controls ----
  const toggleRole = (role: string) => {
    setSelectedRoles((prev) => {
      const allRoles = new Set(agents.map((a) => a.role!.displayName));
      const sel = prev ? new Set(prev) : new Set(allRoles);
      if (sel.has(role)) sel.delete(role);
      else sel.add(role);
      return sel.size === allRoles.size ? null : sel;
    });
  };

  const toggleAgentExclude = (uuid: string) => {
    setExcludedUuids((prev) => {
      const ex = new Set(prev);
      if (ex.has(uuid)) ex.delete(uuid);
      else ex.add(uuid);
      return ex;
    });
  };

  const resetPool = () => {
    setSelectedRoles(null);
    setExcludedUuids(new Set());
  };

  const toggleAbility = (slot: string) => {
    setOpenAbilities((prev) => ({ ...prev, [slot]: !prev[slot] }));
  };

  const selectFromHistory = (uuid: string) => {
    const agent = agents.find((a) => a.uuid === uuid);
    if (agent) {
      setSelectedAgent(agent);
      setStatus('revealed');
      setOpenAbilities({});
    }
  };

  // ---- Spin ----
  const handleSpin = useCallback(() => {
    if (status === 'spinning') return;
    const currentPool = getPool();
    if (!currentPool.length) return;

    let candidatePool = currentPool;
    if (noRepeat && currentPool.length > 1 && lastAgentUuid) {
      candidatePool = currentPool.filter((a) => a.uuid !== lastAgentUuid);
    }
    const target = candidatePool[Math.floor(Math.random() * candidatePool.length)];

    const { itemSize, itemStep, container } = reelMetrics(window.innerWidth);
    const reel: string[] = [];
    for (let i = 0; i < REEL_LEN - 1; i++) {
      reel.push(currentPool[Math.floor(Math.random() * currentPool.length)].displayIcon);
    }
    reel.push(target.displayIcon);
    const targetIndex = REEL_LEN - 1;
    const finalOffset = container / 2 - (targetIndex * itemStep + itemSize / 2);

    setSelectedAgent(null);
    setOpenAbilities({});
    setPoolOpen(false);
    setReelAgents(reel);
    setReelContainerWidth(container);
    setReelItemSize(itemSize);
    setReelTransform('translateX(0px)');
    setReelTransition('none');
    setStatus('spinning');

    reelTimeout.current = setTimeout(() => {
      setReelTransform(`translateX(${finalOffset}px)`);
      setReelTransition('transform 2.4s cubic-bezier(0.11, 0.65, 0.15, 1)');
    }, 30);

    spinTimeout.current = setTimeout(() => {
      setSelectedAgent(target);
      setStatus('revealed');
      setLastAgentUuid(target.uuid);
      setHistory((prev) => {
        const entry: HistoryEntry = {
          uuid: target.uuid,
          name: target.displayName,
          icon: target.displayIcon,
        };
        return [entry, ...prev.filter((h) => h.uuid !== target.uuid)].slice(0, 8);
      });
    }, 2450);
  }, [status, getPool, noRepeat, lastAgentUuid]);

  // ---- Keyboard: Space / Enter to spin ----
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code !== 'Space' && e.code !== 'Enter') return;
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag && ['INPUT', 'TEXTAREA', 'BUTTON'].includes(tag)) return;
      e.preventDefault();
      handleSpin();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleSpin]);

  const spinDisabled = status === 'spinning' || poolEmpty;
  const spinLabel = status === 'spinning' ? 'Spinning…' : status === 'revealed' ? 'Spin Again' : 'Spin Roulette';

  return (
    <div className="mt-7 flex w-full flex-col items-center gap-5">
      {/* Controls row */}
      <div className="flex flex-wrap items-center justify-center gap-2.5">
        <button
          onClick={() => setPoolOpen((o) => !o)}
          className={cn(
            'flex items-center gap-2 rounded-full border border-border px-4 py-2.5 text-sm font-medium text-foreground transition-colors',
            poolOpen ? 'bg-[hsl(240,3.7%,18%)]' : 'bg-transparent hover:bg-[hsl(240,3.7%,14%)]'
          )}
        >
          <Settings className="h-4 w-4" aria-hidden="true" />
          Customize pool · {pool.length}/{agents.length}
        </button>
        <button
          onClick={() => setNoRepeat((n) => !n)}
          className={cn(
            'flex items-center gap-2 rounded-full border border-border px-4 py-2.5 text-sm font-medium text-foreground transition-colors',
            noRepeat ? 'bg-[hsl(240,3.7%,18%)]' : 'bg-transparent hover:bg-[hsl(240,3.7%,14%)]'
          )}
        >
          {noRepeat && <Check className="h-4 w-4" aria-hidden="true" />}
          Avoid repeating last agent
        </button>
      </div>

      {/* Pool panel */}
      {poolOpen && (
        <div className="w-full max-w-[760px] animate-in fade-in slide-in-from-top-2 rounded-xl border border-border bg-[hsl(240,8%,7%)] p-5 text-left duration-200">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            {roles.map((role) => {
              const active = !selectedRoles || selectedRoles.has(role);
              return (
                <button
                  key={role}
                  onClick={() => toggleRole(role)}
                  className={cn(
                    'rounded-full border px-3.5 py-1.5 text-[13px] font-semibold transition-colors',
                    active
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-[hsl(240,3.7%,25%)] bg-transparent text-[hsl(0,0%,90%)] hover:bg-[hsl(240,3.7%,14%)]'
                  )}
                >
                  {role}
                </button>
              );
            })}
            <button
              onClick={resetPool}
              className="ml-auto rounded-full px-2.5 py-1.5 text-[13px] text-muted-foreground underline hover:text-foreground"
            >
              Reset
            </button>
          </div>
          <div
            className="grid max-h-[260px] gap-2.5 overflow-y-auto pr-1"
            style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(64px, 1fr))' }}
          >
            {agents.map((a) => {
              const excluded = excludedUuids.has(a.uuid);
              return (
                <button
                  key={a.uuid}
                  onClick={() => toggleAgentExclude(a.uuid)}
                  title={a.displayName}
                  className={cn(
                    'flex flex-col items-center gap-1 rounded-lg border bg-[hsl(240,3.7%,12%)] p-1.5 transition-opacity',
                    excluded ? 'border-[hsl(240,3.7%,20%)] opacity-30' : 'border-primary opacity-100'
                  )}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={a.displayIcon} alt={a.displayName} className="h-10 w-10 rounded-md" />
                  <span className="max-w-[60px] overflow-hidden text-ellipsis whitespace-nowrap text-[10px] text-[hsl(0,0%,90%)]">
                    {a.displayName}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty pool state */}
      {poolEmpty ? (
        <div className="mt-5 text-center text-muted-foreground">
          <p className="mb-3">No agents match your filters.</p>
          <button
            onClick={resetPool}
            className="rounded-full border border-border bg-transparent px-[18px] py-2 text-sm text-foreground hover:bg-[hsl(240,3.7%,14%)]"
          >
            Reset pool
          </button>
        </div>
      ) : (
        <div className="flex min-h-[480px] w-full items-center justify-center">
          {status === 'spinning' && (
            <SpinningReel
              icons={reelAgents}
              transform={reelTransform}
              transition={reelTransition}
              containerWidth={reelContainerWidth}
              itemSize={reelItemSize}
            />
          )}

          {status === 'revealed' && selectedAgent && (
            <ResultCard
              agent={selectedAgent}
              openAbilities={openAbilities}
              onToggleAbility={toggleAbility}
              isMobile={isMobile}
            />
          )}

          {status === 'idle' && (
            <div className="text-[15px] text-[hsl(240,5%,50%)]">
              Ready when you are — hit spin or press{' '}
              <b className="text-[hsl(0,0%,80%)]">Space</b>.
            </div>
          )}
        </div>
      )}

      {/* Spin button */}
      <div className="flex flex-col items-center gap-2">
        <button
          onClick={handleSpin}
          disabled={spinDisabled}
          aria-label="Spin the agent roulette"
          className={cn(
            'rounded-full bg-primary font-headline font-semibold text-primary-foreground shadow-[0_10px_25px_-8px_hsla(275,90%,65%,0.5)] transition-opacity',
            isMobile ? 'px-8 py-4 text-[15px]' : 'px-11 py-5 text-[17px]',
            spinDisabled ? 'cursor-not-allowed opacity-50' : 'opacity-100 hover:opacity-90'
          )}
        >
          {spinLabel}
        </button>
        {status !== 'spinning' && (
          <span className="text-xs text-[hsl(240,5%,50%)]">Press Space to spin</span>
        )}
      </div>

      {/* Spin history */}
      {history.length > 0 && (
        <div className="mt-2 w-full max-w-[700px]">
          <div className="mb-2 text-left text-xs text-[hsl(240,5%,55%)]">Recent spins</div>
          <div className="flex gap-2.5 overflow-x-auto pb-1.5">
            {history.map((h) => {
              const current = selectedAgent?.uuid === h.uuid;
              return (
                <button
                  key={h.uuid}
                  onClick={() => selectFromHistory(h.uuid)}
                  title={h.name}
                  className={cn(
                    'h-[52px] w-[52px] flex-shrink-0 rounded-lg border-2 bg-[hsl(240,3.7%,12%)] p-1',
                    current ? 'border-primary' : 'border-[hsl(240,3.7%,20%)]'
                  )}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={h.icon} alt={h.name} className="h-full w-full rounded" />
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function SpinningReel({
  icons,
  transform,
  transition,
  containerWidth,
  itemSize,
}: {
  icons: string[];
  transform: string;
  transition: string;
  containerWidth: number;
  itemSize: number;
}) {
  return (
    <div className="flex w-full flex-col items-center gap-[18px]">
      <div className="relative max-w-full" style={{ width: containerWidth }}>
        {/* Pointer */}
        <div
          className="mx-auto mb-1.5 h-0 w-0"
          style={{
            borderLeft: '8px solid transparent',
            borderRight: '8px solid transparent',
            borderTop: '10px solid hsl(46,100%,55.9%)',
          }}
        />
        <div
          className="relative overflow-hidden rounded-[10px] border border-border bg-[hsl(240,3.7%,10%)]"
          style={{ height: itemSize }}
        >
          {/* Highlight window */}
          <div
            className="pointer-events-none absolute top-0 bottom-0 z-[2] -translate-x-1/2 rounded-lg"
            style={{
              left: '50%',
              width: itemSize,
              borderLeft: '2px solid hsl(46,100%,55.9%)',
              borderRight: '2px solid hsl(46,100%,55.9%)',
            }}
          />
          <div
            className="flex h-full items-center gap-3"
            style={{ transform, transition }}
          >
            {icons.map((icon, i) => (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                key={i}
                src={icon}
                alt=""
                className="flex-shrink-0 rounded-lg bg-secondary p-2"
                style={{ width: itemSize, height: itemSize }}
              />
            ))}
          </div>
        </div>
      </div>
      <div className="font-headline text-xl font-semibold text-[hsl(240,5%,80%)]">Spinning…</div>
    </div>
  );
}

function ResultCard({
  agent,
  openAbilities,
  onToggleAbility,
  isMobile,
}: {
  agent: ValorantAgent;
  openAbilities: Record<string, boolean>;
  onToggleAbility: (slot: string) => void;
  isMobile: boolean;
}) {
  return (
    <div className="w-full max-w-[1024px] animate-in fade-in overflow-hidden rounded-xl border border-border duration-500">
      <div className="grid md:grid-cols-2">
        {/* Portrait */}
        <div
          className="relative bg-[hsla(240,3.7%,15.9%,0.5)]"
          style={{ minHeight: isMobile ? 280 : 560 }}
        >
          <Image
            src={agent.fullPortraitV2!}
            alt={agent.displayName}
            fill
            priority
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-contain object-bottom"
          />
          <div
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(to top, hsl(240,10%,3.9%), transparent 70%)',
            }}
          />
        </div>

        {/* Details */}
        <div
          className="flex flex-col text-left"
          style={{ padding: isMobile ? 20 : 28 }}
        >
          <div className="flex items-center gap-4">
            {agent.role?.displayIcon && (
              <Image
                src={agent.role.displayIcon}
                alt={agent.role.displayName}
                width={30}
                height={30}
                className="flex-shrink-0 invert"
              />
            )}
            <div>
              <span className="inline-flex items-center rounded-full bg-secondary px-2.5 py-0.5 text-xs font-semibold">
                {agent.role?.displayName}
              </span>
              <div
                className="mt-1 font-headline font-semibold"
                style={{ fontSize: isMobile ? 24 : 32 }}
              >
                {agent.displayName}
              </div>
            </div>
          </div>

          <p className="pt-3.5 text-[15px] leading-relaxed text-[hsl(240,5%,68%)]">
            {agent.description}
          </p>

          <div className="mt-5 flex-grow">
            <h3 className="mb-1 font-headline text-base font-semibold">Abilities</h3>
            {agent.abilities
              .filter((a) => a.displayIcon)
              .map((ability) => {
                const open = !!openAbilities[ability.slot];
                return (
                  <div key={ability.slot} className="border-b border-border">
                    <button
                      onClick={() => onToggleAbility(ability.slot)}
                      className="flex w-full items-center gap-3 py-[13px] text-left"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={ability.displayIcon!}
                        alt={ability.displayName}
                        className="h-[22px] w-[22px] [filter:invert(0.85)]"
                      />
                      <span className="text-sm font-semibold">{ability.displayName}</span>
                      <ChevronDown
                        className={cn(
                          'ml-auto h-3.5 w-3.5 text-muted-foreground transition-transform',
                          open && 'rotate-180'
                        )}
                      />
                    </button>
                    {open && (
                      <div className="pb-3.5 text-[13px] leading-relaxed text-muted-foreground">
                        {ability.description}
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        </div>
      </div>
    </div>
  );
}

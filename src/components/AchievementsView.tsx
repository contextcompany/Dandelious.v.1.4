import React, { useState, useMemo } from 'react';
import { ChevronLeft, Trophy, Check, Lock } from 'lucide-react';
import { Achievement, loadAchievementsState } from '../utils/achievementsTracker';

export interface AchievementsViewProps {
  onBack: () => void;
  achievements?: Achievement[];
}

type FilterType = 'all' | 'done' | 'open';

interface AchievementGroupDef {
  name: string;
  ids: string[];
}

const GROUPS_DEF: AchievementGroupDef[] = [
  {
    name: 'Erste Schritte',
    ids: ['first_msg', 'open_projects', 'open_mediathek']
  },
  {
    name: 'Studios',
    ids: ['open_crypto', 'open_stocks', 'open_weather', 'release_planner']
  },
  {
    name: 'Aktivität',
    ids: [
      'night_owl',
      'active_7_days',
      'active_30_days',
      'active_100_days',
      'chat_marathon',
      'chat_empire'
    ]
  },
  {
    name: 'Shards',
    ids: [
      'shards_20',
      'shards_50',
      'shards_70',
      'shards_100',
      'shards_500',
      'shards_1000'
    ]
  }
];

export const AchievementsView: React.FC<AchievementsViewProps> = ({
  onBack,
  achievements: propAchievements
}) => {
  const [filter, setFilter] = useState<FilterType>('all');

  // Load latest achievements if not provided
  const achievements = useMemo(() => {
    return propAchievements && propAchievements.length > 0
      ? propAchievements
      : loadAchievementsState();
  }, [propAchievements]);

  // Lookup map by ID
  const achievementMap = useMemo(() => {
    const map = new Map<string, Achievement>();
    achievements.forEach((a) => map.set(a.id, a));
    return map;
  }, [achievements]);

  // Total stats
  const totalCount = achievements.length || 19;
  const doneCount = achievements.filter((a) => a.unlocked).length;
  const openCount = totalCount - doneCount;
  const percentDone = Math.round((doneCount / totalCount) * 100);

  // SVG Ticks for Ring
  const tickLines = useMemo(() => {
    const lines = [];
    const count = totalCount;
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2 - Math.PI / 2;
      const c = Math.cos(a);
      const s = Math.sin(a);
      const isDone = i < doneCount;
      lines.push(
        <line
          key={i}
          className={isDone ? 'stroke-[#cfe45a]' : 'stroke-[#1e271b]'}
          style={{ strokeWidth: 5, strokeLinecap: 'round' }}
          x1={50 + c * 34}
          y1={50 + s * 34}
          x2={50 + c * 46}
          y2={50 + s * 46}
        />
      );
    }
    return lines;
  }, [totalCount, doneCount]);

  // Grouped achievements with filtering
  const groupedData = useMemo(() => {
    return GROUPS_DEF.map((g) => {
      const items = g.ids
        .map((id) => achievementMap.get(id))
        .filter((item): item is Achievement => item !== undefined);

      const groupDone = items.filter((item) => item.unlocked).length;
      const filteredItems = items.filter((item) => {
        if (filter === 'done') return item.unlocked;
        if (filter === 'open') return !item.unlocked;
        return true;
      });

      return {
        name: g.name,
        total: items.length,
        done: groupDone,
        visibleItems: filteredItems
      };
    });
  }, [achievementMap, filter]);

  const hasVisibleItems = groupedData.some((g) => g.visibleItems.length > 0);

  const filterIndex = filter === 'all' ? 0 : filter === 'done' ? 1 : 2;

  return (
    <div className="min-h-screen bg-[#000000] text-[#eef2e4] font-['DM_Sans',system-ui,sans-serif] pb-16">
      <div className="max-w-[480px] mx-auto px-4.5 pt-4">
        {/* Header */}
        <header className="flex items-center gap-3.5 py-2">
          <button
            type="button"
            onClick={onBack}
            aria-label="Zurück"
            className="w-11 h-11 rounded-full bg-[#161d14] border border-[#2b3627] flex items-center justify-center text-[#eef2e4] hover:border-[#cfe45a]/50 transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h1
            className="text-[22px] font-bold tracking-tight text-[#eef2e4]"
            style={{ fontFamily: '"Bricolage Grotesque", sans-serif' }}
          >
            Erfolge
          </h1>
        </header>

        {/* Hero Section */}
        <section
          className="mt-3.5 flex items-center gap-5 bg-[#161d14] border border-[#2b3627] rounded-[26px] p-5"
          aria-label="Fortschritt"
        >
          {/* Ring */}
          <div className="relative w-24 h-24 flex-none">
            <svg viewBox="0 0 100 100" className="w-full h-full" aria-hidden="true">
              {tickLines}
            </svg>
            <div className="absolute inset-0 flex items-center justify-center text-[#cfe45a]">
              <Trophy className="w-[34px] h-[34px] stroke-[1.9]" />
            </div>
          </div>

          {/* Stats */}
          <div>
            <small className="block text-[#9aa58f] text-sm">Freigeschaltet</small>
            <b
              className="block text-[34px] leading-tight font-bold text-[#eef2e4]"
              style={{ fontFamily: '"Bricolage Grotesque", sans-serif' }}
            >
              {doneCount}{' '}
              <em className="not-italic text-[19px] text-[#9aa58f] font-medium font-sans">
                von {totalCount}
              </em>
            </b>
            <p className="mt-1.5 text-sm text-[#9aa58f]">{percentDone} % geschafft</p>
          </div>
        </section>

        {/* Segmented Filter Control */}
        <div
          className="relative grid grid-cols-3 bg-[#1e271b] rounded-full p-1 mt-4"
          role="tablist"
          aria-label="Filter"
        >
          {/* Sliding Thumb */}
          <span
            className="absolute top-1 bottom-1 left-1 w-[calc((100%-8px)/3)] rounded-full bg-[#cfe45a] transition-transform duration-250 ease-out"
            style={{ transform: `translateX(${filterIndex * 100}%)` }}
          />

          <button
            type="button"
            role="tab"
            aria-selected={filter === 'all'}
            onClick={() => setFilter('all')}
            className={`relative z-10 min-h-[44px] rounded-full font-semibold text-[15px] flex items-center justify-center transition-colors cursor-pointer ${
              filter === 'all' ? 'text-[#1a2307]' : 'text-[#9aa58f] hover:text-[#eef2e4]'
            }`}
          >
            Alle<span className="font-medium opacity-70 ml-1 text-xs">{totalCount}</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={filter === 'done'}
            onClick={() => setFilter('done')}
            className={`relative z-10 min-h-[44px] rounded-full font-semibold text-[15px] flex items-center justify-center transition-colors cursor-pointer ${
              filter === 'done' ? 'text-[#1a2307]' : 'text-[#9aa58f] hover:text-[#eef2e4]'
            }`}
          >
            Erreicht<span className="font-medium opacity-70 ml-1 text-xs">{doneCount}</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={filter === 'open'}
            onClick={() => setFilter('open')}
            className={`relative z-10 min-h-[44px] rounded-full font-semibold text-[15px] flex items-center justify-center transition-colors cursor-pointer ${
              filter === 'open' ? 'text-[#1a2307]' : 'text-[#9aa58f] hover:text-[#eef2e4]'
            }`}
          >
            Offen<span className="font-medium opacity-70 ml-1 text-xs">{openCount}</span>
          </button>
        </div>

        {/* Groups */}
        <div className="mt-6 space-y-6">
          {hasVisibleItems ? (
            groupedData.map((group) => {
              if (group.visibleItems.length === 0) return null;

              return (
                <section key={group.name} className="space-y-2.5">
                  <div className="flex justify-between items-baseline px-1">
                    <h2
                      className="text-[13px] font-semibold tracking-wider uppercase text-[#9aa58f]"
                      style={{ fontFamily: '"DM Sans", sans-serif' }}
                    >
                      {group.name}
                    </h2>
                    <span className="text-[13px] text-[#9aa58f]">
                      <b className="text-[#cfe45a] font-semibold">{group.done}</b> / {group.total}
                    </span>
                  </div>

                  <div className="bg-[#161d14] border border-[#2b3627] rounded-[26px] overflow-hidden divide-y divide-[#2b3627]">
                    {group.visibleItems.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-3.5 px-4 py-3 min-h-[68px]"
                      >
                        {/* Tile Icon */}
                        <span
                          className={`w-10 h-10 rounded-[13px] flex items-center justify-center flex-none transition-colors ${
                            item.unlocked
                              ? 'bg-[#cfe45a] text-[#1a2307]'
                              : 'bg-[#1e271b] text-[#9aa58f]'
                          }`}
                        >
                          {item.unlocked ? (
                            <Check className="w-5 h-5 stroke-[2.5]" />
                          ) : (
                            <Lock className="w-5 h-5 stroke-[2]" />
                          )}
                        </span>

                        {/* Text */}
                        <div className="flex-1 min-w-0">
                          <b
                            className={`block font-semibold text-sm leading-tight ${
                              item.unlocked ? 'text-[#eef2e4]' : 'text-[#c6cfba]'
                            }`}
                          >
                            {item.title}
                          </b>
                          <span
                            className={`block text-xs leading-normal mt-0.5 ${
                              item.unlocked ? 'text-[#9aa58f]' : 'text-[#78826f]'
                            }`}
                          >
                            {item.description}
                          </span>
                        </div>

                        {/* Badge */}
                        {item.unlocked && (
                          <span className="flex-none text-xs font-semibold text-[#cfe45a] px-2.5 py-1 rounded-full bg-[#cfe45a]/15">
                            Erreicht
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              );
            })
          ) : (
            <div className="text-center text-[#9aa58f] py-12 text-sm">Nichts zu zeigen.</div>
          )}
        </div>
      </div>
    </div>
  );
};

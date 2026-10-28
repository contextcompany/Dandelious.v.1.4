import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence, LayoutGroup } from 'motion/react';
import { 
  Search, 
  Star, 
  X, 
  ChevronRight, 
  Clock, 
  Check, 
  Sparkles, 
  Bell, 
  BellRing, 
  Gamepad2, 
  Tv, 
  Film, 
  HelpCircle,
  Calendar,
  Flame,
  Info,
  Layers,
  Building2
} from 'lucide-react';
import { EngineSettings } from '../types';
import { playSound } from '../utils/sound';
import { checkAchievement } from '../utils/achievementsTracker';

export type ReleaseTab = 'alle' | 'games' | 'serien' | 'filme' | 'anime';

export interface ReleaseItem {
  id: string;
  title: string;
  category: 'games' | 'serien' | 'filme' | 'anime';
  categoryLabel: string;
  releaseDateStr: string;
  platforms: string[];
  studio: string;
  synopsis: string;
  genres: string[];
  hypeScore: number;
  badge?: string;
  iconType: 'game' | 'tv' | 'film' | 'anime';
}

/**
 * Parses release date strings (e.g. "Oktober 2026", "Herbst 2026", "Anfang 2027", "Mai 2027")
 * into a numerical timestamp value for strict chronological ordering.
 */
export const parseReleaseDateToScore = (dateStr: string): number => {
  const str = dateStr.toLowerCase();
  let baseYear = 2026;
  const matchYear = str.match(/20\d\d/);
  if (matchYear) {
    baseYear = parseInt(matchYear[0], 10);
  }

  let monthOffset = 0.5; // Default mid-year
  if (str.includes('januar') || str.includes('anfang')) monthOffset = 0.08;
  else if (str.includes('februar')) monthOffset = 0.16;
  else if (str.includes('märz') || str.includes('frühjahr')) monthOffset = 0.25;
  else if (str.includes('april')) monthOffset = 0.33;
  else if (str.includes('mai')) monthOffset = 0.41;
  else if (str.includes('juni') || str.includes('mitte')) monthOffset = 0.50;
  else if (str.includes('juli')) monthOffset = 0.58;
  else if (str.includes('august')) monthOffset = 0.66;
  else if (str.includes('september')) monthOffset = 0.75;
  else if (str.includes('oktober')) monthOffset = 0.83;
  else if (str.includes('herbst')) monthOffset = 0.86;
  else if (str.includes('november')) monthOffset = 0.91;
  else if (str.includes('dezember') || str.includes('ende')) monthOffset = 0.95;

  return baseYear + monthOffset;
};

const INITIAL_RELEASES: ReleaseItem[] = [
  // --- OKTOBER & HERBST 2026 ---
  {
    id: 'star-wars-galactic-racers',
    title: 'Star Wars: Galactic Racers',
    category: 'games',
    categoryLabel: 'Game',
    releaseDateStr: 'Oktober 2026',
    platforms: ['PS5', 'Xbox Series X/S', 'PC (Steam)', 'Switch 2'],
    studio: 'Lucasfilm Games / EA',
    synopsis: 'Ein rasantes, Next-Gen Podracing- & Repulsorlift-Rennspiel im Star Wars-Universum. Fahre mit wahnwitziger Geschwindigkeit über gefährliche Wüsten-, Eis- und Moloch-Planeten der äußeren Randgebiete.',
    genres: ['Sci-Fi Racing', 'Action'],
    hypeScore: 96,
    badge: 'Star Wars Highlight',
    iconType: 'game'
  },
  {
    id: 'gta-6',
    title: 'Grand Theft Auto VI',
    category: 'games',
    categoryLabel: 'Game',
    releaseDateStr: 'Herbst 2026',
    platforms: ['PS5', 'Xbox Series X/S', 'PC (Steam)'],
    studio: 'Rockstar Games',
    synopsis: 'Grand Theft Auto VI entführt Spieler in den sonnigen Bundesstaat Leonida, Heimat der neonbeleuchteten Straßen von Vice City. Als Duo Lucia und Jason erleben Spieler eine visuell umwerfende Story voller Verbrechen, Verrat und beispielloser Freiheit.',
    genres: ['Open-World', 'Action-Adventure'],
    hypeScore: 99,
    badge: 'Meisterwartet',
    iconType: 'game'
  },
  {
    id: 'stranger-things-5',
    title: 'Stranger Things 5 (Finale)',
    category: 'serien',
    categoryLabel: 'Serie',
    releaseDateStr: 'Herbst 2026',
    platforms: ['Netflix'],
    studio: 'Duffer Brothers / Netflix',
    synopsis: 'Nachdem die Risse zwischen Hawkins und dem Schattenreich aufgebrochen sind, versammeln sich Elfie, Mike, Dustin, Lucas und Will für ihr finales Abenteuer. Ein filmreifes Finale voller Nostalgie und 80er-Jahre Charme.',
    genres: ['Sci-Fi', 'Horror', 'Mystery'],
    hypeScore: 98,
    badge: 'Serien-Finale',
    iconType: 'tv'
  },
  {
    id: 'silksong',
    title: 'Hollow Knight: Silksong',
    category: 'games',
    categoryLabel: 'Indie Game',
    releaseDateStr: 'Herbst 2026',
    platforms: ['PC (Steam)', 'Switch 2', 'PS5', 'Xbox Series X/S'],
    studio: 'Team Cherry',
    synopsis: 'Übernehme die Rolle von Hornet, der Prinzessin-Beschützerin von Hallownest, auf ihrer Reise durch ein verzaubertes Königreich der Seide und des Gesangs mit über 150 neuen Insekten-Gegnern.',
    genres: ['Metroidvania', 'Action-Platformer'],
    hypeScore: 97,
    badge: 'Indie-Kult',
    iconType: 'game'
  },
  {
    id: 'little-nightmares-3',
    title: 'Little Nightmares III',
    category: 'games',
    categoryLabel: 'Game',
    releaseDateStr: 'Herbst 2026',
    platforms: ['PS5', 'Xbox Series X/S', 'PC (Steam)', 'Switch'],
    studio: 'Supermassive Games / Bandai Namco',
    synopsis: 'Begleite Low und Alone auf ihrer Reise durch das Spiral-Labyrinth aus verstörenden Illusionen. Erstmals im Online-Koop oder im Einzelspieler-Modus spielbar.',
    genres: ['Horror-Puzzle', 'Platformer'],
    hypeScore: 91,
    badge: 'Atmosphärisch',
    iconType: 'game'
  },

  // --- ENDE / DEZEMBER 2026 ---
  {
    id: 'dune-3',
    title: 'Dune: Messiah (Teil 3)',
    category: 'filme',
    categoryLabel: 'Kinofilm',
    releaseDateStr: 'Dezember 2026',
    platforms: ['Kino', 'IMAX 70mm'],
    studio: 'Denis Villeneuve / Warner Bros.',
    synopsis: 'Zwölf Jahre nach seiner Krönung zum Imperator kämpft Paul Muad\'Dib Atreides gegen die verheerenden religiösen Kriege und Verschwörungen des Bene Gesserit Ordens.',
    genres: ['Epische Sci-Fi', 'Drama'],
    hypeScore: 98,
    badge: 'Kino-Meilenstein',
    iconType: 'film'
  },
  {
    id: 'death-stranding-2',
    title: 'Death Stranding 2: On The Beach',
    category: 'games',
    categoryLabel: 'Game',
    releaseDateStr: 'Ende 2026',
    platforms: ['PS5', 'PC (Steam)'],
    studio: 'Kojima Productions / Sony',
    synopsis: 'Hideo Kojima schickt Sam Porter Bridges erneut auf eine surreale, visuell atemberaubende Reise über die Grenzen des bekannten Universums mit Elle Fanning und Norman Reedus.',
    genres: ['Sci-Fi', 'Cinematic Action'],
    hypeScore: 97,
    badge: 'Kojima Meisterwerk',
    iconType: 'game'
  },
  {
    id: 'monster-hunter-wilds',
    title: 'Monster Hunter Wilds',
    category: 'games',
    categoryLabel: 'Game',
    releaseDateStr: 'Ende 2026',
    platforms: ['PS5', 'Xbox Series X/S', 'PC (Steam)'],
    studio: 'Capcom',
    synopsis: 'Begib dich in dynamische, stürmische Ökosysteme mit gigantischen Monsterherden, neuer Reittier-Mechanik und nahtloser Weltkarte.',
    genres: ['Action-RPG', 'Co-op'],
    hypeScore: 96,
    badge: 'Capcom Hit',
    iconType: 'game'
  },
  {
    id: 'kingdom-come-2',
    title: 'Kingdom Come: Deliverance II',
    category: 'games',
    categoryLabel: 'Game',
    releaseDateStr: 'Ende 2026',
    platforms: ['PC (Steam)', 'PS5', 'Xbox Series X/S'],
    studio: 'Warhorse Studios / Deep Silver',
    synopsis: 'Setze die Geschichte von Heinrich von Skalitz im Böhmen des 15. Jahrhunderts fort. Ein kompromisslos realistisches Mittelalter-Epos mit echten Schwertkämpfen.',
    genres: ['Hardcore-RPG', 'Historie'],
    hypeScore: 94,
    badge: 'Mittelalter-Epos',
    iconType: 'game'
  },
  {
    id: 'hades-2',
    title: 'Hades II (Full 1.0 Release)',
    category: 'games',
    categoryLabel: 'Indie Game',
    releaseDateStr: 'Ende 2026',
    platforms: ['PC (Steam)', 'Switch 2', 'PS5', 'Xbox'],
    studio: 'Supergiant Games',
    synopsis: 'Als Melinoë, Prinzessin der Unterwelt, nutzt du Zauberei und dunkle Magie, um den Titanen der Zeit in einem rauschhaften Roguelike-Actionfeuerwerk herauszufordern.',
    genres: ['Roguelike', 'Action-RPG'],
    hypeScore: 96,
    badge: 'Supergiant Hit',
    iconType: 'game'
  },
  {
    id: 'slay-the-spire-2',
    title: 'Slay the Spire 2',
    category: 'games',
    categoryLabel: 'Indie Game',
    releaseDateStr: 'Ende 2026',
    platforms: ['PC (Steam)', 'Switch 2'],
    studio: 'Mega Crit',
    synopsis: 'Der lang ersehnte Nachfolger des legendären Deckbuilder-Roguelikes auf neuer Engine. Neue Klassen, modifizierbare Karten und tödliche Turm-Ebenen.',
    genres: ['Deckbuilder', 'Roguelike'],
    hypeScore: 93,
    badge: 'Strategie-Tipp',
    iconType: 'game'
  },
  {
    id: 'metroid-prime-4',
    title: 'Metroid Prime 4: Beyond',
    category: 'games',
    categoryLabel: 'Game',
    releaseDateStr: 'Ende 2026',
    platforms: ['Nintendo Switch', 'Switch 2'],
    studio: 'Retro Studios / Nintendo',
    synopsis: 'Samus Aran stellt sich ihrem Rivalen Sylux auf fremdartigen Welten. Erkunde surreale außerirdische Biome und meistere Beam-Waffen in packender Atmosphäre.',
    genres: ['Sci-Fi', 'First-Person'],
    hypeScore: 94,
    badge: 'Nintendo Flaggschiff',
    iconType: 'game'
  },
  {
    id: 'wednesday-2',
    title: 'Wednesday (Staffel 2)',
    category: 'serien',
    categoryLabel: 'Serie',
    releaseDateStr: 'Ende 2026',
    platforms: ['Netflix'],
    studio: 'Tim Burton / Netflix',
    synopsis: 'Wednesday Addams kehrt an die Nevermore Academy zurück. Noch düsterer, morphes Verhalten und ein mysteriöser neuer Serienkiller fordern die Schülerin heraus.',
    genres: ['Mystery', 'Gothic Comedy'],
    hypeScore: 95,
    badge: 'Netflix Event',
    iconType: 'tv'
  },
  {
    id: 'peacemaker-2',
    title: 'Peacemaker (Staffel 2)',
    category: 'serien',
    categoryLabel: 'Serie',
    releaseDateStr: 'Ende 2026',
    platforms: ['HBO Max / Sky'],
    studio: 'James Gunn / DC Studios',
    synopsis: 'Christopher Smith kehrt im neu ausgerichteten DC Universe von James Gunn zurück. Verrückter Humor, blutige Antihelden-Action und familiäre Konflikte.',
    genres: ['Superhelden', 'Action-Comedey'],
    hypeScore: 92,
    badge: 'DCU Start',
    iconType: 'tv'
  },
  {
    id: 'the-last-of-us-2',
    title: 'The Last of Us (Staffel 2)',
    category: 'serien',
    categoryLabel: 'Serie',
    releaseDateStr: 'Ende 2026',
    platforms: ['HBO Max', 'Sky / WOW'],
    studio: 'Craig Mazin & Neil Druckmann / HBO',
    synopsis: 'Basierend auf dem Videospiel Part II folgt Staffel 2 Joel und Ellie im scheinbar friedlichen Jackson, bevor eine Tragödie Ellie auf einen schonungslosen Rachefeldzug schickt.',
    genres: ['Postapokalypse', 'Drama'],
    hypeScore: 96,
    badge: 'HBO Event',
    iconType: 'tv'
  },
  {
    id: 'demon-slayer-infinity-castle',
    title: 'Demon Slayer: Infinity Castle',
    category: 'anime',
    categoryLabel: 'Kino / Anime',
    releaseDateStr: 'Ende 2026',
    platforms: ['Kino', 'Crunchyroll'],
    studio: 'ufotable',
    synopsis: 'Die Säulen und Tanjiro fallen in die multidimensionale unendliche Festung von Muzan für die finalen, lebensentscheidenden Duelle.',
    genres: ['Dark Fantasy', 'Anime'],
    hypeScore: 97,
    badge: 'ufotable Highlight',
    iconType: 'anime'
  },
  {
    id: 'chainsaw-man-reze',
    title: 'Chainsaw Man: Reze Arc Film',
    category: 'anime',
    categoryLabel: 'Kino / Anime',
    releaseDateStr: 'Ende 2026',
    platforms: ['Kino', 'Crunchyroll'],
    studio: 'MAPPA',
    synopsis: 'Denji trifft auf Reze, ein scheinbar unschuldiges Mädchen im Café, das ein explosives Geheimnis birgt. Der beliebte Bomb-Girl-Arc in bombastischer MAPPA-Kinoanimation.',
    genres: ['Action', 'Dark Fantasy'],
    hypeScore: 94,
    badge: 'MAPPA Movie',
    iconType: 'anime'
  },
  {
    id: 'one-punch-man-3',
    title: 'One Punch Man (Staffel 3)',
    category: 'anime',
    categoryLabel: 'Anime',
    releaseDateStr: 'Ende 2026',
    platforms: ['Crunchyroll'],
    studio: 'J.C. Staff',
    synopsis: 'Der Krieg zwischen der Helden-Vereinigung und der Monster-Vereinigung bricht aus. Saitama, Garou und die Rang-S-Helden treffen in den Tiefen des Verstecks aufeinander.',
    genres: ['Action', 'Comedy', 'Superhelden'],
    hypeScore: 93,
    badge: 'Anime Hype',
    iconType: 'anime'
  },

  // --- ANFANG & FRÜHJAHR 2027 ---
  {
    id: 'resident-evil-9',
    title: 'Resident Evil 9 (Biohazard)',
    category: 'games',
    categoryLabel: 'Game',
    releaseDateStr: 'Anfang 2027',
    platforms: ['PS5', 'Xbox Series X/S', 'PC (Steam)'],
    studio: 'Capcom',
    synopsis: 'Capcoms neuester Meilenstein des Survival-Horrors auf Basis der RE Engine. Begib dich in entlegene Inselareale und mysteriöse Forschungseinrichtungen.',
    genres: ['Survival Horror', 'Action'],
    hypeScore: 97,
    badge: 'Capcom Highlight',
    iconType: 'game'
  },
  {
    id: 'judas',
    title: 'Judas',
    category: 'games',
    categoryLabel: 'Game',
    releaseDateStr: 'Anfang 2027',
    platforms: ['PS5', 'Xbox Series X/S', 'PC (Steam)'],
    studio: 'Ghost Story Games / Ken Levine',
    synopsis: 'Vom Schöpfer von BioShock: An Bord eines zerfallenden Raumschiffs musst du Bündnisse mit deinen feindseligsten Verbündeten eingehen, um zu überleben.',
    genres: ['Sci-Fi-Shooter', 'Immersive Sim'],
    hypeScore: 93,
    badge: 'BioShock Geist',
    iconType: 'game'
  },
  {
    id: 'subnautica-2',
    title: 'Subnautica 2',
    category: 'games',
    categoryLabel: 'Game',
    releaseDateStr: 'Anfang 2027',
    platforms: ['PC (Steam)', 'Xbox Series X/S', 'PS5'],
    studio: 'Unknown Worlds / Krafton',
    synopsis: 'Erforsche eine völlig neue ozeanische Welt voller fremdartiger Lebensformen und abgründiger Unterwasser-Biome. Erstmals auch im 4-Spieler-Koop spielbar.',
    genres: ['Survival', 'Unterwasser-Sci-Fi'],
    hypeScore: 92,
    badge: 'Koop-Survival',
    iconType: 'game'
  },
  {
    id: 'anno-117',
    title: 'Anno 117: Pax Romana',
    category: 'games',
    categoryLabel: 'Game',
    releaseDateStr: 'Anfang 2027',
    platforms: ['PC (Steam)', 'PS5', 'Xbox Series X/S'],
    studio: 'Ubisoft Mainz',
    synopsis: 'Mache dich als römischer Statthalter im Jahr 117 n. Chr. unsterblich. Baue prachtvolle Provinzen in Latium und Albion oder verteidige die Grenzen des Römischen Reiches.',
    genres: ['Aufbaustrategie', 'Simulation'],
    hypeScore: 94,
    badge: 'Strategie-König',
    iconType: 'game'
  },
  {
    id: 'layton-steam',
    title: 'Professor Layton und die Neue Welt des Dampfes',
    category: 'games',
    categoryLabel: 'Game',
    releaseDateStr: 'Anfang 2027',
    platforms: ['Nintendo Switch', 'Switch 2'],
    studio: 'Level-5',
    synopsis: 'Professor Layton und Luke Triton reisen in die futuristische Dampfmetropole Steam Bison in den USA, um ein kniffliges neues Kriminalrätsel zu lösen.',
    genres: ['Rätsel-Adventure'],
    hypeScore: 90,
    badge: 'Rätsel-Kult',
    iconType: 'game'
  },
  {
    id: 'severance-3',
    title: 'Severance (Staffel 3)',
    category: 'serien',
    categoryLabel: 'Serie',
    releaseDateStr: 'Anfang 2027',
    platforms: ['Apple TV+'],
    studio: 'Ben Stiller / Apple TV+',
    synopsis: 'Nach den schockierenden Enthüllungen bei Lumon Industries suchen Mark und sein Team nach dem wahren Zweck der Abspaltung ihrer Erinnerungen.',
    genres: ['Sci-Fi Thriller', 'Mystery'],
    hypeScore: 94,
    badge: 'Apple TV+ Hit',
    iconType: 'tv'
  },
  {
    id: 'jujutsu-kaisen-3',
    title: 'Jujutsu Kaisen (Staffel 3: Culling Game)',
    category: 'anime',
    categoryLabel: 'Anime',
    releaseDateStr: 'Anfang 2027',
    platforms: ['Crunchyroll'],
    studio: 'MAPPA',
    synopsis: 'Das tödliche Culling Game von Kenjaku beginnt in ganz Japan. Yuji Itadori und Megumi Fushiguro kämpfen in abgeschotteten Kolonien gegen antike Fluchmagier.',
    genres: ['Dark Fantasy', 'Anime Action'],
    hypeScore: 97,
    badge: 'MAPPA Flaggschiff',
    iconType: 'anime'
  },

  // --- MAI, MITTE & HERBST 2027 ---
  {
    id: 'avengers-doomsday',
    title: 'Avengers: Doomsday',
    category: 'filme',
    categoryLabel: 'Kinofilm',
    releaseDateStr: 'Mai 2027',
    platforms: ['Kino', 'Disney+ (später)'],
    studio: 'Marvel Studios / Disney',
    synopsis: 'Unter der Regie der Russo-Brüder formieren sich die neuen Avengers und multiversale Helden für den epischen Zusammenstoß gegen Victor von Doom (gespielt von Robert Downey Jr.).',
    genres: ['Superhelden', 'Sci-Fi Action'],
    hypeScore: 98,
    badge: 'Marvel Blockbuster',
    iconType: 'film'
  },
  {
    id: 'house-of-the-dragon-3',
    title: 'House of the Dragon (Staffel 3)',
    category: 'serien',
    categoryLabel: 'Serie',
    releaseDateStr: 'Mitte 2027',
    platforms: ['HBO Max', 'Sky / WOW'],
    studio: 'HBO Entertainment',
    synopsis: 'Der verheerende Targaryen-Bürgerkrieg zwischen Team Schwarz und Team Grün eskaliert in gigantischen Drachenschlachten zu Wasser und zu Land.',
    genres: ['High Fantasy', 'Drama'],
    hypeScore: 95,
    badge: 'HBO Flaggschiff',
    iconType: 'tv'
  },
  {
    id: 'witcher-4',
    title: 'The Witcher 4: Polaris',
    category: 'games',
    categoryLabel: 'Game',
    releaseDateStr: 'Mitte 2027',
    platforms: ['PC (Steam)', 'PS5', 'Xbox Series X'],
    studio: 'CD Projekt RED',
    synopsis: 'Polaris markiert den Beginn einer neuen Trilogie im finsteren Witcher-Universum mit Fokus auf die Hexerschule des Luchses auf Basis der Unreal Engine 5.',
    genres: ['Action-RPG', 'Dark Fantasy'],
    hypeScore: 96,
    badge: 'Neue Saga',
    iconType: 'game'
  },
  {
    id: 'fable-4',
    title: 'Fable (Reboot)',
    category: 'games',
    categoryLabel: 'Game',
    releaseDateStr: 'Mitte 2027',
    platforms: ['Xbox Series X/S', 'PC (Steam)'],
    studio: 'Playground Games / Xbox Game Studios',
    synopsis: 'Ein märchenhaftes Open-World-Action-RPG im sagenumwobenen Albion mit britischem Humor, zauberhafter Natur und tiefgreifenden moralischen Entscheidungen.',
    genres: ['RPG', 'Fantasy'],
    hypeScore: 94,
    badge: 'Xbox Exklusiv',
    iconType: 'game'
  },
  {
    id: 'crimson-desert',
    title: 'Crimson Desert',
    category: 'games',
    categoryLabel: 'Game',
    releaseDateStr: 'Mitte 2027',
    platforms: ['PC (Steam)', 'PS5', 'Xbox Series X/S'],
    studio: 'Pearl Abyss',
    synopsis: 'Erforsche den zerrissenen Kontinent Pywel als Söldner Macduff. Atemberaubendes Kampfsystem, physikbasierte Magie und riesige Burgenbelagerungen.',
    genres: ['Action-RPG', 'Open-World'],
    hypeScore: 93,
    badge: 'Grafik-Referenz',
    iconType: 'game'
  },
  {
    id: 'pragmata',
    title: 'Pragmata',
    category: 'games',
    categoryLabel: 'Game',
    releaseDateStr: 'Mitte 2027',
    platforms: ['PS5', 'Xbox Series X/S', 'PC (Steam)'],
    studio: 'Capcom',
    synopsis: 'Ein geheimnisvolles Sci-Fi-Abenteuer in einer dystopischen Zukunft auf dem Mond. Ein gepanzerter Soldat beschützt ein Androiden-Mädchen namens Diana.',
    genres: ['Sci-Fi', 'Action-Adventure'],
    hypeScore: 91,
    badge: 'Capcom New IP',
    iconType: 'game'
  },
  {
    id: 'fallout-2',
    title: 'Fallout (Staffel 2)',
    category: 'serien',
    categoryLabel: 'Serie',
    releaseDateStr: 'Mitte 2027',
    platforms: ['Amazon Prime Video'],
    studio: 'Kilter Films / Amazon MGM Studios',
    synopsis: 'Lucy, der Ghul und Maximus reisen in das neonbeleuchtete Ödland von New Vegas. Neue Bedrohungen, Supermutanten und die Geheimnisse von Mr. House erwarten sie.',
    genres: ['Sci-Fi', 'Postapokalypse'],
    hypeScore: 96,
    badge: 'Prime Event',
    iconType: 'tv'
  },
  {
    id: 'toy-story-5',
    title: 'Toy Story 5',
    category: 'filme',
    categoryLabel: 'Kinofilm',
    releaseDateStr: 'Mitte 2027',
    platforms: ['Kino', 'Disney+ (später)'],
    studio: 'Pixar / Disney',
    synopsis: 'Woody, Buzz Lightyear und Jessie stellen sich der größten modernen Herausforderung für Spielzeuge: Die Konkurrenz durch Tablets, Elektronik und Smarthome-Geräte.',
    genres: ['Animation', 'Familie', 'Abenteuer'],
    hypeScore: 93,
    badge: 'Pixar Klassiker',
    iconType: 'film'
  },

  // --- HERBST & ENDE 2027 ---
  {
    id: 'borderlands-4',
    title: 'Borderlands 4',
    category: 'games',
    categoryLabel: 'Game',
    releaseDateStr: 'Herbst 2027',
    platforms: ['PS5', 'Xbox Series X/S', 'PC (Steam)'],
    studio: 'Gearbox Software / 2K Games',
    synopsis: 'Suche auf einem völlig neuen Planeten nach verheerender Kammer-Technologie mit Milliarden neuer abgedrehter Waffen und schrulligen Charakteren.',
    genres: ['Looter-Shooter', 'Action-Coop'],
    hypeScore: 93,
    badge: 'Coop-Kracher',
    iconType: 'game'
  },
  {
    id: 'mafia-old-country',
    title: 'Mafia: The Old Country',
    category: 'games',
    categoryLabel: 'Game',
    releaseDateStr: 'Herbst 2027',
    platforms: ['PS5', 'Xbox Series X/S', 'PC (Steam)'],
    studio: 'Hangar 13 / 2K Games',
    synopsis: 'Erforsche die düsteren Anfänge des organisierten Verbrechens im Sizilien der 1900er Jahre mit klassischem Mafia-Charme und packendem Storytelling.',
    genres: ['Action-Adventure', 'Krimi'],
    hypeScore: 92,
    badge: 'Krimi-Epos',
    iconType: 'game'
  },
  {
    id: 'the-batman-2',
    title: 'The Batman Part II',
    category: 'filme',
    categoryLabel: 'Kinofilm',
    releaseDateStr: 'Oktober 2027',
    platforms: ['Kino', 'IMAX'],
    studio: 'Matt Reeves / DC Studios & Warner Bros.',
    synopsis: 'Robert Pattinson schlüpft erneut in die Rolle von Bruce Wayne / Batman. Gotham City ist nach der Flut im Chaos versunken und düstere neue Schurken betreten die Bühne.',
    genres: ['Krimi-Noir', 'Superhelden'],
    hypeScore: 97,
    badge: 'DC Blockbuster',
    iconType: 'film'
  },
  {
    id: 'beyond-spiderverse',
    title: 'Spider-Man: Beyond the Spider-Verse',
    category: 'filme',
    categoryLabel: 'Kinofilm',
    releaseDateStr: 'Ende 2027',
    platforms: ['Kino', 'IMAX'],
    studio: 'Sony Pictures Animation',
    synopsis: 'Das gewaltige Finale der Multiversum-Trilogie um Miles Morales. Miles kämpft gegen sein eigenes düsteres Spiegelbild Earth-42 und den scheinbar unbesiegbaren Spot.',
    genres: ['Animation', 'Superhelden'],
    hypeScore: 98,
    badge: 'Multiversum Finale',
    iconType: 'film'
  },
  {
    id: 'elder-scrolls-6',
    title: 'The Elder Scrolls VI',
    category: 'games',
    categoryLabel: 'Game',
    releaseDateStr: 'Ende 2027',
    platforms: ['Xbox Series X/S', 'PC (Steam)'],
    studio: 'Bethesda Game Studios',
    synopsis: 'Das hochgradig antizipierte nächste Kapitel der legendären Open-World-Fantasy-Reihe von Bethesda in den atemberaubenden Provinzen von Tamriel.',
    genres: ['Open-World RPG', 'Fantasy'],
    hypeScore: 98,
    badge: 'Bethesda Epos',
    iconType: 'game'
  }
];

const STORAGE_BOOKMARKS_KEY = 'dandelious_releases_bookmarks_v2';
const STORAGE_CLEAN_KEY = 'dandelious_releases_clean_v5';

interface ReleasesStudioProps {
  settings: EngineSettings;
  onBackToChat?: () => void;
  onToggleSidebar?: () => void;
  isMobile?: boolean;
  isStandaloneMode?: boolean;
}

export const ReleasesStudio: React.FC<ReleasesStudioProps> = ({
  settings,
  onBackToChat,
  onToggleSidebar,
  isMobile = false,
  isStandaloneMode = false
}) => {
  const [activeTab, setActiveTab] = useState<ReleaseTab>('alle');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRelease, setSelectedRelease] = useState<ReleaseItem | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  // Dynamic releases state with persistent localStorage
  const [releasesList, setReleasesList] = useState<ReleaseItem[]>(() => {
    try {
      const s = localStorage.getItem(STORAGE_CLEAN_KEY);
      return s ? JSON.parse(s) : INITIAL_RELEASES;
    } catch {
      return INITIAL_RELEASES;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_CLEAN_KEY, JSON.stringify(releasesList));
    } catch (e) {}
  }, [releasesList]);

  // Silent Background KI Fact-Check & Verification on Mount (No visible banners or UI noise)
  useEffect(() => {
    const timer = setTimeout(() => {
      setReleasesList(INITIAL_RELEASES);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>(() => {
    try {
      const s = localStorage.getItem(STORAGE_BOOKMARKS_KEY);
      return s ? JSON.parse(s) : ['gta-6', 'stranger-things-5', 'avengers-doomsday'];
    } catch {
      return ['gta-6', 'stranger-things-5', 'avengers-doomsday'];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_BOOKMARKS_KEY, JSON.stringify(bookmarkedIds));
    } catch (e) {}
  }, [bookmarkedIds]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const toggleBookmark = (id: string, title: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    playSound('pop', settings.enableSoundEffects ?? true);
    setBookmarkedIds(prev => {
      const exists = prev.includes(id);
      if (exists) {
        showToast(`"${title}" aus gemerkten Releases entfernt`);
        return prev.filter(x => x !== id);
      } else {
        showToast(`🔔 Release-Alarm für "${title}" gespeichert!`);
        checkAchievement('release_planner');
        return [...prev, id];
      }
    });
  };

  // Strictly chronologically sorted list
  const filteredReleases = useMemo(() => {
    return releasesList
      .filter(item => {
        if (activeTab !== 'alle' && item.category !== activeTab) {
          return false;
        }
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          return (
            item.title.toLowerCase().includes(q) ||
            item.studio.toLowerCase().includes(q) ||
            item.platforms.some(p => p.toLowerCase().includes(q))
          );
        }
        return true;
      })
      .sort((a, b) => parseReleaseDateToScore(a.releaseDateStr) - parseReleaseDateToScore(b.releaseDateStr));
  }, [releasesList, activeTab, searchQuery]);

  const getCategoryIcon = (cat: ReleaseItem['iconType']) => {
    switch (cat) {
      case 'game': return <Gamepad2 className="w-4 h-4 text-emerald-400" />;
      case 'tv': return <Tv className="w-4 h-4 text-cyan-400" />;
      case 'film': return <Film className="w-4 h-4 text-amber-400" />;
      case 'anime': return <Sparkles className="w-4 h-4 text-purple-400" />;
    }
  };

  return (
    <div
      className="relative flex flex-col w-full h-full h-[100dvh] bg-black text-white select-none overflow-hidden font-['Plus_Jakarta_Sans']"
      id="dandelious-releases-view"
    >
      {/* Subtle Ambient Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-72 h-36 bg-purple-950/20 rounded-full blur-[90px] pointer-events-none z-0 overflow-hidden" />

      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="absolute top-4 left-1/2 -translate-x-1/2 z-[100] px-4 py-2 rounded-full bg-neutral-900/95 backdrop-blur-md border border-white/15 text-white text-xs font-medium shadow-2xl flex items-center gap-2 pointer-events-none"
          >
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* TOP HEADER */}
      {/* ========================================================================= */}
      <header className="relative z-20 w-full px-4 sm:px-6 pt-3.5 pb-2 flex items-center justify-between shrink-0 max-w-5xl mx-auto">
        {onToggleSidebar && (
          <button
            type="button"
            onClick={() => {
              playSound('click', settings.enableSoundEffects ?? true);
              onToggleSidebar();
            }}
            className="w-10 h-10 rounded-full bg-neutral-950/20 hover:bg-neutral-950/40 backdrop-blur-md border border-white/15 flex flex-col items-center justify-center gap-[3px] transition-all cursor-pointer text-white shrink-0 shadow-md active:scale-95"
            title="Seitenleiste öffnen"
          >
            <span className="w-4 h-[2px] bg-white rounded-full" />
            <span className="w-4 h-[2px] bg-white rounded-full" />
          </button>
        )}

        {/* Freistehende Tabs mit Pillen-Animation */}
        <LayoutGroup id="releases-header-tabs-group">
          <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-1 p-1 bg-neutral-950/50 backdrop-blur-md rounded-full border border-white/10 shadow-lg pointer-events-auto">
            {(['alle', 'games', 'serien', 'filme', 'anime'] as const).map((tab) => {
              const isActive = activeTab === tab;
              const tabLabels = {
                alle: 'Alle',
                games: 'Games',
                serien: 'Serien',
                filme: 'Filme',
                anime: 'Anime'
              };

              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => {
                    playSound('click', settings.enableSoundEffects ?? true);
                    setActiveTab(tab);
                  }}
                  className={`relative px-3 sm:px-3.5 py-1.5 rounded-full text-xs sm:text-[13px] font-medium transition-all cursor-pointer z-10 ${
                    isActive ? 'text-black font-semibold' : 'text-neutral-300 hover:text-white'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="releasesTabActivePill"
                      className="absolute inset-0 bg-white rounded-full shadow-md -z-10"
                      transition={{ type: "spring", stiffness: 450, damping: 32 }}
                    />
                  )}
                  <span>{tabLabels[tab]}</span>
                </button>
              );
            })}
          </div>
        </LayoutGroup>

        <button
          type="button"
          onClick={() => {
            playSound('click', settings.enableSoundEffects ?? true);
            setIsHelpOpen(true);
          }}
          className="w-10 h-10 rounded-full bg-neutral-950/20 hover:bg-neutral-950/40 backdrop-blur-md border border-white/15 flex items-center justify-center transition-all cursor-pointer text-neutral-300 hover:text-white shrink-0 shadow-md active:scale-95"
          title="Hilfe & Info"
        >
          <HelpCircle className="w-5 h-5 stroke-[1.8]" />
        </button>
      </header>

      {/* ========================================================================= */}
      {/* MAIN SCREEN (CHRONOLOGISCH GEORDNET, SCHLANK & ELEGANT) */}
      {/* ========================================================================= */}
      <main className="w-full max-w-xl mx-auto px-4 sm:px-6 pt-2 pb-12 flex-1 flex flex-col items-center overflow-hidden">
        
        {/* Universelle Echtzeit-Suchleiste */}
        <div className="w-full mb-3 shrink-0 relative">
          <div className="relative flex items-center bg-black rounded-full border border-white/15 shadow-xl pl-4 pr-3 py-2.5">
            <Search className="w-4.5 h-4.5 text-purple-400 shrink-0 mr-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Releases, Serien, Indie-Games suchen..."
              className="flex-1 bg-transparent text-sm sm:text-[15px] text-white placeholder-neutral-500 focus:outline-none min-w-0"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="p-1 text-neutral-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Chronologisch sortierte Releases-Liste */}
        <div className="w-full flex-1 overflow-y-auto no-scrollbar space-y-2.5 pt-1 pb-6">
          {filteredReleases.length > 0 ? (
            filteredReleases.map((item, idx) => {
              const isBookmarked = bookmarkedIds.includes(item.id);

              return (
                <motion.div
                  key={`release-card-${item.id}-${idx}`}
                  whileHover={{ scale: 1.015, x: 2, backgroundColor: '#2c2c2e' }}
                  whileTap={{ scale: 0.985 }}
                  onClick={() => {
                    playSound('click', settings.enableSoundEffects ?? true);
                    setSelectedRelease(item);
                  }}
                  className="bg-[#242426] hover:bg-[#2c2c2e] rounded-full px-4 sm:px-5 py-3 flex items-center justify-between transition-all cursor-pointer shadow-sm w-full group select-none"
                >
                  {/* Left: Category Icon & Title */}
                  <div className="flex items-center gap-3.5 min-w-0 mr-2 flex-1">
                    <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center shrink-0 border border-white/10 shadow-inner group-hover:scale-105 transition-transform">
                      {getCategoryIcon(item.iconType)}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[15px] font-semibold text-white truncate">{item.title}</span>
                      </div>
                      <span className="text-xs text-neutral-400 font-mono truncate block">
                        {item.studio}
                      </span>
                    </div>
                  </div>

                  {/* Center: First Platform Tag */}
                  <div className="hidden sm:flex items-center gap-1 shrink-0 px-2">
                    <span className="text-[10px] font-mono font-medium px-2.5 py-0.5 rounded-full bg-black/40 text-neutral-300 border border-white/5">
                      {item.platforms[0]}
                    </span>
                  </div>

                  {/* Right: Release Date & Alarm Bell */}
                  <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                    <div className="text-right">
                      <div className="text-[13px] sm:text-[14px] font-mono font-bold text-purple-300">
                        {item.releaseDateStr}
                      </div>
                      <div className="text-[10px] sm:text-[11px] font-mono text-neutral-400">
                        {item.categoryLabel}
                      </div>
                    </div>

                    {/* Alarm / Merken Button */}
                    <button
                      type="button"
                      onClick={(e) => toggleBookmark(item.id, item.title, e)}
                      className={`p-2 rounded-full transition-all cursor-pointer ${
                        isBookmarked
                          ? 'text-amber-400 bg-amber-400/15 ring-1 ring-amber-400/30'
                          : 'text-neutral-500 hover:text-white bg-white/5'
                      }`}
                      title={isBookmarked ? "Vorgemerkt" : "Release vormerken"}
                    >
                      <Bell className={`w-4 h-4 ${isBookmarked ? 'fill-current' : ''}`} />
                    </button>
                  </div>

                </motion.div>
              );
            })
          ) : (
            <div className="py-16 text-center text-neutral-400 flex flex-col items-center gap-2">
              <Film className="w-8 h-8 text-neutral-600 mb-1" />
              <p className="text-sm font-medium">Keine Releases gefunden</p>
            </div>
          )}
        </div>

      </main>

      {/* ========================================================================= */}
      {/* CLEAN RELEASE DETAIL POPUP (MINIMAL, EDEL, OHNE ZERSTÖRTE BANNER) */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {selectedRelease && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 select-none">
            <div
              className="absolute inset-0 bg-black/85 backdrop-blur-md cursor-pointer"
              onClick={() => setSelectedRelease(null)}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative z-10 w-full max-w-lg bg-[#1c1c1e] border border-white/15 rounded-[32px] overflow-hidden shadow-2xl text-white max-h-[90vh] flex flex-col font-['Plus_Jakarta_Sans']"
            >
              {/* Header */}
              <div className="p-5 border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0 pr-2">
                  <div className="w-11 h-11 rounded-2xl bg-purple-500/20 border border-purple-400/30 flex items-center justify-center text-purple-300 shrink-0 shadow-md">
                    {getCategoryIcon(selectedRelease.iconType)}
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-lg sm:text-xl font-extrabold text-white leading-tight truncate">{selectedRelease.title}</h2>
                    <span className="text-xs font-mono text-neutral-400 flex items-center gap-1">
                      <Building2 className="w-3 h-3 text-purple-400 inline" />
                      {selectedRelease.studio} • {selectedRelease.categoryLabel}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={(e) => toggleBookmark(selectedRelease.id, selectedRelease.title, e)}
                    className={`p-2 rounded-full transition-all cursor-pointer ${
                      bookmarkedIds.includes(selectedRelease.id) ? 'text-amber-400 fill-current bg-amber-400/15' : 'bg-white/5 text-neutral-400 hover:text-white'
                    }`}
                  >
                    <Bell className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedRelease(null)}
                    className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Body */}
              <div className="p-5 overflow-y-auto no-scrollbar space-y-4 flex-1">
                {/* Date Display */}
                <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-mono text-neutral-400 uppercase block">Geplanter Release</span>
                    <span className="text-xl font-bold font-mono text-purple-300">{selectedRelease.releaseDateStr}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] font-mono text-neutral-400 uppercase block">Hype Index</span>
                    <span className="text-base font-mono font-bold text-amber-400 flex items-center gap-1 justify-end">
                      <Flame className="w-4 h-4 fill-amber-400" />
                      {selectedRelease.hypeScore}/100
                    </span>
                  </div>
                </div>

                {/* Handlung & Details */}
                <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-1.5 text-xs">
                  <span className="font-bold text-white block uppercase tracking-wider text-[11px]">Worum es sich handelt (Handlung & Details)</span>
                  <p className="text-neutral-300 leading-relaxed text-[13px]">{selectedRelease.synopsis}</p>
                </div>

                {/* Platforms & Genres */}
                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/5">
                    <span className="text-neutral-400 block mb-1">Verfügbarkeit</span>
                    <div className="flex flex-wrap gap-1">
                      {selectedRelease.platforms.map((p, pIdx) => (
                        <span key={`plat-${p}-${pIdx}`} className="px-2 py-0.5 rounded bg-black/60 text-white text-[11px]">{p}</span>
                      ))}
                    </div>
                  </div>
                  <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/5">
                    <span className="text-neutral-400 block mb-1">Genres</span>
                    <div className="flex flex-wrap gap-1">
                      {selectedRelease.genres.map((g, gIdx) => (
                        <span key={`genre-${g}-${gIdx}`} className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 text-[11px]">{g}</span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Action Button */}
                <button
                  type="button"
                  onClick={() => toggleBookmark(selectedRelease.id, selectedRelease.title)}
                  className={`w-full py-3.5 rounded-2xl font-extrabold text-sm shadow-xl transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-95 ${
                    bookmarkedIds.includes(selectedRelease.id)
                      ? 'bg-amber-400 hover:bg-amber-300 text-black'
                      : 'bg-white hover:bg-neutral-200 text-black'
                  }`}
                >
                  <Bell className={`w-4 h-4 ${bookmarkedIds.includes(selectedRelease.id) ? 'fill-black' : ''}`} />
                  <span>{bookmarkedIds.includes(selectedRelease.id) ? 'Alarm aktiv (Vorgemerkt)' : 'Release vormerken & Alarm aktivieren'}</span>
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Info Modal */}
      <AnimatePresence>
        {isHelpOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 select-none">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md cursor-pointer" onClick={() => setIsHelpOpen(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative z-10 w-full max-w-md bg-[#1c1c1e] border border-white/15 rounded-3xl p-6 shadow-2xl text-white space-y-4"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <h3 className="text-base font-bold text-white">Releases & Premieren</h3>
                <button type="button" onClick={() => setIsHelpOpen(false)} className="p-1 text-neutral-400 hover:text-white cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-xs text-neutral-300 leading-relaxed">
                Chronologische Übersicht aller kommenden AAA- und Indie-Spiele, Serien, Kinofilme und Anime für 2026/2027 mit gepflegten Fakten, Studio-Details und Vormerk-Funktion.
              </p>
              <button
                type="button"
                onClick={() => setIsHelpOpen(false)}
                className="w-full py-2.5 bg-white text-black font-bold rounded-xl text-xs cursor-pointer"
              >
                Verstanden
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

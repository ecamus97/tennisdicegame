import { INITIAL_RANKING_DATA, getSeason1DefensePoints } from './initialRankingData';

export type Surface = "Hard" | "Clay" | "Grass";

export interface SurfaceAffinity {
  Hard: number;   // -2 to +2: penalty/bonus
  Clay: number;
  Grass: number;
}

export interface PlayerStats {
  wins: number;
  losses: number;
  surfaceWins: Record<Surface, number>;
  surfaceLosses: Record<Surface, number>;
  currentStreak: number; // positive = win streak, negative = loss streak
  bestWinStreak: number;
  titles: number;
}

export interface Player {
  id: number;
  name: string;
  country: string;
  countryCode: string;
  age: number;
  officialRanking: number;
  previousRanking: number; // ranking at start of week (for showing change)
  fictionalRanking: number;
  points: number; // Official ranking points (rolling 52-week)
  livePoints: number; // Points earned in current year only
  previousYearPoints: number[]; // Points to defend per week (52 weeks)
  currentYearWeeklyPoints: number[]; // Points earned this year per week (for next season defense)
  weeklyDefensePoints: number; // Points being defended this week
  weeklyEarnedPoints: number; // Points earned in current week's tournaments
  injured: boolean;
  injuryWeeksRemaining: number;
  surfaceAffinity: SurfaceAffinity;
  stats: PlayerStats;
  retired?: boolean;
  /** 0-100. Builds up from deep tournament runs, decays on weeks not competing. Reduces the chance of entering the next few events. */
  fatigue?: number;
}

// Country code helper
const getCountryData = (name: string): { country: string; countryCode: string } => {
  const countries: Record<string, { country: string; countryCode: string }> = {
    "Carlos Alcaraz": { country: "Spain", countryCode: "ESP" },
    "Jannik Sinner": { country: "Italy", countryCode: "ITA" },
    "Novak Djokovic": { country: "Serbia", countryCode: "SRB" },
    "Alexander Zverev": { country: "Germany", countryCode: "GER" },
    "Lorenzo Musetti": { country: "Italy", countryCode: "ITA" },
    "Alex de Miñaur": { country: "Australia", countryCode: "AUS" },
    "Taylor Fritz": { country: "USA", countryCode: "USA" },
    "Félix Auger-Aliassime": { country: "Canada", countryCode: "CAN" },
    "Ben Shelton": { country: "USA", countryCode: "USA" },
    "Alexander Bublik": { country: "Kazakhstan", countryCode: "KAZ" },
    "Daniil Medvedev": { country: "Russia", countryCode: "RUS" },
    "Casper Ruud": { country: "Norway", countryCode: "NOR" },
    "Jack Draper": { country: "Great Britain", countryCode: "GBR" },
    "Andrey Rublev": { country: "Russia", countryCode: "RUS" },
    "Alejandro Davidovich Fokina": { country: "Spain", countryCode: "ESP" },
    "Jakub Menšík": { country: "Czech Republic", countryCode: "CZE" },
    "Holger Rune": { country: "Denmark", countryCode: "DEN" },
    "Karen Khachanov": { country: "Russia", countryCode: "RUS" },
    "Francisco Cerúndolo": { country: "Argentina", countryCode: "ARG" },
    "Flavio Cobolli": { country: "Italy", countryCode: "ITA" },
    "Jiří Lehečka": { country: "Czech Republic", countryCode: "CZE" },
    "Tommy Paul": { country: "USA", countryCode: "USA" },
    "Luciano Darderi": { country: "Italy", countryCode: "ITA" },
    "Learner Tien": { country: "USA", countryCode: "USA" },
    "Denis Shapovalov": { country: "Canada", countryCode: "CAN" },
    "Cameron Norrie": { country: "Great Britain", countryCode: "GBR" },
    "Valentin Vacherot": { country: "Monaco", countryCode: "MON" },
    "Tomáš Macháč": { country: "Czech Republic", countryCode: "CZE" },
    "Tallon Griekspoor": { country: "Netherlands", countryCode: "NED" },
    "Frances Tiafoe": { country: "USA", countryCode: "USA" },
    "Arthur Rinderknech": { country: "France", countryCode: "FRA" },
    "Brandon Nakashima": { country: "USA", countryCode: "USA" },
    "Stefanos Tsitsipas": { country: "Greece", countryCode: "GRE" },
    "João Fonseca": { country: "Brazil", countryCode: "BRA" },
    "Sebastián Báez": { country: "Argentina", countryCode: "ARG" },
    "Corentin Moutet": { country: "France", countryCode: "FRA" },
    "Jaume Munar": { country: "Spain", countryCode: "ESP" },
    "Ugo Humbert": { country: "France", countryCode: "FRA" },
    "Gabriel Diallo": { country: "Canada", countryCode: "CAN" },
    "Zizou Bergs": { country: "Belgium", countryCode: "BEL" },
    "Alex Michelsen": { country: "USA", countryCode: "USA" },
    "Arthur Fils": { country: "France", countryCode: "FRA" },
    "Grigor Dimitrov": { country: "Bulgaria", countryCode: "BUL" },
    "Daniel Altmaier": { country: "Germany", countryCode: "GER" },
    "Nuno Borges": { country: "Portugal", countryCode: "POR" },
    "Fábián Marozsán": { country: "Hungary", countryCode: "HUN" },
    "Jenson Brooksby": { country: "USA", countryCode: "USA" },
    "Camilo Ugo Carabelli": { country: "Argentina", countryCode: "ARG" },
    "Alexandre Müller": { country: "France", countryCode: "FRA" },
    "Márton Fucsovics": { country: "Hungary", countryCode: "HUN" },
    "Alexei Popyrin": { country: "Australia", countryCode: "AUS" },
    "Hubert Hurkacz": { country: "Poland", countryCode: "POL" },
    "Sebastian Korda": { country: "USA", countryCode: "USA" },
    "Tomás Martín Etcheverry": { country: "Argentina", countryCode: "ARG" },
    "Kamil Majchrzak": { country: "Poland", countryCode: "POL" },
    "Valentin Royer": { country: "France", countryCode: "FRA" },
    "Giovanni Mpetshi Perricard": { country: "France", countryCode: "FRA" },
    "Matteo Berrettini": { country: "Italy", countryCode: "ITA" },
    "Marcos Giron": { country: "USA", countryCode: "USA" },
    "Lorenzo Sonego": { country: "Italy", countryCode: "ITA" },
    "Marin Čilić": { country: "Croatia", countryCode: "CRO" },
    "Damir Džumhur": { country: "Bosnia", countryCode: "BIH" },
    "Reilly Opelka": { country: "USA", countryCode: "USA" },
    "Francisco Comesaña": { country: "Argentina", countryCode: "ARG" },
    "Matteo Arnaldi": { country: "Italy", countryCode: "ITA" },
    "Térence Atmane": { country: "France", countryCode: "FRA" },
    "Botic van de Zandschulp": { country: "Netherlands", countryCode: "NED" },
    "Ethan Quinn": { country: "USA", countryCode: "USA" },
    "Miomir Kecmanović": { country: "Serbia", countryCode: "SRB" },
    "Adrian Mannarino": { country: "France", countryCode: "FRA" },
    "Eliot Spizzirri": { country: "USA", countryCode: "USA" },
    "Raphaël Collignon": { country: "Belgium", countryCode: "BEL" },
    "Alejandro Tabilo": { country: "Chile", countryCode: "CHI" },
    "Mattia Bellucci": { country: "Italy", countryCode: "ITA" },
    "Mariano Navone": { country: "Argentina", countryCode: "ARG" },
    "Arthur Cazaux": { country: "France", countryCode: "FRA" },
    "Pedro Martínez": { country: "Spain", countryCode: "ESP" },
    "Filip Misolic": { country: "Austria", countryCode: "AUT" },
    "Quentin Halys": { country: "France", countryCode: "FRA" },
    "Hamad Medjedović": { country: "Serbia", countryCode: "SRB" },
    "Adam Walton": { country: "Australia", countryCode: "AUS" },
    "Emilio Nava": { country: "USA", countryCode: "USA" },
    "Aleksandar Kovačević": { country: "USA", countryCode: "USA" },
    "Jan-Lennard Struff": { country: "Germany", countryCode: "GER" },
    "Juan Manuel Cerúndolo": { country: "Argentina", countryCode: "ARG" },
    "James Duckworth": { country: "Australia", countryCode: "AUS" },
    "Alexander Shevchenko": { country: "Kazakhstan", countryCode: "KAZ" },
    "Jesper de Jong": { country: "Netherlands", countryCode: "NED" },
    "Roberto Bautista Agut": { country: "Spain", countryCode: "ESP" },
    "Jacob Fearnley": { country: "Great Britain", countryCode: "GBR" },
    "Aleksandar Vukic": { country: "Australia", countryCode: "AUS" },
    "Cristian Garín": { country: "Chile", countryCode: "CHI" },
    "Yannick Hanfmann": { country: "Germany", countryCode: "GER" },
    "Laslo Djere": { country: "Serbia", countryCode: "SRB" },
    "Thiago Agustín Tirante": { country: "Argentina", countryCode: "ARG" },
    "Dalibor Svrčina": { country: "Czech Republic", countryCode: "CZE" },
    "Vít Kopřiva": { country: "Czech Republic", countryCode: "CZE" },
    "Ignacio Buse": { country: "Peru", countryCode: "PER" },
    "Hugo Gaston": { country: "France", countryCode: "FRA" },
    "Pablo Carreño Busta": { country: "Spain", countryCode: "ESP" },
    "Carlos Taberner": { country: "Spain", countryCode: "ESP" },
    "Kyrian Jacquet": { country: "France", countryCode: "FRA" },
    "Rinky Hijikata": { country: "Australia", countryCode: "AUS" },
    "Adolfo Daniel Vallejo": { country: "Paraguay", countryCode: "PAR" },
    "Alexander Blockx": { country: "Belgium", countryCode: "BEL" },
    "Luca Nardi": { country: "Italy", countryCode: "ITA" },
    "Patrick Kypson": { country: "USA", countryCode: "USA" },
    "Shintaro Mochizuki": { country: "Japan", countryCode: "JPN" },
    "Zachary Svajda": { country: "USA", countryCode: "USA" },
    "Jordan Thompson": { country: "Australia", countryCode: "AUS" },
    "Mackenzie McDonald": { country: "USA", countryCode: "USA" },
    "Tomás Barrios Vera": { country: "Chile", countryCode: "CHI" },
    "Stan Wawrinka": { country: "Switzerland", countryCode: "SUI" },
    "Tristan Schoolkate": { country: "Australia", countryCode: "AUS" },
    "David Goffin": { country: "Belgium", countryCode: "BEL" },
    "Otto Virtanen": { country: "Finland", countryCode: "FIN" },
    "Francesco Maestrelli": { country: "Italy", countryCode: "ITA" },
    "Román Andrés Burruchaga": { country: "Argentina", countryCode: "ARG" },
    "Christopher O'Connell": { country: "Australia", countryCode: "AUS" },
    "Elmer Møller": { country: "Denmark", countryCode: "DEN" },
    "Dino Prižmić": { country: "Croatia", countryCode: "CRO" },
    "Chun Hsin Tseng": { country: "Taiwan", countryCode: "TPE" },
    "Dušan Lajović": { country: "Serbia", countryCode: "SRB" },
    "Rafael Jódar": { country: "Spain", countryCode: "ESP" },
    "Jan Choinski": { country: "Great Britain", countryCode: "GBR" },
    "Vilius Gaubas": { country: "Lithuania", countryCode: "LTU" },
    "Luca Van Assche": { country: "France", countryCode: "FRA" },
    "Benjamin Bonzi": { country: "France", countryCode: "FRA" },
    "Billy Harris": { country: "Great Britain", countryCode: "GBR" },
    "Borna Ćorić": { country: "Croatia", countryCode: "CRO" },
    "Yoshihito Nishioka": { country: "Japan", countryCode: "JPN" },
    "Brandon Holt": { country: "USA", countryCode: "USA" },
    "Nicolai Budkov Kjær": { country: "Norway", countryCode: "NOR" },
    "Marco Trungelliti": { country: "Argentina", countryCode: "ARG" },
    "Sebastian Ofner": { country: "Austria", countryCode: "AUT" },
    "Coleman Wong": { country: "Hong Kong", countryCode: "HKG" },
    "Nikoloz Basilashvili": { country: "Georgia", countryCode: "GEO" },
    "Chris Rodesch": { country: "Luxembourg", countryCode: "LUX" },
    "Yunchaokete Bu": { country: "China", countryCode: "CHN" },
    "Nicolás Jarry": { country: "Chile", countryCode: "CHI" },
    "Sho Shimabukuro": { country: "Japan", countryCode: "JPN" },
    "Moez Echargui": { country: "Tunisia", countryCode: "TUN" },
    "Andrea Pellegrino": { country: "Italy", countryCode: "ITA" },
    "Yibing Wu": { country: "China", countryCode: "CHN" },
    "Jaime Faria": { country: "Portugal", countryCode: "POR" },
    "Liam Draxl": { country: "Canada", countryCode: "CAN" },
    "Lukáš Klein": { country: "Slovakia", countryCode: "SVK" },
    "Michael Zheng": { country: "USA", countryCode: "USA" },
    "Hugo Dellien": { country: "Bolivia", countryCode: "BOL" },
    "Titouan Droguet": { country: "France", countryCode: "FRA" },
  };
  return countries[name] || { country: "Unknown", countryCode: "UNK" };
};

// Player names in order
const playerNames = [
  "Carlos Alcaraz",
  "Jannik Sinner",
  "Novak Djokovic",
  "Alexander Zverev",
  "Lorenzo Musetti",
  "Alex de Miñaur",
  "Taylor Fritz",
  "Félix Auger-Aliassime",
  "Ben Shelton",
  "Alexander Bublik",
  "Daniil Medvedev",
  "Casper Ruud",
  "Jack Draper",
  "Andrey Rublev",
  "Alejandro Davidovich Fokina",
  "Jakub Menšík",
  "Holger Rune",
  "Karen Khachanov",
  "Francisco Cerúndolo",
  "Flavio Cobolli",
  "Jiří Lehečka",
  "Tommy Paul",
  "Luciano Darderi",
  "Learner Tien",
  "Denis Shapovalov",
  "Cameron Norrie",
  "Valentin Vacherot",
  "Tomáš Macháč",
  "Tallon Griekspoor",
  "Frances Tiafoe",
  "Arthur Rinderknech",
  "Brandon Nakashima",
  "Stefanos Tsitsipas",
  "João Fonseca",
  "Sebastián Báez",
  "Corentin Moutet",
  "Jaume Munar",
  "Ugo Humbert",
  "Gabriel Diallo",
  "Zizou Bergs",
  "Alex Michelsen",
  "Arthur Fils",
  "Grigor Dimitrov",
  "Daniel Altmaier",
  "Nuno Borges",
  "Fábián Marozsán",
  "Jenson Brooksby",
  "Camilo Ugo Carabelli",
  "Alexandre Müller",
  "Márton Fucsovics",
  "Alexei Popyrin",
  "Hubert Hurkacz",
  "Sebastian Korda",
  "Tomás Martín Etcheverry",
  "Kamil Majchrzak",
  "Valentin Royer",
  "Giovanni Mpetshi Perricard",
  "Matteo Berrettini",
  "Marcos Giron",
  "Lorenzo Sonego",
  "Marin Čilić",
  "Damir Džumhur",
  "Reilly Opelka",
  "Francisco Comesaña",
  "Matteo Arnaldi",
  "Térence Atmane",
  "Botic van de Zandschulp",
  "Ethan Quinn",
  "Miomir Kecmanović",
  "Adrian Mannarino",
  "Eliot Spizzirri",
  "Raphaël Collignon",
  "Alejandro Tabilo",
  "Mattia Bellucci",
  "Mariano Navone",
  "Arthur Cazaux",
  "Pedro Martínez",
  "Filip Misolic",
  "Quentin Halys",
  "Hamad Medjedović",
  "Adam Walton",
  "Emilio Nava",
  "Aleksandar Kovačević",
  "Jan-Lennard Struff",
  "Juan Manuel Cerúndolo",
  "James Duckworth",
  "Alexander Shevchenko",
  "Jesper de Jong",
  "Roberto Bautista Agut",
  "Jacob Fearnley",
  "Aleksandar Vukic",
  "Cristian Garín",
  "Yannick Hanfmann",
  "Laslo Djere",
  "Thiago Agustín Tirante",
  "Dalibor Svrčina",
  "Vít Kopřiva",
  "Ignacio Buse",
  "Hugo Gaston",
  "Pablo Carreño Busta",
  "Carlos Taberner",
  "Kyrian Jacquet",
  "Rinky Hijikata",
  "Adolfo Daniel Vallejo",
  "Alexander Blockx",
  "Luca Nardi",
  "Patrick Kypson",
  "Shintaro Mochizuki",
  "Zachary Svajda",
  "Jordan Thompson",
  "Mackenzie McDonald",
  "Tomás Barrios Vera",
  "Stan Wawrinka",
  "Tristan Schoolkate",
  "David Goffin",
  "Otto Virtanen",
  "Francesco Maestrelli",
  "Román Andrés Burruchaga",
  "Christopher O'Connell",
  "Elmer Møller",
  "Dino Prižmić",
  "Chun Hsin Tseng",
  "Dušan Lajović",
  "Rafael Jódar",
  "Jan Choinski",
  "Vilius Gaubas",
  "Luca Van Assche",
  "Benjamin Bonzi",
  "Billy Harris",
  "Borna Ćorić",
  "Yoshihito Nishioka",
  "Brandon Holt",
  "Nicolai Budkov Kjær",
  "Marco Trungelliti",
  "Sebastian Ofner",
  "Coleman Wong",
  "Nikoloz Basilashvili",
  "Chris Rodesch",
  "Yunchaokete Bu",
  "Nicolás Jarry",
  "Sho Shimabukuro",
  "Moez Echargui",
  "Andrea Pellegrino",
  "Yibing Wu",
  "Jaime Faria",
  "Liam Draxl",
  "Lukáš Klein",
  "Michael Zheng",
  "Hugo Dellien",
  "Titouan Droguet",
];

const SURFACE_AFFINITY: Record<string, { Hard: number; Clay: number; Grass: number }> = {
  // === TOP 10 ===
  "Carlos Alcaraz":               { Hard: 2, Clay: 2, Grass: 2 },  // GS wins on all 3
  "Jannik Sinner":                { Hard: 2, Clay: 1, Grass: 1 },  // Hard dominant, solid clay/grass
  "Novak Djokovic":               { Hard: 2, Clay: 2, Grass: 2 },  // All-surface GOAT
  "Alexander Zverev":             { Hard: 2, Clay: 2, Grass: 0 },  // Hard/Clay, weak grass
  "Lorenzo Musetti":              { Hard: 0, Clay: 2, Grass: 0 },  // Pure clay specialist
  "Alex de Miñaur":               { Hard: 2, Clay: 0, Grass: 1 },  // Hard specialist
  "Taylor Fritz":                 { Hard: 2, Clay: 0, Grass: 1 },  // Hard specialist
  "Félix Auger-Aliassime":        { Hard: 2, Clay: 1, Grass: 1 },  // Well-rounded
  "Ben Shelton":                  { Hard: 2, Clay: 0, Grass: 0 },  // Hard only
  "Alexander Bublik":             { Hard: 1, Clay: 0, Grass: 1 },  // Serve-based, hard/grass
  // === 11-20 ===
  "Daniil Medvedev":              { Hard: 2, Clay: 0, Grass: 0 },  // Hard specialist
  "Casper Ruud":                  { Hard: 0, Clay: 2, Grass: -1 }, // Pure clay
  "Jack Draper":                  { Hard: 1, Clay: 0, Grass: 1 },  // Grass/Hard
  "Andrey Rublev":                { Hard: 2, Clay: 1, Grass: 0 },  // Hard primary
  "Alejandro Davidovich Fokina":  { Hard: 0, Clay: 2, Grass: -1 }, // Clay specialist
  "Jakub Menšík":                 { Hard: 1, Clay: 0, Grass: 0 },  // Hard player
  "Holger Rune":                  { Hard: 1, Clay: 2, Grass: 0 },  // Clay/Hard
  "Karen Khachanov":              { Hard: 1, Clay: 0, Grass: 0 },  // Hard
  "Francisco Cerúndolo":          { Hard: 0, Clay: 2, Grass: -1 }, // Clay specialist
  "Flavio Cobolli":               { Hard: 0, Clay: 1, Grass: 0 },  // Clay-leaning
  // === 21-40 ===
  "Jiří Lehečka":                 { Hard: 1, Clay: 0, Grass: 1 },  // Hard/Grass
  "Tommy Paul":                   { Hard: 2, Clay: 0, Grass: 0 },  // Hard
  "Luciano Darderi":              { Hard: 0, Clay: 2, Grass: -1 }, // Clay
  "Learner Tien":                 { Hard: 1, Clay: 0, Grass: 0 },
  "Denis Shapovalov":             { Hard: 1, Clay: 0, Grass: 1 },  // Hard/Grass
  "Cameron Norrie":               { Hard: 1, Clay: 1, Grass: 1 },  // Solid all-around
  "Valentin Vacherot":            { Hard: 0, Clay: 1, Grass: -1 }, // Clay
  "Tomáš Macháč":                 { Hard: 1, Clay: 1, Grass: 0 },
  "Tallon Griekspoor":            { Hard: 1, Clay: 0, Grass: 0 },
  "Frances Tiafoe":               { Hard: 1, Clay: 0, Grass: 0 },  // Hard
  "Arthur Rinderknech":           { Hard: 1, Clay: 0, Grass: 0 },
  "Brandon Nakashima":            { Hard: 1, Clay: 0, Grass: 0 },
  "Stefanos Tsitsipas":           { Hard: 1, Clay: 2, Grass: 0 },  // Clay specialist
  "João Fonseca":                 { Hard: 1, Clay: 1, Grass: 0 },
  "Sebastián Báez":               { Hard: 0, Clay: 2, Grass: -1 }, // Clay
  "Corentin Moutet":              { Hard: 0, Clay: 1, Grass: 0 },  // Clay-leaning
  "Jaume Munar":                  { Hard: 0, Clay: 1, Grass: -1 }, // Clay
  "Ugo Humbert":                  { Hard: 1, Clay: 0, Grass: 1 },  // Grass/Hard
  "Gabriel Diallo":               { Hard: 1, Clay: 0, Grass: 0 },
  "Zizou Bergs":                  { Hard: 0, Clay: 1, Grass: 0 },  // Clay
  // === 41-60 ===
  "Alex Michelsen":               { Hard: 1, Clay: 0, Grass: 0 },
  "Arthur Fils":                  { Hard: 1, Clay: 1, Grass: 0 },
  "Grigor Dimitrov":              { Hard: 2, Clay: 0, Grass: 1 },  // Hard specialist
  "Daniel Altmaier":              { Hard: 0, Clay: 1, Grass: 0 },  // Clay
  "Nuno Borges":                  { Hard: 0, Clay: 1, Grass: 0 },  // Clay
  "Fábián Marozsán":              { Hard: 0, Clay: 1, Grass: -1 }, // Clay
  "Jenson Brooksby":              { Hard: 1, Clay: 0, Grass: 0 },
  "Camilo Ugo Carabelli":         { Hard: 0, Clay: 2, Grass: -1 }, // Clay
  "Alexandre Müller":             { Hard: 1, Clay: 1, Grass: 0 },
  "Márton Fucsovics":             { Hard: 1, Clay: 0, Grass: 1 },  // Grass/Hard
  "Alexei Popyrin":               { Hard: 1, Clay: 0, Grass: 0 },
  "Hubert Hurkacz":               { Hard: 2, Clay: 0, Grass: 2 },  // Hard/Grass specialist
  "Sebastian Korda":              { Hard: 1, Clay: 0, Grass: 0 },
  "Tomás Martín Etcheverry":      { Hard: -1, Clay: 2, Grass: -1 },// Pure clay
  "Kamil Majchrzak":              { Hard: 1, Clay: 1, Grass: 0 },
  "Valentin Royer":               { Hard: 0, Clay: 1, Grass: -1 }, // Clay
  "Giovanni Mpetshi Perricard":   { Hard: 1, Clay: 0, Grass: 2 },  // Serve → Grass
  "Matteo Berrettini":            { Hard: 1, Clay: 0, Grass: 2 },  // Wimbledon finalist
  "Marcos Giron":                 { Hard: 1, Clay: 0, Grass: 0 },
  "Lorenzo Sonego":               { Hard: 1, Clay: 1, Grass: 0 },
  // === 61-80 ===
  "Marin Čilić":                  { Hard: 1, Clay: 0, Grass: 1 },  // GS on hard
  "Damir Džumhur":                { Hard: 0, Clay: 1, Grass: -1 }, // Clay
  "Reilly Opelka":                { Hard: 2, Clay: -1, Grass: 1 }, // Hard/serve specialist
  "Francisco Comesaña":           { Hard: 0, Clay: 1, Grass: -1 }, // Clay
  "Matteo Arnaldi":               { Hard: 1, Clay: 1, Grass: 0 },
  "Térence Atmane":               { Hard: 1, Clay: 1, Grass: 0 },
  "Botic van de Zandschulp":      { Hard: 0, Clay: 1, Grass: 0 },  // Clay
  "Ethan Quinn":                  { Hard: 1, Clay: 0, Grass: 0 },
  "Miomir Kecmanović":            { Hard: 0, Clay: 1, Grass: 0 },  // Clay
  "Adrian Mannarino":             { Hard: 1, Clay: 0, Grass: 1 },  // Hard/Grass
  "Eliot Spizzirri":              { Hard: 1, Clay: 0, Grass: 0 },
  "Raphaël Collignon":            { Hard: 0, Clay: 1, Grass: -1 }, // Clay
  "Alejandro Tabilo":             { Hard: 1, Clay: 1, Grass: 0 },
  "Mattia Bellucci":              { Hard: 0, Clay: 1, Grass: 0 },  // Clay
  "Mariano Navone":               { Hard: -1, Clay: 2, Grass: -1 },// Pure clay
  "Arthur Cazaux":                { Hard: 0, Clay: 1, Grass: 0 },  // Clay
  "Pedro Martínez":               { Hard: 0, Clay: 1, Grass: -1 }, // Clay
  "Filip Misolic":                { Hard: 0, Clay: 1, Grass: -1 }, // Clay
  "Quentin Halys":                { Hard: 1, Clay: 1, Grass: 0 },
  "Hamad Medjedović":             { Hard: 0, Clay: 1, Grass: -1 }, // Clay
  // === 81-100 ===
  "Adam Walton":                  { Hard: 1, Clay: 0, Grass: 0 },
  "Emilio Nava":                  { Hard: 1, Clay: 0, Grass: 0 },
  "Aleksandar Kovačević":         { Hard: 1, Clay: 1, Grass: 0 },
  "Jan-Lennard Struff":           { Hard: 1, Clay: 0, Grass: 1 },  // Serve/Grass
  "Juan Manuel Cerúndolo":        { Hard: 0, Clay: 1, Grass: -1 }, // Clay
  "James Duckworth":              { Hard: 1, Clay: 0, Grass: 0 },
  "Alexander Shevchenko":         { Hard: 1, Clay: 1, Grass: 0 },
  "Jesper de Jong":               { Hard: 0, Clay: 1, Grass: -1 }, // Clay
  "Roberto Bautista Agut":        { Hard: 1, Clay: 1, Grass: 1 },  // All-around
  "Jacob Fearnley":               { Hard: 1, Clay: 0, Grass: 0 },
  "Aleksandar Vukic":             { Hard: 1, Clay: 0, Grass: 0 },
  "Cristian Garín":               { Hard: -1, Clay: 2, Grass: -1 },// Pure clay
  "Yannick Hanfmann":             { Hard: 0, Clay: 1, Grass: 0 },  // Clay
  "Laslo Djere":                  { Hard: -1, Clay: 2, Grass: -1 },// Pure clay
  "Thiago Agustín Tirante":       { Hard: 0, Clay: 1, Grass: -1 }, // Clay
  "Dalibor Svrčina":              { Hard: 0, Clay: 1, Grass: -1 }, // Clay
  "Vít Kopřiva":                  { Hard: 0, Clay: 1, Grass: -1 }, // Clay
  "Ignacio Buse":                 { Hard: 0, Clay: 1, Grass: -1 }, // Clay
  "Hugo Gaston":                  { Hard: 0, Clay: 1, Grass: -1 }, // Clay
  "Pablo Carreño Busta":          { Hard: 0, Clay: 1, Grass: -1 }, // Clay
  // === 101-150 ===
  "Carlos Taberner":              { Hard: 0, Clay: 1, Grass: -1 },
  "Kyrian Jacquet":               { Hard: 0, Clay: 1, Grass: -1 },
  "Rinky Hijikata":               { Hard: 1, Clay: 0, Grass: 0 },
  "Adolfo Daniel Vallejo":        { Hard: 0, Clay: 1, Grass: -1 },
  "Alexander Blockx":             { Hard: 1, Clay: 1, Grass: 0 },
  "Luca Nardi":                   { Hard: 0, Clay: 1, Grass: 0 },
  "Patrick Kypson":               { Hard: 1, Clay: 0, Grass: 0 },
  "Shintaro Mochizuki":           { Hard: 1, Clay: 0, Grass: 0 },
  "Zachary Svajda":               { Hard: 1, Clay: 0, Grass: 0 },
  "Jordan Thompson":              { Hard: 1, Clay: 0, Grass: 0 },
  "Mackenzie McDonald":           { Hard: 1, Clay: 0, Grass: 0 },
  "Tomás Barrios Vera":           { Hard: 0, Clay: 1, Grass: -1 },
  "Stan Wawrinka":                { Hard: 1, Clay: 2, Grass: 0 },  // Clay/Hard GS winner
  "Tristan Schoolkate":           { Hard: 1, Clay: 0, Grass: 0 },
  "David Goffin":                 { Hard: 1, Clay: 1, Grass: 1 },  // All-round
  "Otto Virtanen":                { Hard: 1, Clay: 0, Grass: 0 },
  "Francesco Maestrelli":         { Hard: 0, Clay: 1, Grass: 0 },
  "Román Andrés Burruchaga":      { Hard: 0, Clay: 1, Grass: -1 },
  "Christopher O'Connell":        { Hard: 1, Clay: 0, Grass: 0 },
  "Elmer Møller":                 { Hard: 1, Clay: 0, Grass: 0 },
  "Dino Prižmić":                 { Hard: 0, Clay: 1, Grass: -1 },
  "Chun Hsin Tseng":              { Hard: 1, Clay: 0, Grass: 0 },
  "Dušan Lajović":                { Hard: 0, Clay: 1, Grass: -1 },
  "Rafael Jódar":                 { Hard: 0, Clay: 1, Grass: -1 },
  "Jan Choinski":                 { Hard: 1, Clay: 0, Grass: 1 },  // British player
  "Vilius Gaubas":                { Hard: 1, Clay: 1, Grass: 0 },
  "Luca Van Assche":              { Hard: 0, Clay: 1, Grass: 0 },
  "Benjamin Bonzi":               { Hard: 1, Clay: 1, Grass: 0 },
  "Billy Harris":                 { Hard: 1, Clay: 0, Grass: 1 },  // British player
  "Borna Ćorić":                  { Hard: 1, Clay: 0, Grass: 0 },
  "Yoshihito Nishioka":           { Hard: 1, Clay: 0, Grass: 0 },
  "Brandon Holt":                 { Hard: 1, Clay: 0, Grass: 0 },
  "Nicolai Budkov Kjær":          { Hard: 1, Clay: 0, Grass: 0 },
  "Marco Trungelliti":            { Hard: 0, Clay: 1, Grass: -1 },
  "Sebastian Ofner":              { Hard: 1, Clay: 1, Grass: 0 },
  "Coleman Wong":                 { Hard: 1, Clay: 0, Grass: 0 },
  "Nikoloz Basilashvili":         { Hard: 1, Clay: 0, Grass: 0 },
  "Chris Rodesch":                { Hard: 1, Clay: 0, Grass: 0 },
  "Yunchaokete Bu":               { Hard: 1, Clay: 0, Grass: 0 },
  "Nicolás Jarry":                { Hard: 1, Clay: 1, Grass: 0 },
  "Sho Shimabukuro":              { Hard: 1, Clay: 0, Grass: 0 },
  "Moez Echargui":                { Hard: 1, Clay: 1, Grass: 0 },
  "Andrea Pellegrino":            { Hard: 0, Clay: 1, Grass: 0 },
  "Yibing Wu":                    { Hard: 1, Clay: 0, Grass: 0 },
  "Jaime Faria":                  { Hard: 0, Clay: 1, Grass: -1 },
  "Liam Draxl":                   { Hard: 1, Clay: 0, Grass: 0 },
  "Lukáš Klein":                  { Hard: 1, Clay: 1, Grass: 0 },
  "Michael Zheng":                { Hard: 1, Clay: 0, Grass: 0 },
  "Hugo Dellien":                 { Hard: 0, Clay: 1, Grass: -1 },
  "Titouan Droguet":              { Hard: 0, Clay: 1, Grass: 0 },
};

// Generate initial players with real points and ages from ranking data
export const initialPlayers: Player[] = playerNames.map((name, index) => {
  const { country, countryCode } = getCountryData(name);
  const rankingData = INITIAL_RANKING_DATA[name];
  const points = rankingData?.points || 0;
  const age = rankingData?.age || 25;
  const defensePoints = getSeason1DefensePoints(name, points);
  return {
    id: index + 1,
    name,
    country,
    countryCode,
    age,
    officialRanking: index + 1,
    previousRanking: index + 1,
    fictionalRanking: index + 1,
    points,
    livePoints: 0,
    previousYearPoints: defensePoints,
    currentYearWeeklyPoints: new Array(52).fill(0),
    weeklyDefensePoints: 0,
    weeklyEarnedPoints: 0,
    injured: false,
    injuryWeeksRemaining: 0,
    fatigue: 0,
    surfaceAffinity: SURFACE_AFFINITY[name] || { Hard: 0, Clay: 0, Grass: 0 },
    stats: {
      wins: 0, losses: 0,
      surfaceWins: { Hard: 0, Clay: 0, Grass: 0 },
      surfaceLosses: { Hard: 0, Clay: 0, Grass: 0 },
      currentStreak: 0,
      bestWinStreak: 0,
      titles: 0,
    },
  };
});

export type TournamentCategory = "Grand Slam" | "Masters 1000" | "ATP 500" | "ATP 250" | "ATP Finals" | "Davis Cup" | "Laver Cup" | "Challenger 175" | "Challenger 125" | "Challenger 100" | "Challenger 75" | "Challenger 50" | "ITF M25" | "ITF M15";

export interface Tournament {
  id: string;
  name: string;
  city: string;
  country: string;
  category: TournamentCategory;
  surface: "Hard" | "Clay" | "Grass";
  week: number;
  playerLimit: number;
  seeds: number;
  isRoundRobin?: boolean;
  points: {
    winner: number;
    finalist: number;
    sf: number;
    qf: number;
    r16: number;
    r32: number;
    r64: number;
    r128: number;
    groupWin?: number;
  };
}

const gs = (id: string, name: string, city: string, country: string, surface: "Hard"|"Clay"|"Grass", week: number): Tournament => ({
  id, name, city, country, category: "Grand Slam", surface, week, playerLimit: 128, seeds: 32,
  points: { winner: 2000, finalist: 1300, sf: 800, qf: 400, r16: 200, r32: 100, r64: 50, r128: 10 },
});
const m1000 = (id: string, name: string, city: string, country: string, surface: "Hard"|"Clay"|"Grass", week: number): Tournament => ({
  id, name, city, country, category: "Masters 1000", surface, week, playerLimit: 64, seeds: 16,
  points: { winner: 1000, finalist: 650, sf: 400, qf: 200, r16: 100, r32: 50, r64: 10, r128: 0 },
});
const atp500 = (id: string, name: string, city: string, country: string, surface: "Hard"|"Clay"|"Grass", week: number): Tournament => ({
  id, name, city, country, category: "ATP 500", surface, week, playerLimit: 32, seeds: 8,
  points: { winner: 500, finalist: 330, sf: 200, qf: 100, r16: 50, r32: 10, r64: 0, r128: 0 },
});
const atp250 = (id: string, name: string, city: string, country: string, surface: "Hard"|"Clay"|"Grass", week: number): Tournament => ({
  id, name, city, country, category: "ATP 250", surface, week, playerLimit: 32, seeds: 8,
  points: { winner: 250, finalist: 165, sf: 100, qf: 50, r16: 25, r32: 0, r64: 0, r128: 0 },
});

export const tournaments: Tournament[] = [
  // Week 1: Brisbane, Hong Kong
  atp250("brisbane", "Brisbane International", "Brisbane", "Australia", "Hard", 1),
  atp250("hong-kong", "Hong Kong Open", "Hong Kong", "China", "Hard", 1),
  // Week 2: Adelaide, Auckland
  atp250("adelaide", "Adelaide International", "Adelaide", "Australia", "Hard", 2),
  atp250("auckland", "Auckland Open", "Auckland", "New Zealand", "Hard", 2),
  // Week 3-4: Australian Open
  gs("ao", "Australian Open", "Melbourne", "Australia", "Hard", 3),
  // Week 5: Montpellier
  atp250("montpellier", "Open Sud de France", "Montpellier", "France", "Hard", 5),
  // Week 6: Dallas, Rotterdam, Buenos Aires
  atp500("dallas", "Dallas Open", "Dallas", "USA", "Hard", 6),
  atp500("rotterdam", "ABN AMRO Open", "Rotterdam", "Netherlands", "Hard", 6),
  atp250("buenos-aires", "Argentina Open", "Buenos Aires", "Argentina", "Clay", 6),
  // Week 7: Doha, Rio, Delray Beach
  atp500("doha", "Qatar Open", "Doha", "Qatar", "Hard", 7),
  atp500("rio", "Rio Open", "Rio de Janeiro", "Brazil", "Clay", 7),
  atp250("delray-beach", "Delray Beach Open", "Delray Beach", "USA", "Hard", 7),
  // Week 8: Acapulco, Dubai, Santiago
  atp500("acapulco", "Abierto Mexicano", "Acapulco", "Mexico", "Hard", 8),
  atp500("dubai", "Dubai Tennis Championships", "Dubai", "UAE", "Hard", 8),
  atp250("santiago", "Chile Open", "Santiago", "Chile", "Clay", 8),
  // Week 9-10: Indian Wells
  m1000("indian-wells", "Indian Wells Masters", "Indian Wells", "USA", "Hard", 9),
  // Week 11-12: Miami
  m1000("miami", "Miami Open", "Miami", "USA", "Hard", 11),
  // Week 13: Bucharest, Houston, Marrakech
  atp250("bucharest", "Bucharest Open", "Bucharest", "Romania", "Clay", 13),
  atp250("houston", "Houston Open", "Houston", "USA", "Clay", 13),
  atp250("marrakech", "Grand Prix de Hassan II", "Marrakech", "Morocco", "Clay", 13),
  // Week 14: Monte Carlo
  m1000("monte-carlo", "Monte-Carlo Masters", "Monaco", "Monaco", "Clay", 14),
  // Week 15: Barcelona, Munich
  atp500("barcelona", "Barcelona Open", "Barcelona", "Spain", "Clay", 15),
  atp500("munich", "BMW Open", "Munich", "Germany", "Clay", 15),
  // Week 16-17: Madrid
  m1000("madrid", "Madrid Open", "Madrid", "Spain", "Clay", 16),
  // Week 18-19: Rome
  m1000("rome", "Italian Open", "Rome", "Italy", "Clay", 18),
  // Week 20: Hamburg, Geneva
  atp500("hamburg", "Hamburg Open", "Hamburg", "Germany", "Clay", 20),
  atp250("geneva", "Geneva Open", "Geneva", "Switzerland", "Clay", 20),
  // Week 21-22: Roland Garros
  gs("rg", "Roland Garros", "Paris", "France", "Clay", 21),
  // Week 23: 's-Hertogenbosch, Stuttgart
  atp250("hertogenbosch", "Libéma Open", "'s-Hertogenbosch", "Netherlands", "Grass", 23),
  atp250("stuttgart", "Stuttgart Open", "Stuttgart", "Germany", "Grass", 23),
  // Week 24: Halle, Queen's
  atp500("halle", "Halle Open", "Halle", "Germany", "Grass", 24),
  atp500("queens", "Queen's Club Championships", "London", "Great Britain", "Grass", 24),
  // Week 25: Mallorca, Eastbourne
  atp250("mallorca", "Mallorca Championships", "Mallorca", "Spain", "Grass", 25),
  atp250("eastbourne", "Eastbourne International", "Eastbourne", "Great Britain", "Grass", 25),
  // Week 26-27: Wimbledon
  gs("wimbledon", "Wimbledon", "London", "Great Britain", "Grass", 26),
  // Week 28: Båstad, Gstaad, Umag
  atp250("bastad", "Swedish Open", "Båstad", "Sweden", "Clay", 28),
  atp250("gstaad", "Swiss Open Gstaad", "Gstaad", "Switzerland", "Clay", 28),
  atp250("umag", "Croatia Open", "Umag", "Croatia", "Clay", 28),
  // Week 29: Kitzbühel, Estoril
  atp250("kitzbuhel", "Generali Open", "Kitzbühel", "Austria", "Clay", 29),
  atp250("estoril", "Estoril Open", "Estoril", "Portugal", "Clay", 29),
  // Week 30: Washington, Los Cabos
  atp500("washington", "Citi Open", "Washington", "USA", "Hard", 30),
  atp250("los-cabos", "Los Cabos Open", "Los Cabos", "Mexico", "Hard", 30),
  // Week 31-32: Canadian Open
  m1000("canada", "Canadian Open", "Montreal", "Canada", "Hard", 31),
  // Week 33-34: Cincinnati
  m1000("cincinnati", "Cincinnati Masters", "Cincinnati", "USA", "Hard", 33),
  // Week 34: Winston-Salem
  atp250("winston-salem", "Winston-Salem Open", "Winston-Salem", "USA", "Hard", 34),
  // Week 35-36: US Open
  gs("uso", "US Open", "New York", "USA", "Hard", 35),
  // Week 38: Chengdu, Hangzhou, Laver Cup
  atp250("chengdu", "Chengdu Open", "Chengdu", "China", "Hard", 38),
  atp250("hangzhou", "Hangzhou Open", "Hangzhou", "China", "Hard", 38),
  {
    id: "laver-cup", name: "Laver Cup", city: "San Francisco", country: "USA",
    category: "Laver Cup", surface: "Hard", week: 38, playerLimit: 12, seeds: 0,
    points: { winner: 0, finalist: 0, sf: 0, qf: 0, r16: 0, r32: 0, r64: 0, r128: 0 },
  },
  // Week 39: Tokyo, Beijing
  atp500("tokyo", "Japan Open", "Tokyo", "Japan", "Hard", 39),
  atp500("beijing", "China Open", "Beijing", "China", "Hard", 39),
  // Week 40-41: Shanghai
  m1000("shanghai", "Shanghai Masters", "Shanghai", "China", "Hard", 40),
  // Week 42: Almaty, Brussels, Lyon
  atp250("almaty", "Almaty Open", "Almaty", "Kazakhstan", "Hard", 42),
  atp250("brussels", "European Open", "Brussels", "Belgium", "Hard", 42),
  atp250("lyon", "Open de Lyon", "Lyon", "France", "Hard", 42),
  // Week 43: Basel, Vienna
  atp500("basel", "Swiss Indoors", "Basel", "Switzerland", "Hard", 43),
  atp500("vienna", "Erste Bank Open", "Vienna", "Austria", "Hard", 43),
  // Week 44: Paris Masters
  m1000("paris", "Paris Masters", "Paris", "France", "Hard", 44),
  // Week 45: Stockholm
  atp250("stockholm", "Stockholm Open", "Stockholm", "Sweden", "Hard", 45),
  // Week 46: ATP Finals
  {
    id: "atp-finals", name: "ATP Finals", city: "Turin", country: "Italy",
    category: "ATP Finals", surface: "Hard", week: 46, playerLimit: 8, seeds: 8,
    isRoundRobin: true,
    points: { winner: 500, finalist: 0, sf: 400, qf: 0, r16: 0, r32: 0, r64: 0, r128: 0, groupWin: 200 },
  },
  // Week 4: Davis Cup Qualifiers R1, World Group I & II Playoffs (Round 1) - the week right after
  // the Australian Open, with no other ATP tournament scheduled (keep in sync with DAVIS_CUP_FEB_WEEK
  // in src/data/davisCupData.ts).
  {
    id: "davis-cup-feb", name: "Davis Cup Qualifiers & Play-offs", city: "Various", country: "World",
    category: "Davis Cup", surface: "Hard", week: 4, playerLimit: 32, seeds: 0,
    points: { winner: 0, finalist: 0, sf: 0, qf: 0, r16: 0, r32: 0, r64: 0, r128: 0 },
  },
  // Week 37: Davis Cup Qualifiers R2, World Group I & II Playoffs (Round 2) - a free week with no
  // other ATP tournament (keep in sync with DAVIS_CUP_SEPT_WEEK in src/data/davisCupData.ts).
  {
    id: "davis-cup-sept", name: "Davis Cup Qualifiers R2 & Play-offs", city: "Various", country: "World",
    category: "Davis Cup", surface: "Hard", week: 37, playerLimit: 32, seeds: 0,
    points: { winner: 0, finalist: 0, sf: 0, qf: 0, r16: 0, r32: 0, r64: 0, r128: 0 },
  },
  // Week 48: Davis Cup Final Eight
  {
    id: "davis-cup-final8", name: "Davis Cup Final Eight", city: "Bologna", country: "Italy",
    category: "Davis Cup", surface: "Hard", week: 48, playerLimit: 32, seeds: 0,
    points: { winner: 0, finalist: 0, sf: 0, qf: 0, r16: 0, r32: 0, r64: 0, r128: 0 },
  },
];

export const getCategoryColor = (category: TournamentCategory): string => {
  switch (category) {
    case "Grand Slam": return "tournament-badge-gs";
    case "Masters 1000": return "tournament-badge-m1000";
    case "ATP 500": return "tournament-badge-500";
    case "ATP 250": return "tournament-badge-250";
    case "ATP Finals": return "tournament-badge-gs";
    case "Davis Cup": return "tournament-badge-m1000";
    case "Laver Cup": return "tournament-badge-500";
    case "Challenger 175": return "tournament-badge-250";
    case "Challenger 125": return "tournament-badge-250";
    case "Challenger 100": return "tournament-badge-250";
    case "Challenger 75": return "tournament-badge-250";
    case "Challenger 50": return "tournament-badge-250";
    default: return "tournament-badge-250";
  }
};

export const getSurfaceEmoji = (surface: "Hard" | "Clay" | "Grass"): string => {
  switch (surface) {
    case "Hard": return "🔵";
    case "Clay": return "🟤";
    case "Grass": return "🟢";
  }
};

// European country codes for Laver Cup
export const EUROPEAN_COUNTRY_CODES = new Set([
  "ESP", "ITA", "SRB", "GER", "FRA", "GBR", "NOR", "DEN", "CZE", "NED",
  "BEL", "GRE", "BUL", "HUN", "POL", "AUT", "CRO", "BIH", "GEO", "POR",
  "SVK", "LTU", "FIN", "SUI", "LUX", "MON", "RUS", "SWE",
]);

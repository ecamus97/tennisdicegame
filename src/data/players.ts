export interface Player {
  id: number;
  name: string;
  country: string;
  countryCode: string;
  officialRanking: number;
  fictionalRanking: number;
  points: number;
  injured: boolean;
  injuryWeeksRemaining: number;
}

// Top 150 ATP players pool (based on current rankings)
export const initialPlayers: Player[] = [
  { id: 1, name: "Jannik Sinner", country: "Italy", countryCode: "ITA", officialRanking: 1, fictionalRanking: 1, points: 11830, injured: false, injuryWeeksRemaining: 0 },
  { id: 2, name: "Alexander Zverev", country: "Germany", countryCode: "GER", officialRanking: 2, fictionalRanking: 2, points: 8135, injured: false, injuryWeeksRemaining: 0 },
  { id: 3, name: "Carlos Alcaraz", country: "Spain", countryCode: "ESP", officialRanking: 3, fictionalRanking: 3, points: 7210, injured: false, injuryWeeksRemaining: 0 },
  { id: 4, name: "Taylor Fritz", country: "USA", countryCode: "USA", officialRanking: 4, fictionalRanking: 4, points: 5100, injured: false, injuryWeeksRemaining: 0 },
  { id: 5, name: "Daniil Medvedev", country: "Russia", countryCode: "RUS", officialRanking: 5, fictionalRanking: 5, points: 4800, injured: false, injuryWeeksRemaining: 0 },
  { id: 6, name: "Casper Ruud", country: "Norway", countryCode: "NOR", officialRanking: 6, fictionalRanking: 6, points: 4595, injured: false, injuryWeeksRemaining: 0 },
  { id: 7, name: "Novak Djokovic", country: "Serbia", countryCode: "SRB", officialRanking: 7, fictionalRanking: 7, points: 3900, injured: false, injuryWeeksRemaining: 0 },
  { id: 8, name: "Alex de Minaur", country: "Australia", countryCode: "AUS", officialRanking: 8, fictionalRanking: 8, points: 3745, injured: false, injuryWeeksRemaining: 0 },
  { id: 9, name: "Tommy Paul", country: "USA", countryCode: "USA", officialRanking: 9, fictionalRanking: 9, points: 3445, injured: false, injuryWeeksRemaining: 0 },
  { id: 10, name: "Andrey Rublev", country: "Russia", countryCode: "RUS", officialRanking: 10, fictionalRanking: 10, points: 3130, injured: false, injuryWeeksRemaining: 0 },
  { id: 11, name: "Grigor Dimitrov", country: "Bulgaria", countryCode: "BUL", officialRanking: 11, fictionalRanking: 11, points: 3100, injured: false, injuryWeeksRemaining: 0 },
  { id: 12, name: "Holger Rune", country: "Denmark", countryCode: "DEN", officialRanking: 12, fictionalRanking: 12, points: 2900, injured: false, injuryWeeksRemaining: 0 },
  { id: 13, name: "Stefanos Tsitsipas", country: "Greece", countryCode: "GRE", officialRanking: 13, fictionalRanking: 13, points: 2755, injured: false, injuryWeeksRemaining: 0 },
  { id: 14, name: "Jack Draper", country: "Great Britain", countryCode: "GBR", officialRanking: 14, fictionalRanking: 14, points: 2650, injured: false, injuryWeeksRemaining: 0 },
  { id: 15, name: "Frances Tiafoe", country: "USA", countryCode: "USA", officialRanking: 15, fictionalRanking: 15, points: 2600, injured: false, injuryWeeksRemaining: 0 },
  { id: 16, name: "Lorenzo Musetti", country: "Italy", countryCode: "ITA", officialRanking: 16, fictionalRanking: 16, points: 2560, injured: false, injuryWeeksRemaining: 0 },
  { id: 17, name: "Hubert Hurkacz", country: "Poland", countryCode: "POL", officialRanking: 17, fictionalRanking: 17, points: 2500, injured: false, injuryWeeksRemaining: 0 },
  { id: 18, name: "Sebastian Korda", country: "USA", countryCode: "USA", officialRanking: 18, fictionalRanking: 18, points: 2300, injured: false, injuryWeeksRemaining: 0 },
  { id: 19, name: "Ugo Humbert", country: "France", countryCode: "FRA", officialRanking: 19, fictionalRanking: 19, points: 2250, injured: false, injuryWeeksRemaining: 0 },
  { id: 20, name: "Karen Khachanov", country: "Russia", countryCode: "RUS", officialRanking: 20, fictionalRanking: 20, points: 2200, injured: false, injuryWeeksRemaining: 0 },
  { id: 21, name: "Ben Shelton", country: "USA", countryCode: "USA", officialRanking: 21, fictionalRanking: 21, points: 2150, injured: false, injuryWeeksRemaining: 0 },
  { id: 22, name: "Felix Auger-Aliassime", country: "Canada", countryCode: "CAN", officialRanking: 22, fictionalRanking: 22, points: 2100, injured: false, injuryWeeksRemaining: 0 },
  { id: 23, name: "Arthur Fils", country: "France", countryCode: "FRA", officialRanking: 23, fictionalRanking: 23, points: 2050, injured: false, injuryWeeksRemaining: 0 },
  { id: 24, name: "Alejandro Tabilo", country: "Chile", countryCode: "CHI", officialRanking: 24, fictionalRanking: 24, points: 2000, injured: false, injuryWeeksRemaining: 0 },
  { id: 25, name: "Francisco Cerundolo", country: "Argentina", countryCode: "ARG", officialRanking: 25, fictionalRanking: 25, points: 1950, injured: false, injuryWeeksRemaining: 0 },
  { id: 26, name: "Tallon Griekspoor", country: "Netherlands", countryCode: "NED", officialRanking: 26, fictionalRanking: 26, points: 1900, injured: false, injuryWeeksRemaining: 0 },
  { id: 27, name: "Tomas Machac", country: "Czech Republic", countryCode: "CZE", officialRanking: 27, fictionalRanking: 27, points: 1850, injured: false, injuryWeeksRemaining: 0 },
  { id: 28, name: "Matteo Berrettini", country: "Italy", countryCode: "ITA", officialRanking: 28, fictionalRanking: 28, points: 1800, injured: false, injuryWeeksRemaining: 0 },
  { id: 29, name: "Flavio Cobolli", country: "Italy", countryCode: "ITA", officialRanking: 29, fictionalRanking: 29, points: 1750, injured: false, injuryWeeksRemaining: 0 },
  { id: 30, name: "Giovanni Mpetshi Perricard", country: "France", countryCode: "FRA", officialRanking: 30, fictionalRanking: 30, points: 1700, injured: false, injuryWeeksRemaining: 0 },
  { id: 31, name: "Jordan Thompson", country: "Australia", countryCode: "AUS", officialRanking: 31, fictionalRanking: 31, points: 1650, injured: false, injuryWeeksRemaining: 0 },
  { id: 32, name: "Jakub Mensik", country: "Czech Republic", countryCode: "CZE", officialRanking: 32, fictionalRanking: 32, points: 1600, injured: false, injuryWeeksRemaining: 0 },
  // Generate remaining players 33-150
  ...Array.from({ length: 118 }, (_, i) => ({
    id: 33 + i,
    name: `Player ${33 + i}`,
    country: ["Spain", "France", "USA", "Argentina", "Italy", "Germany", "Australia", "Serbia", "Russia", "Japan"][i % 10],
    countryCode: ["ESP", "FRA", "USA", "ARG", "ITA", "GER", "AUS", "SRB", "RUS", "JPN"][i % 10],
    officialRanking: 33 + i,
    fictionalRanking: 33 + i,
    points: Math.max(100, 1550 - (i * 10)),
    injured: false,
    injuryWeeksRemaining: 0,
  })),
];

export type TournamentCategory = "Grand Slam" | "Masters 1000" | "ATP 500" | "ATP 250" | "ATP Finals";

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
  points: {
    winner: number;
    finalist: number;
    sf: number;
    qf: number;
    r16: number;
    r32: number;
    r64: number;
    r128: number;
  };
}

export const tournaments: Tournament[] = [
  // Week 1-2: Australian Open
  { id: "ao", name: "Australian Open", city: "Melbourne", country: "Australia", category: "Grand Slam", surface: "Hard", week: 1, playerLimit: 128, seeds: 32, points: { winner: 2000, finalist: 1300, sf: 800, qf: 400, r16: 200, r32: 100, r64: 50, r128: 10 } },
  
  // Week 3
  { id: "adelaide", name: "Adelaide International", city: "Adelaide", country: "Australia", category: "ATP 250", surface: "Hard", week: 3, playerLimit: 32, seeds: 8, points: { winner: 250, finalist: 165, sf: 100, qf: 50, r16: 25, r32: 0, r64: 0, r128: 0 } },
  
  // Week 4
  { id: "montpellier", name: "Open Sud de France", city: "Montpellier", country: "France", category: "ATP 250", surface: "Hard", week: 4, playerLimit: 32, seeds: 8, points: { winner: 250, finalist: 165, sf: 100, qf: 50, r16: 25, r32: 0, r64: 0, r128: 0 } },
  
  // Week 5: Rotterdam
  { id: "rotterdam", name: "ABN AMRO Open", city: "Rotterdam", country: "Netherlands", category: "ATP 500", surface: "Hard", week: 5, playerLimit: 32, seeds: 8, points: { winner: 500, finalist: 330, sf: 200, qf: 100, r16: 50, r32: 10, r64: 0, r128: 0 } },
  
  // Week 6
  { id: "doha", name: "Qatar Open", city: "Doha", country: "Qatar", category: "ATP 500", surface: "Hard", week: 6, playerLimit: 32, seeds: 8, points: { winner: 500, finalist: 330, sf: 200, qf: 100, r16: 50, r32: 10, r64: 0, r128: 0 } },
  
  // Week 7
  { id: "dubai", name: "Dubai Tennis Championships", city: "Dubai", country: "UAE", category: "ATP 500", surface: "Hard", week: 7, playerLimit: 32, seeds: 8, points: { winner: 500, finalist: 330, sf: 200, qf: 100, r16: 50, r32: 10, r64: 0, r128: 0 } },
  
  // Week 8-9: Indian Wells
  { id: "indian-wells", name: "Indian Wells Masters", city: "Indian Wells", country: "USA", category: "Masters 1000", surface: "Hard", week: 8, playerLimit: 64, seeds: 16, points: { winner: 1000, finalist: 650, sf: 400, qf: 200, r16: 100, r32: 50, r64: 10, r128: 0 } },
  
  // Week 10-11: Miami
  { id: "miami", name: "Miami Open", city: "Miami", country: "USA", category: "Masters 1000", surface: "Hard", week: 10, playerLimit: 64, seeds: 16, points: { winner: 1000, finalist: 650, sf: 400, qf: 200, r16: 100, r32: 50, r64: 10, r128: 0 } },
  
  // Week 12-13: Monte-Carlo
  { id: "monte-carlo", name: "Monte-Carlo Masters", city: "Monaco", country: "Monaco", category: "Masters 1000", surface: "Clay", week: 12, playerLimit: 64, seeds: 16, points: { winner: 1000, finalist: 650, sf: 400, qf: 200, r16: 100, r32: 50, r64: 10, r128: 0 } },
  
  // Week 14
  { id: "barcelona", name: "Barcelona Open", city: "Barcelona", country: "Spain", category: "ATP 500", surface: "Clay", week: 14, playerLimit: 32, seeds: 8, points: { winner: 500, finalist: 330, sf: 200, qf: 100, r16: 50, r32: 10, r64: 0, r128: 0 } },
  
  // Week 15: Madrid
  { id: "madrid", name: "Madrid Open", city: "Madrid", country: "Spain", category: "Masters 1000", surface: "Clay", week: 15, playerLimit: 64, seeds: 16, points: { winner: 1000, finalist: 650, sf: 400, qf: 200, r16: 100, r32: 50, r64: 10, r128: 0 } },
  
  // Week 16-17: Rome
  { id: "rome", name: "Italian Open", city: "Rome", country: "Italy", category: "Masters 1000", surface: "Clay", week: 17, playerLimit: 64, seeds: 16, points: { winner: 1000, finalist: 650, sf: 400, qf: 200, r16: 100, r32: 50, r64: 10, r128: 0 } },
  
  // Week 18-19: Roland Garros
  { id: "rg", name: "Roland Garros", city: "Paris", country: "France", category: "Grand Slam", surface: "Clay", week: 19, playerLimit: 128, seeds: 32, points: { winner: 2000, finalist: 1300, sf: 800, qf: 400, r16: 200, r32: 100, r64: 50, r128: 10 } },
  
  // Week 21: Queen's
  { id: "queens", name: "Queen's Club Championships", city: "London", country: "Great Britain", category: "ATP 500", surface: "Grass", week: 21, playerLimit: 32, seeds: 8, points: { winner: 500, finalist: 330, sf: 200, qf: 100, r16: 50, r32: 10, r64: 0, r128: 0 } },
  
  // Week 22: Halle
  { id: "halle", name: "Halle Open", city: "Halle", country: "Germany", category: "ATP 500", surface: "Grass", week: 22, playerLimit: 32, seeds: 8, points: { winner: 500, finalist: 330, sf: 200, qf: 100, r16: 50, r32: 10, r64: 0, r128: 0 } },
  
  // Week 23-24: Wimbledon
  { id: "wimbledon", name: "Wimbledon", city: "London", country: "Great Britain", category: "Grand Slam", surface: "Grass", week: 23, playerLimit: 128, seeds: 32, points: { winner: 2000, finalist: 1300, sf: 800, qf: 400, r16: 200, r32: 100, r64: 50, r128: 10 } },
  
  // Week 25: Hamburg
  { id: "hamburg", name: "Hamburg Open", city: "Hamburg", country: "Germany", category: "ATP 500", surface: "Clay", week: 25, playerLimit: 32, seeds: 8, points: { winner: 500, finalist: 330, sf: 200, qf: 100, r16: 50, r32: 10, r64: 0, r128: 0 } },
  
  // Week 27-28: Canada (Rogers Cup)
  { id: "canada", name: "Canadian Open", city: "Toronto", country: "Canada", category: "Masters 1000", surface: "Hard", week: 27, playerLimit: 64, seeds: 16, points: { winner: 1000, finalist: 650, sf: 400, qf: 200, r16: 100, r32: 50, r64: 10, r128: 0 } },
  
  // Week 29: Cincinnati
  { id: "cincinnati", name: "Cincinnati Masters", city: "Cincinnati", country: "USA", category: "Masters 1000", surface: "Hard", week: 29, playerLimit: 64, seeds: 16, points: { winner: 1000, finalist: 650, sf: 400, qf: 200, r16: 100, r32: 50, r64: 10, r128: 0 } },
  
  // Week 30-31: US Open
  { id: "uso", name: "US Open", city: "New York", country: "USA", category: "Grand Slam", surface: "Hard", week: 31, playerLimit: 128, seeds: 32, points: { winner: 2000, finalist: 1300, sf: 800, qf: 400, r16: 200, r32: 100, r64: 50, r128: 10 } },
  
  // Week 33: Chengdu
  { id: "chengdu", name: "Chengdu Open", city: "Chengdu", country: "China", category: "ATP 250", surface: "Hard", week: 33, playerLimit: 32, seeds: 8, points: { winner: 250, finalist: 165, sf: 100, qf: 50, r16: 25, r32: 0, r64: 0, r128: 0 } },
  
  // Week 34: Tokyo
  { id: "tokyo", name: "Japan Open", city: "Tokyo", country: "Japan", category: "ATP 500", surface: "Hard", week: 34, playerLimit: 32, seeds: 8, points: { winner: 500, finalist: 330, sf: 200, qf: 100, r16: 50, r32: 10, r64: 0, r128: 0 } },
  
  // Week 35: Shanghai
  { id: "shanghai", name: "Shanghai Masters", city: "Shanghai", country: "China", category: "Masters 1000", surface: "Hard", week: 35, playerLimit: 64, seeds: 16, points: { winner: 1000, finalist: 650, sf: 400, qf: 200, r16: 100, r32: 50, r64: 10, r128: 0 } },
  
  // Week 37: Vienna
  { id: "vienna", name: "Erste Bank Open", city: "Vienna", country: "Austria", category: "ATP 500", surface: "Hard", week: 37, playerLimit: 32, seeds: 8, points: { winner: 500, finalist: 330, sf: 200, qf: 100, r16: 50, r32: 10, r64: 0, r128: 0 } },
  
  // Week 38: Paris Masters
  { id: "paris", name: "Paris Masters", city: "Paris", country: "France", category: "Masters 1000", surface: "Hard", week: 38, playerLimit: 64, seeds: 16, points: { winner: 1000, finalist: 650, sf: 400, qf: 200, r16: 100, r32: 50, r64: 10, r128: 0 } },
  
  // Week 40: ATP Finals
  { id: "atp-finals", name: "ATP Finals", city: "Turin", country: "Italy", category: "ATP Finals", surface: "Hard", week: 40, playerLimit: 8, seeds: 8, points: { winner: 1500, finalist: 1000, sf: 600, qf: 0, r16: 0, r32: 0, r64: 0, r128: 0 } },
];

export const getCategoryColor = (category: TournamentCategory): string => {
  switch (category) {
    case "Grand Slam": return "tournament-badge-gs";
    case "Masters 1000": return "tournament-badge-m1000";
    case "ATP 500": return "tournament-badge-500";
    case "ATP 250": return "tournament-badge-250";
    case "ATP Finals": return "tournament-badge-gs";
  }
};

export const getSurfaceEmoji = (surface: "Hard" | "Clay" | "Grass"): string => {
  switch (surface) {
    case "Hard": return "🔵";
    case "Clay": return "🟤";
    case "Grass": return "🟢";
  }
};

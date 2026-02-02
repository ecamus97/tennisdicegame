export interface Player {
  id: number;
  name: string;
  country: string;
  countryCode: string;
  officialRanking: number;
  fictionalRanking: number;
  points: number; // Official ranking points (rolling 52-week)
  livePoints: number; // Points earned in current year only
  previousYearPoints: number[]; // Points from previous year per week (52 weeks)
  injured: boolean;
  injuryWeeksRemaining: number;
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

// Generate initial players with 0 points
export const initialPlayers: Player[] = playerNames.map((name, index) => {
  const { country, countryCode } = getCountryData(name);
  return {
    id: index + 1,
    name,
    country,
    countryCode,
    officialRanking: index + 1,
    fictionalRanking: index + 1,
    points: 0, // Start with 0 points
    livePoints: 0, // No points in current year
    previousYearPoints: new Array(52).fill(0), // No previous year points initially
    injured: false,
    injuryWeeksRemaining: 0,
  };
});

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

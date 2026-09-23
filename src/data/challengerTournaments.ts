// Full Challenger Tour Calendar
import { Surface } from './players';

export type ChallengerCategory = "Challenger 175" | "Challenger 125" | "Challenger 100" | "Challenger 75" | "Challenger 50" | "ITF M25" | "ITF M15";

export interface ChallengerTournament {
  id: string;
  name: string;
  city: string;
  country: string;
  category: ChallengerCategory;
  surface: Surface;
  week: number;
  playerLimit: number;
  seeds: number;
  prizeMoney: number;
  points: {
    winner: number;
    finalist: number;
    sf: number;
    qf: number;
    r16: number;
    r32: number;
  };
}

// Points distribution per Challenger category (from reference image)
const challengerPoints: Record<ChallengerCategory, ChallengerTournament['points']> = {
  "Challenger 175": { winner: 175, finalist: 90, sf: 50, qf: 25, r16: 13, r32: 0 },
  "Challenger 125": { winner: 125, finalist: 64, sf: 35, qf: 16, r16: 8, r32: 0 },
  "Challenger 100": { winner: 100, finalist: 50, sf: 25, qf: 14, r16: 7, r32: 0 },
  "Challenger 75":  { winner: 75, finalist: 44, sf: 22, qf: 12, r16: 6, r32: 0 },
  "Challenger 50":  { winner: 50, finalist: 25, sf: 14, qf: 8, r16: 4, r32: 0 },
  "ITF M25":        { winner: 25, finalist: 16, sf: 8, qf: 3, r16: 1, r32: 0 },
  "ITF M15":        { winner: 15, finalist: 8, sf: 4, qf: 2, r16: 1, r32: 0 },
};

function parseSurface(s: string): Surface {
  if (s.toLowerCase().includes('clay')) return 'Clay';
  if (s.toLowerCase().includes('grass')) return 'Grass';
  return 'Hard';
}

function parsePrizeMoney(s: string): number {
  return parseInt(s.replace(/[$,]/g, ''), 10) || 0;
}

function makeId(name: string, week: number): string {
  return `ch-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')}-w${week}`;
}

function getCategoryFromLevel(level: number): ChallengerCategory {
  if (level >= 175) return "Challenger 175";
  if (level >= 125) return "Challenger 125";
  if (level >= 100) return "Challenger 100";
  if (level >= 75) return "Challenger 75";
  if (level >= 25) return "Challenger 50";
  if (level >= 15) return "ITF M25";
  return "ITF M15";
}

// Map country names from Spanish to English for consistency
function normalizeCountry(c: string): string {
  const map: Record<string, string> = {
    'España': 'Spain', 'Francia': 'France', 'Alemania': 'Germany', 'Italia': 'Italy',
    'EE. UU.': 'USA', 'Reino Unido': 'Great Britain', 'Tailandia': 'Thailand',
    'Suiza': 'Switzerland', 'Bolivia': 'Bolivia', 'Ruanda': 'Rwanda',
    'Hungría': 'Hungary', 'Croacia': 'Croatia', 'México': 'Mexico',
    'Bélgica': 'Belgium', 'Baréin': 'Bahrain', 'Corea del Sur': 'South Korea',
    'Rep. Checa': 'Czech Republic', 'Canadá': 'Canada', 'Finlandia': 'Finland',
    'Japón': 'Japan', 'Perú': 'Peru', 'Taiwán': 'Taiwan', 'Túnez': 'Tunisia',
    'Eslovaquia': 'Slovakia', 'Rumania': 'Romania', 'Kazajistán': 'Kazakhstan',
    'Países Bajos': 'Netherlands', 'Macedonia': 'North Macedonia',
    'Polonia': 'Poland', 'Rep. Dominicana': 'Dominican Republic',
    'Ecuador': 'Ecuador', 'Nueva Caledonia': 'New Caledonia',
    'Austria': 'Austria', 'Paraguay': 'Paraguay', 'Uruguay': 'Uruguay',
    'China': 'China', 'Georgia': 'Georgia', 'San Marino': 'San Marino',
    'Colombia': 'Colombia', 'Chile': 'Chile', 'Bulgaria': 'Bulgaria',
    'Brasil': 'Brazil', 'Portugal': 'Portugal', 'Argentina': 'Argentina',
    'Australia': 'Australia', 'India': 'India',
  };
  return map[c] || c;
}

// Full Challenger Tour calendar data
const rawData: { week: number; name: string; country: string; level: number; surface: string; prize: string }[] = [
  { week: 1, name: "Canberra Tennis International", country: "Australia", level: 125, surface: "Hard", prize: "$164,000" },
  { week: 1, name: "Open Nouvelle-Calédonie", country: "Nueva Caledonia", level: 100, surface: "Hard", prize: "$133,250" },
  { week: 1, name: "Nonthaburi Challenger I", country: "Tailandia", level: 75, surface: "Hard", prize: "$82,000" },
  { week: 1, name: "Oeiras Indoors I", country: "Portugal", level: 50, surface: "Hard", prize: "$36,900" },
  { week: 2, name: "Nonthaburi Challenger II", country: "Tailandia", level: 75, surface: "Hard", prize: "$82,000" },
  { week: 2, name: "Oeiras Indoors II", country: "Portugal", level: 75, surface: "Hard", prize: "$74,825" },
  { week: 2, name: "Challenger Tigre", country: "Argentina", level: 50, surface: "Clay", prize: "$41,000" },
  { week: 3, name: "Tenerife Challenger I", country: "España", level: 100, surface: "Hard", prize: "$120,950" },
  { week: 3, name: "Nonthaburi Challenger III", country: "Tailandia", level: 75, surface: "Hard", prize: "$82,000" },
  { week: 3, name: "Challenger de Buenos Aires", country: "Argentina", level: 50, surface: "Clay", prize: "$41,000" },
  { week: 4, name: "BW Open (Ottignies)", country: "Bélgica", level: 125, surface: "Hard", prize: "$148,625" },
  { week: 4, name: "Quimper Open", country: "Francia", level: 125, surface: "Hard", prize: "$148,625" },
  { week: 4, name: "Punta del Este Open", country: "Uruguay", level: 75, surface: "Clay", prize: "$82,000" },
  { week: 5, name: "Koblenz Open", country: "Alemania", level: 100, surface: "Hard", prize: "$120,950" },
  { week: 5, name: "Burnie International I", country: "Australia", level: 75, surface: "Hard", prize: "$82,000" },
  { week: 5, name: "Cleveland Open", country: "EE. UU.", level: 75, surface: "Hard", prize: "$82,000" },
  { week: 5, name: "Brasil Tennis Challenger", country: "Brasil", level: 50, surface: "Clay", prize: "$41,000" },
  { week: 6, name: "Bengaluru Open", country: "India", level: 100, surface: "Hard", prize: "$133,250" },
  { week: 6, name: "Manama Challenger", country: "Baréin", level: 125, surface: "Hard", prize: "$164,000" },
  { week: 6, name: "Glasgow Challenger", country: "Reino Unido", level: 50, surface: "Hard", prize: "$36,900" },
  { week: 6, name: "Cherbourg Challenger", country: "Francia", level: 75, surface: "Hard", prize: "$74,825" },
  { week: 7, name: "Morelos Open", country: "México", level: 75, surface: "Hard", prize: "$82,000" },
  { week: 7, name: "Pau Challenger", country: "Francia", level: 125, surface: "Hard", prize: "$148,625" },
  { week: 7, name: "Pune Challenger", country: "India", level: 100, surface: "Hard", prize: "$133,250" },
  { week: 7, name: "Tenerife Challenger II", country: "España", level: 75, surface: "Hard", prize: "$74,825" },
  { week: 8, name: "Play In Chall. Lille", country: "Francia", level: 100, surface: "Hard", prize: "$120,950" },
  { week: 8, name: "New Delhi Challenger", country: "India", level: 75, surface: "Hard", prize: "$82,000" },
  { week: 8, name: "Tenerife Challenger III", country: "España", level: 75, surface: "Hard", prize: "$74,825" },
  { week: 9, name: "San Luis Open", country: "México", level: 75, surface: "Clay", prize: "$82,000" },
  { week: 9, name: "Lugano Challenger", country: "Suiza", level: 75, surface: "Hard", prize: "$74,825" },
  { week: 9, name: "Santa Cruz Challenger", country: "Bolivia", level: 50, surface: "Clay", prize: "$41,000" },
  { week: 9, name: "Kigali Challenger I", country: "Ruanda", level: 50, surface: "Clay", prize: "$41,000" },
  { week: 10, name: "Phoenix Challenger", country: "EE. UU.", level: 175, surface: "Hard", prize: "$225,500" },
  { week: 10, name: "Challenger Santiago", country: "Chile", level: 75, surface: "Clay", prize: "$82,000" },
  { week: 10, name: "Székesfehérvár Challenger", country: "Hungría", level: 75, surface: "Clay", prize: "$74,825" },
  { week: 10, name: "Kigali Challenger II", country: "Ruanda", level: 50, surface: "Clay", prize: "$41,000" },
  { week: 11, name: "Paraguay Open", country: "Paraguay", level: 75, surface: "Clay", prize: "$82,000" },
  { week: 11, name: "Murcia Open", country: "España", level: 75, surface: "Clay", prize: "$74,825" },
  { week: 11, name: "Zadar Open", country: "Croacia", level: 75, surface: "Clay", prize: "$74,825" },
  { week: 11, name: "Yucatán Open", country: "México", level: 50, surface: "Clay", prize: "$41,000" },
  { week: 12, name: "San Luis Open II", country: "México", level: 75, surface: "Clay", prize: "$82,000" },
  { week: 12, name: "Napoli Capri Cup", country: "Italia", level: 125, surface: "Clay", prize: "$148,625" },
  { week: 12, name: "Girona Challenger", country: "España", level: 100, surface: "Clay", prize: "$120,950" },
  { week: 12, name: "São Leopoldo Open", country: "Brasil", level: 75, surface: "Clay", prize: "$82,000" },
  { week: 13, name: "Mexico City Open", country: "México", level: 125, surface: "Clay", prize: "$164,000" },
  { week: 13, name: "Estoril Challenger 125", country: "Portugal", level: 125, surface: "Clay", prize: "$148,625" },
  { week: 13, name: "Barletta Open", country: "Italia", level: 75, surface: "Clay", prize: "$74,825" },
  { week: 13, name: "Florianópolis Challenger", country: "Brasil", level: 75, surface: "Clay", prize: "$82,000" },
  { week: 14, name: "Busan Open", country: "Corea del Sur", level: 125, surface: "Hard", prize: "$164,000" },
  { week: 14, name: "Madrid Challenger", country: "España", level: 100, surface: "Clay", prize: "$120,950" },
  { week: 14, name: "Sarasota Open", country: "EE. UU.", level: 75, surface: "Clay", prize: "$82,000" },
  { week: 14, name: "Morelos Open II", country: "México", level: 75, surface: "Hard", prize: "$82,000" },
  { week: 14, name: "Split Open", country: "Croacia", level: 75, surface: "Clay", prize: "$74,825" },
  { week: 15, name: "Gwangju Open", country: "Corea del Sur", level: 75, surface: "Hard", prize: "$82,000" },
  { week: 15, name: "Tallahassee Challenger", country: "EE. UU.", level: 75, surface: "Clay", prize: "$82,000" },
  { week: 15, name: "San Miguel de Tucumán", country: "Argentina", level: 50, surface: "Clay", prize: "$41,000" },
  { week: 15, name: "Oeiras Open 3", country: "Portugal", level: 125, surface: "Clay", prize: "$148,625" },
  { week: 16, name: "Ostrava Open", country: "Rep. Checa", level: 75, surface: "Clay", prize: "$74,825" },
  { week: 16, name: "Savannah Challenger", country: "EE. UU.", level: 75, surface: "Clay", prize: "$82,000" },
  { week: 16, name: "Rome Challenger Garden", country: "Italia", level: 75, surface: "Clay", prize: "$74,825" },
  { week: 16, name: "Concepcion Open", country: "Chile", level: 50, surface: "Clay", prize: "$41,000" },
  { week: 16, name: "Shenzhen Rentai Open", country: "China", level: 75, surface: "Hard", prize: "$82,000" },
  { week: 17, name: "Aix-en-Provence Open", country: "Francia", level: 175, surface: "Clay", prize: "$205,000" },
  { week: 17, name: "Sardegna Open Cagliari", country: "Italia", level: 175, surface: "Clay", prize: "$205,000" },
  { week: 17, name: "Guangzhou Open", country: "China", level: 75, surface: "Hard", prize: "$82,000" },
  { week: 17, name: "Porto Alegre Challenger", country: "Brasil", level: 50, surface: "Clay", prize: "$41,000" },
  { week: 18, name: "Mauthausen Open", country: "Austria", level: 100, surface: "Clay", prize: "$120,950" },
  { week: 18, name: "Francavilla al Mare", country: "Italia", level: 75, surface: "Clay", prize: "$74,825" },
  { week: 18, name: "Wuxi Open", country: "China", level: 75, surface: "Hard", prize: "$82,000" },
  { week: 18, name: "Prague Open", country: "Rep. Checa", level: 75, surface: "Clay", prize: "$74,825" },
  { week: 18, name: "Santos Brasil Open", country: "Brasil", level: 50, surface: "Clay", prize: "$41,000" },
  { week: 19, name: "Bordeaux Primrose", country: "Francia", level: 175, surface: "Clay", prize: "$205,000" },
  { week: 19, name: "Turin Challenger", country: "Italia", level: 175, surface: "Clay", prize: "$205,000" },
  { week: 19, name: "Oeiras Open 4", country: "Portugal", level: 75, surface: "Clay", prize: "$74,825" },
  { week: 19, name: "Tunis Open", country: "Túnez", level: 75, surface: "Clay", prize: "$82,000" },
  { week: 19, name: "Taipei Challenger", country: "Taiwán", level: 75, surface: "Hard", prize: "$82,000" },
  { week: 20, name: "Skopje Challenger", country: "Macedonia", level: 75, surface: "Clay", prize: "$74,825" },
  { week: 20, name: "Vicenza Challenger", country: "Italia", level: 75, surface: "Clay", prize: "$74,825" },
  { week: 20, name: "Kachreti Challenger", country: "Georgia", level: 50, surface: "Hard", prize: "$41,000" },
  { week: 20, name: "Augsburg Challenger", country: "Alemania", level: 50, surface: "Clay", prize: "$36,900" },
  { week: 21, name: "Little Rock Open", country: "EE. UU.", level: 75, surface: "Hard", prize: "$82,000" },
  { week: 21, name: "Heilbronn Neckarcup", country: "Alemania", level: 100, surface: "Clay", prize: "$120,950" },
  { week: 21, name: "Prostějov Open", country: "Rep. Checa", level: 100, surface: "Clay", prize: "$120,950" },
  { week: 21, name: "Surbiton Trophy", country: "Reino Unido", level: 125, surface: "Grass", prize: "$148,625" },
  { week: 21, name: "Vicenza Challenger II", country: "Italia", level: 75, surface: "Clay", prize: "$74,825" },
  { week: 22, name: "Nottingham Open", country: "Reino Unido", level: 125, surface: "Grass", prize: "$148,625" },
  { week: 22, name: "Perugia Challenger", country: "Italia", level: 125, surface: "Clay", prize: "$148,625" },
  { week: 22, name: "Bratislava Open", country: "Eslovaquia", level: 100, surface: "Clay", prize: "$120,950" },
  { week: 22, name: "Lyon Challenger", country: "Francia", level: 100, surface: "Clay", prize: "$120,950" },
  { week: 22, name: "Tyler Challenger", country: "EE. UU.", level: 75, surface: "Hard", prize: "$82,000" },
  { week: 23, name: "Ilkley Trophy", country: "Reino Unido", level: 125, surface: "Grass", prize: "$148,625" },
  { week: 23, name: "Emilia-Romagna Sassuolo", country: "Italia", level: 125, surface: "Clay", prize: "$148,625" },
  { week: 23, name: "Poznań Open", country: "Polonia", level: 75, surface: "Clay", prize: "$74,825" },
  { week: 23, name: "Blois Challenger", country: "Francia", level: 50, surface: "Clay", prize: "$36,900" },
  { week: 23, name: "Santa Cruz Challenger II", country: "Bolivia", level: 50, surface: "Clay", prize: "$41,000" },
  { week: 24, name: "Milan Challenger", country: "Italia", level: 75, surface: "Clay", prize: "$74,825" },
  { week: 24, name: "Modena Challenger", country: "Italia", level: 75, surface: "Clay", prize: "$74,825" },
  { week: 24, name: "Ibague Open", country: "Colombia", level: 50, surface: "Clay", prize: "$41,000" },
  { week: 25, name: "Cranbrook Tennis Classic", country: "EE. UU.", level: 75, surface: "Hard", prize: "$82,000" },
  { week: 25, name: "Brașov Challenger", country: "Rumania", level: 75, surface: "Clay", prize: "$74,825" },
  { week: 25, name: "Karlsruhe Open", country: "Alemania", level: 75, surface: "Clay", prize: "$74,825" },
  { week: 25, name: "Troyes Challenger", country: "Francia", level: 50, surface: "Clay", prize: "$36,900" },
  { week: 26, name: "Braunschweig Challenger", country: "Alemania", level: 125, surface: "Clay", prize: "$148,625" },
  { week: 26, name: "Salzburg Open", country: "Austria", level: 125, surface: "Clay", prize: "$148,625" },
  { week: 26, name: "Iași Open", country: "Rumania", level: 100, surface: "Clay", prize: "$120,950" },
  { week: 26, name: "Trieste Challenger", country: "Italia", level: 100, surface: "Clay", prize: "$120,950" },
  { week: 26, name: "Winnipeg Challenger", country: "Canadá", level: 75, surface: "Hard", prize: "$82,000" },
  { week: 27, name: "Amersfoort Open", country: "Países Bajos", level: 75, surface: "Clay", prize: "$74,825" },
  { week: 27, name: "Granby Challenger", country: "Canadá", level: 75, surface: "Hard", prize: "$82,000" },
  { week: 27, name: "Verona Challenger", country: "Italia", level: 125, surface: "Clay", prize: "$148,625" },
  { week: 27, name: "Zug Open", country: "Suiza", level: 125, surface: "Clay", prize: "$148,625" },
  { week: 27, name: "Pozoblanco Open", country: "España", level: 50, surface: "Hard", prize: "$36,900" },
  { week: 28, name: "Tampere Open", country: "Finlandia", level: 75, surface: "Clay", prize: "$74,825" },
  { week: 28, name: "Chicago Mens Challenger", country: "EE. UU.", level: 75, surface: "Hard", prize: "$82,000" },
  { week: 28, name: "Astana Challenger", country: "Kazajistán", level: 50, surface: "Hard", prize: "$41,000" },
  { week: 28, name: "Segovia El Espinar", country: "España", level: 100, surface: "Hard", prize: "$120,950" },
  { week: 29, name: "San Marino Open", country: "San Marino", level: 125, surface: "Clay", prize: "$148,625" },
  { week: 29, name: "Porto Challenger", country: "Portugal", level: 125, surface: "Hard", prize: "$148,625" },
  { week: 29, name: "Lexington Challenger", country: "EE. UU.", level: 75, surface: "Hard", prize: "$82,000" },
  { week: 29, name: "Liberec Open", country: "Rep. Checa", level: 75, surface: "Clay", prize: "$74,825" },
  { week: 29, name: "Lüdenscheid Challenger", country: "Alemania", level: 100, surface: "Clay", prize: "$120,950" },
  { week: 30, name: "Bogotá Open", country: "Colombia", level: 75, surface: "Clay", prize: "$82,000" },
  { week: 30, name: "Lincoln Challenger", country: "EE. UU.", level: 75, surface: "Hard", prize: "$82,000" },
  { week: 30, name: "Bonn Open", country: "Alemania", level: 75, surface: "Clay", prize: "$74,825" },
  { week: 30, name: "Cordenons Challenger", country: "Italia", level: 75, surface: "Clay", prize: "$74,825" },
  { week: 31, name: "Porto Challenger II", country: "Portugal", level: 125, surface: "Hard", prize: "$148,625" },
  { week: 31, name: "Liberec Open II", country: "Rep. Checa", level: 75, surface: "Clay", prize: "$74,825" },
  { week: 31, name: "Lexington Challenger II", country: "EE. UU.", level: 75, surface: "Hard", prize: "$82,000" },
  { week: 31, name: "San Marino Open II", country: "San Marino", level: 125, surface: "Clay", prize: "$148,625" },
  { week: 32, name: "Bogotá Open II", country: "Colombia", level: 75, surface: "Clay", prize: "$82,000" },
  { week: 32, name: "Meerbusch Challenger", country: "Alemania", level: 75, surface: "Clay", prize: "$74,825" },
  { week: 32, name: "Lincoln Challenger II", country: "EE. UU.", level: 75, surface: "Hard", prize: "$82,000" },
  { week: 32, name: "Grodzisk Mazowiecki", country: "Polonia", level: 100, surface: "Hard", prize: "$120,950" },
  { week: 33, name: "Santo Domingo Open", country: "Rep. Dominicana", level: 125, surface: "Clay", prize: "$164,000" },
  { week: 33, name: "Cary Challenger I", country: "EE. UU.", level: 100, surface: "Hard", prize: "$160,000" },
  { week: 33, name: "Todi Challenger", country: "Italia", level: 75, surface: "Clay", prize: "$74,825" },
  { week: 33, name: "Kozerki Open", country: "Polonia", level: 100, surface: "Hard", prize: "$120,950" },
  { week: 34, name: "Dobrich Challenger I", country: "Bulgaria", level: 50, surface: "Clay", prize: "$36,900" },
  { week: 34, name: "Jinan Open", country: "China", level: 50, surface: "Hard", prize: "$41,000" },
  { week: 34, name: "Lima Challenger", country: "Perú", level: 50, surface: "Clay", prize: "$41,000" },
  { week: 35, name: "Como Challenger", country: "Italia", level: 75, surface: "Clay", prize: "$74,825" },
  { week: 35, name: "Mallorca Rafa Nadal Challenger", country: "España", level: 75, surface: "Hard", prize: "$74,825" },
  { week: 35, name: "Porto Challenger III", country: "Portugal", level: 75, surface: "Hard", prize: "$74,825" },
  { week: 35, name: "Zhangjiagang Challenger", country: "China", level: 75, surface: "Hard", prize: "$82,000" },
  { week: 36, name: "Genova Open", country: "Italia", level: 125, surface: "Clay", prize: "$148,625" },
  { week: 36, name: "Sevilla Copa Sevilla", country: "España", level: 125, surface: "Clay", prize: "$148,625" },
  { week: 36, name: "Cassis Open", country: "Francia", level: 75, surface: "Hard", prize: "$74,825" },
  { week: 36, name: "Shanghai Challenger", country: "China", level: 100, surface: "Hard", prize: "$133,250" },
  { week: 36, name: "Tulln Open", country: "Austria", level: 100, surface: "Clay", prize: "$120,950" },
  { week: 37, name: "Szczecin Open", country: "Polonia", level: 125, surface: "Clay", prize: "$148,625" },
  { week: 37, name: "Rennes Open", country: "Francia", level: 100, surface: "Hard", prize: "$120,950" },
  { week: 37, name: "Guangzhou Open II", country: "China", level: 100, surface: "Hard", prize: "$133,250" },
  { week: 37, name: "Las Vegas Challenger", country: "EE. UU.", level: 75, surface: "Hard", prize: "$82,000" },
  { week: 38, name: "Bad Waltersdorf", country: "Austria", level: 125, surface: "Clay", prize: "$148,625" },
  { week: 38, name: "Saint-Tropez Open", country: "Francia", level: 125, surface: "Hard", prize: "$148,625" },
  { week: 38, name: "Columbus Open", country: "EE. UU.", level: 75, surface: "Hard", prize: "$82,000" },
  { week: 38, name: "Antofagasta Challenger", country: "Chile", level: 100, surface: "Clay", prize: "$133,250" },
  { week: 39, name: "Orleans Open", country: "Francia", level: 125, surface: "Hard", prize: "$148,625" },
  { week: 39, name: "Lisbon Belém Open", country: "Portugal", level: 100, surface: "Clay", prize: "$120,950" },
  { week: 39, name: "Nonthaburi IV", country: "Tailandia", level: 100, surface: "Hard", prize: "$133,250" },
  { week: 39, name: "Charleston Challenger", country: "EE. UU.", level: 75, surface: "Hard", prize: "$82,000" },
  { week: 39, name: "Buenos Aires II", country: "Argentina", level: 75, surface: "Clay", prize: "$82,000" },
  { week: 40, name: "Mouilleron-le-Captif", country: "Francia", level: 100, surface: "Hard", prize: "$120,950" },
  { week: 40, name: "Alicante Villena", country: "España", level: 100, surface: "Hard", prize: "$120,950" },
  { week: 40, name: "Tiburon Challenger", country: "EE. UU.", level: 75, surface: "Hard", prize: "$82,000" },
  { week: 40, name: "Villa María", country: "Argentina", level: 100, surface: "Clay", prize: "$133,250" },
  { week: 41, name: "Valencia Open", country: "España", level: 125, surface: "Clay", prize: "$148,625" },
  { week: 41, name: "Hangzhou Challenger", country: "China", level: 125, surface: "Hard", prize: "$164,000" },
  { week: 41, name: "Roanne Open", country: "Francia", level: 100, surface: "Hard", prize: "$120,950" },
  { week: 41, name: "Campinas Challenger", country: "Brasil", level: 100, surface: "Clay", prize: "$133,250" },
  { week: 42, name: "Olbia Challenger", country: "Italia", level: 125, surface: "Hard", prize: "$148,625" },
  { week: 42, name: "Shenzhen II", country: "China", level: 100, surface: "Hard", prize: "$133,250" },
  { week: 42, name: "Saint-Brieuc", country: "Francia", level: 75, surface: "Hard", prize: "$74,825" },
  { week: 42, name: "Calgary Challenger", country: "Canadá", level: 75, surface: "Hard", prize: "$82,000" },
  { week: 42, name: "Curitiba Challenger", country: "Brasil", level: 100, surface: "Clay", prize: "$133,250" },
  { week: 43, name: "Brest Open", country: "Francia", level: 100, surface: "Hard", prize: "$120,950" },
  { week: 43, name: "Seoul Cup", country: "Corea del Sur", level: 100, surface: "Hard", prize: "$133,250" },
  { week: 43, name: "Playford Challenger", country: "Australia", level: 75, surface: "Hard", prize: "$82,000" },
  { week: 44, name: "Bratislava II", country: "Eslovaquia", level: 125, surface: "Hard", prize: "$148,625" },
  { week: 44, name: "Matsuyama Challenger", country: "Japón", level: 75, surface: "Hard", prize: "$82,000" },
  { week: 44, name: "Guayaquil Open", country: "Ecuador", level: 75, surface: "Clay", prize: "$82,000" },
  { week: 45, name: "Helsinki HPP Open", country: "Finlandia", level: 125, surface: "Hard", prize: "$148,625" },
  { week: 45, name: "Kobe Challenger", country: "Japón", level: 75, surface: "Hard", prize: "$82,000" },
  { week: 45, name: "Lima Challenger II", country: "Perú", level: 75, surface: "Clay", prize: "$82,000" },
  { week: 46, name: "Montevideo Uruguay Open", country: "Uruguay", level: 100, surface: "Clay", prize: "$133,250" },
  { week: 46, name: "Lyon II", country: "Francia", level: 75, surface: "Hard", prize: "$74,825" },
  { week: 46, name: "Drummondville", country: "Canadá", level: 75, surface: "Hard", prize: "$82,000" },
  { week: 47, name: "Rovereto Challenger", country: "Italia", level: 100, surface: "Hard", prize: "$120,950" },
  { week: 47, name: "São Paulo Challenger", country: "Brasil", level: 75, surface: "Clay", prize: "$82,000" },
  { week: 47, name: "Yokohama Challenger", country: "Japón", level: 75, surface: "Hard", prize: "$82,000" },
  { week: 48, name: "Temuco Challenger", country: "Chile", level: 100, surface: "Hard", prize: "$133,250" },
  { week: 48, name: "Maia Open", country: "Portugal", level: 100, surface: "Clay", prize: "$120,950" },
  { week: 48, name: "Yokkaichi Challenger", country: "Japón", level: 75, surface: "Hard", prize: "$82,000" },
  { week: 49, name: "Maspalomas Challenger", country: "España", level: 75, surface: "Clay", prize: "$74,825" },
  { week: 49, name: "Maia Open II", country: "Portugal", level: 100, surface: "Clay", prize: "$120,950" },
  { week: 50, name: "Florianópolis Challenger II", country: "Brasil", level: 75, surface: "Clay", prize: "$82,000" },
  { week: 51, name: "Challenger de Buenos Aires III", country: "Argentina", level: 50, surface: "Clay", prize: "$41,000" },
];

// ITF M25 tournaments — one per week (52 total), globally distributed
const itfM25Data: { week: number; name: string; country: string; surface: string }[] = [
  { week: 1, name: "ITF M25 Cairo", country: "Egypt", surface: "Hard" },
  { week: 2, name: "ITF M25 Sharm el-Sheikh", country: "Egypt", surface: "Hard" },
  { week: 3, name: "ITF M25 Hammamet", country: "Tunisia", surface: "Clay" },
  { week: 4, name: "ITF M25 Monastir", country: "Tunisia", surface: "Hard" },
  { week: 5, name: "ITF M25 Antalya", country: "Turkey", surface: "Hard" },
  { week: 6, name: "ITF M25 Izmir", country: "Turkey", surface: "Hard" },
  { week: 7, name: "ITF M25 Larnaca", country: "Cyprus", surface: "Hard" },
  { week: 8, name: "ITF M25 Athens", country: "Greece", surface: "Clay" },
  { week: 9, name: "ITF M25 Heraklion", country: "Greece", surface: "Clay" },
  { week: 10, name: "ITF M25 Shymkent", country: "Kazakhstan", surface: "Hard" },
  { week: 11, name: "ITF M25 Almaty", country: "Kazakhstan", surface: "Hard" },
  { week: 12, name: "ITF M25 Cairo II", country: "Egypt", surface: "Clay" },
  { week: 13, name: "ITF M25 Fes", country: "Morocco", surface: "Clay" },
  { week: 14, name: "ITF M25 Rabat", country: "Morocco", surface: "Clay" },
  { week: 15, name: "ITF M25 Meknes", country: "Morocco", surface: "Clay" },
  { week: 16, name: "ITF M25 Sousse", country: "Tunisia", surface: "Clay" },
  { week: 17, name: "ITF M25 Lesa", country: "Italy", surface: "Clay" },
  { week: 18, name: "ITF M25 Rome", country: "Italy", surface: "Clay" },
  { week: 19, name: "ITF M25 Perugia", country: "Italy", surface: "Clay" },
  { week: 20, name: "ITF M25 Valencia", country: "Spain", surface: "Clay" },
  { week: 21, name: "ITF M25 Alicante", country: "Spain", surface: "Clay" },
  { week: 22, name: "ITF M25 Troyes", country: "France", surface: "Clay" },
  { week: 23, name: "ITF M25 Villeneuve", country: "France", surface: "Clay" },
  { week: 24, name: "ITF M25 Prague", country: "Czech Republic", surface: "Clay" },
  { week: 25, name: "ITF M25 Warsaw", country: "Poland", surface: "Clay" },
  { week: 26, name: "ITF M25 Budapest", country: "Hungary", surface: "Clay" },
  { week: 27, name: "ITF M25 Bratislava", country: "Slovakia", surface: "Clay" },
  { week: 28, name: "ITF M25 Zagreb", country: "Croatia", surface: "Clay" },
  { week: 29, name: "ITF M25 Prostejov", country: "Czech Republic", surface: "Hard" },
  { week: 30, name: "ITF M25 Banja Luka", country: "Bosnia", surface: "Hard" },
  { week: 31, name: "ITF M25 Tbilisi", country: "Georgia", surface: "Hard" },
  { week: 32, name: "ITF M25 Yerevan", country: "Armenia", surface: "Hard" },
  { week: 33, name: "ITF M25 Tashkent", country: "Uzbekistan", surface: "Hard" },
  { week: 34, name: "ITF M25 Baku", country: "Azerbaijan", surface: "Hard" },
  { week: 35, name: "ITF M25 Plovdiv", country: "Bulgaria", surface: "Hard" },
  { week: 36, name: "ITF M25 Bucharest", country: "Romania", surface: "Hard" },
  { week: 37, name: "ITF M25 Jakarta", country: "Indonesia", surface: "Hard" },
  { week: 38, name: "ITF M25 Manila", country: "Philippines", surface: "Hard" },
  { week: 39, name: "ITF M25 Ho Chi Minh", country: "Vietnam", surface: "Hard" },
  { week: 40, name: "ITF M25 Bangkok", country: "Thailand", surface: "Hard" },
  { week: 41, name: "ITF M25 Colombo", country: "Sri Lanka", surface: "Hard" },
  { week: 42, name: "ITF M25 Dhaka", country: "Bangladesh", surface: "Hard" },
  { week: 43, name: "ITF M25 Doha", country: "Qatar", surface: "Hard" },
  { week: 44, name: "ITF M25 Muscat", country: "Oman", surface: "Hard" },
  { week: 45, name: "ITF M25 Bogota", country: "Colombia", surface: "Clay" },
  { week: 46, name: "ITF M25 Guayaquil", country: "Ecuador", surface: "Clay" },
  { week: 47, name: "ITF M25 Santa Cruz", country: "Bolivia", surface: "Clay" },
  { week: 48, name: "ITF M25 Asuncion", country: "Paraguay", surface: "Clay" },
  { week: 49, name: "ITF M25 Cordoba", country: "Argentina", surface: "Clay" },
  { week: 50, name: "ITF M25 Santiago", country: "Chile", surface: "Clay" },
  { week: 51, name: "ITF M25 Lima", country: "Peru", surface: "Clay" },
  { week: 52, name: "ITF M25 Montevideo", country: "Uruguay", surface: "Clay" },
];

// ITF M15 tournaments — one per week (52 total), globally distributed
const itfM15Data: { week: number; name: string; country: string; surface: string }[] = [
  { week: 1, name: "ITF M15 Sharm", country: "Egypt", surface: "Hard" },
  { week: 2, name: "ITF M15 Antalya", country: "Turkey", surface: "Hard" },
  { week: 3, name: "ITF M15 Heraklion", country: "Greece", surface: "Clay" },
  { week: 4, name: "ITF M15 Larnaca", country: "Cyprus", surface: "Hard" },
  { week: 5, name: "ITF M15 Hammamet", country: "Tunisia", surface: "Clay" },
  { week: 6, name: "ITF M15 Almaty", country: "Kazakhstan", surface: "Hard" },
  { week: 7, name: "ITF M15 Tbilisi", country: "Georgia", surface: "Hard" },
  { week: 8, name: "ITF M15 Monastir", country: "Tunisia", surface: "Hard" },
  { week: 9, name: "ITF M15 Fes", country: "Morocco", surface: "Clay" },
  { week: 10, name: "ITF M15 Izmir", country: "Turkey", surface: "Clay" },
  { week: 11, name: "ITF M15 Athens", country: "Greece", surface: "Clay" },
  { week: 12, name: "ITF M15 Cairo", country: "Egypt", surface: "Hard" },
  { week: 13, name: "ITF M15 Meknes", country: "Morocco", surface: "Clay" },
  { week: 14, name: "ITF M15 Rabat", country: "Morocco", surface: "Clay" },
  { week: 15, name: "ITF M15 Sousse", country: "Tunisia", surface: "Clay" },
  { week: 16, name: "ITF M15 Bergamo", country: "Italy", surface: "Clay" },
  { week: 17, name: "ITF M15 Florence", country: "Italy", surface: "Clay" },
  { week: 18, name: "ITF M15 Palermo", country: "Italy", surface: "Clay" },
  { week: 19, name: "ITF M15 Murcia", country: "Spain", surface: "Clay" },
  { week: 20, name: "ITF M15 Tarragona", country: "Spain", surface: "Clay" },
  { week: 21, name: "ITF M15 Poznan", country: "Poland", surface: "Clay" },
  { week: 22, name: "ITF M15 Krakow", country: "Poland", surface: "Clay" },
  { week: 23, name: "ITF M15 Bratislava", country: "Slovakia", surface: "Clay" },
  { week: 24, name: "ITF M15 Budapest", country: "Hungary", surface: "Clay" },
  { week: 25, name: "ITF M15 Sibiu", country: "Romania", surface: "Clay" },
  { week: 26, name: "ITF M15 Sofia", country: "Bulgaria", surface: "Hard" },
  { week: 27, name: "ITF M15 Belgrade", country: "Serbia", surface: "Clay" },
  { week: 28, name: "ITF M15 Sarajevo", country: "Bosnia", surface: "Hard" },
  { week: 29, name: "ITF M15 Yerevan", country: "Armenia", surface: "Hard" },
  { week: 30, name: "ITF M15 Baku", country: "Azerbaijan", surface: "Hard" },
  { week: 31, name: "ITF M15 Tashkent", country: "Uzbekistan", surface: "Hard" },
  { week: 32, name: "ITF M15 Bishkek", country: "Kyrgyzstan", surface: "Hard" },
  { week: 33, name: "ITF M15 Manila", country: "Philippines", surface: "Hard" },
  { week: 34, name: "ITF M15 Jakarta", country: "Indonesia", surface: "Hard" },
  { week: 35, name: "ITF M15 Hanoi", country: "Vietnam", surface: "Hard" },
  { week: 36, name: "ITF M15 Colombo", country: "Sri Lanka", surface: "Hard" },
  { week: 37, name: "ITF M15 Dhaka", country: "Bangladesh", surface: "Hard" },
  { week: 38, name: "ITF M15 Kathmandu", country: "Nepal", surface: "Hard" },
  { week: 39, name: "ITF M15 Nairobi", country: "Kenya", surface: "Hard" },
  { week: 40, name: "ITF M15 Lagos", country: "Nigeria", surface: "Hard" },
  { week: 41, name: "ITF M15 Accra", country: "Ghana", surface: "Hard" },
  { week: 42, name: "ITF M15 Abidjan", country: "Ivory Coast", surface: "Hard" },
  { week: 43, name: "ITF M15 Doha", country: "Qatar", surface: "Hard" },
  { week: 44, name: "ITF M15 Muscat", country: "Oman", surface: "Hard" },
  { week: 45, name: "ITF M15 Medellin", country: "Colombia", surface: "Clay" },
  { week: 46, name: "ITF M15 Quito", country: "Ecuador", surface: "Clay" },
  { week: 47, name: "ITF M15 Cochabamba", country: "Bolivia", surface: "Clay" },
  { week: 48, name: "ITF M15 Asuncion", country: "Paraguay", surface: "Clay" },
  { week: 49, name: "ITF M15 Mendoza", country: "Argentina", surface: "Clay" },
  { week: 50, name: "ITF M15 Vina del Mar", country: "Chile", surface: "Clay" },
  { week: 51, name: "ITF M15 Trujillo", country: "Peru", surface: "Clay" },
  { week: 52, name: "ITF M15 Montevideo II", country: "Uruguay", surface: "Clay" },
];

// Generate ChallengerTournament objects
const challengerBase: ChallengerTournament[] = rawData.map(d => {
  const category = getCategoryFromLevel(d.level);
  const country = normalizeCountry(d.country);
  return {
    id: makeId(d.name, d.week),
    name: d.name,
    city: d.name.replace(/ Challenger\b.*$/, '').replace(/ Open\b.*$/, '').replace(/ International\b.*$/, '').trim(),
    country,
    category,
    surface: parseSurface(d.surface),
    week: d.week,
    playerLimit: 32,
    seeds: 8,
    prizeMoney: parsePrizeMoney(d.prize),
    points: { ...challengerPoints[category] },
  };
});

const itfM25Tournaments: ChallengerTournament[] = itfM25Data.map(d => ({
  id: makeId(d.name, d.week),
  name: d.name,
  city: d.name.replace('ITF M25 ', ''),
  country: d.country,
  category: "ITF M25" as ChallengerCategory,
  surface: parseSurface(d.surface),
  week: d.week,
  playerLimit: 32,
  seeds: 4,
  prizeMoney: 25000,
  points: { ...challengerPoints["ITF M25"] },
}));

const itfM15Tournaments: ChallengerTournament[] = itfM15Data.map(d => ({
  id: makeId(d.name, d.week),
  name: d.name,
  city: d.name.replace('ITF M15 ', ''),
  country: d.country,
  category: "ITF M15" as ChallengerCategory,
  surface: parseSurface(d.surface),
  week: d.week,
  playerLimit: 16,
  seeds: 4,
  prizeMoney: 15000,
  points: { ...challengerPoints["ITF M15"] },
}));

export const challengerTournaments: ChallengerTournament[] = [
  ...challengerBase,
  ...itfM25Tournaments,
  ...itfM15Tournaments,
];

// Get Challenger tournaments for a specific week
export const getChallengerTournamentsForWeek = (week: number): ChallengerTournament[] =>
  challengerTournaments.filter(t => t.week === week);

// Prize money for Challenger and ITF categories
export const CHALLENGER_PRIZE_MONEY: Record<ChallengerCategory, { winner: number; finalist: number; sf: number; qf: number; r16: number; r32: number }> = {
  "Challenger 175": { winner: 33000, finalist: 19000, sf: 11000, qf: 6200, r16: 3600, r32: 1800 },
  "Challenger 125": { winner: 22000, finalist: 13000, sf: 7500, qf: 4200, r16: 2500, r32: 1200 },
  "Challenger 100": { winner: 18000, finalist: 11000, sf: 6200, qf: 3500, r16: 2000, r32: 1000 },
  "Challenger 75":  { winner: 12000, finalist: 7000, sf: 4000, qf: 2300, r16: 1300, r32: 650 },
  "Challenger 50":  { winner: 8000, finalist: 4500, sf: 2600, qf: 1500, r16: 850, r32: 425 },
  "ITF M25":        { winner: 4500, finalist: 2500, sf: 1400, qf: 750, r16: 400, r32: 0 },
  "ITF M15":        { winner: 2500, finalist: 1400, sf: 800, qf: 450, r16: 250, r32: 0 },
};

// Get prize money for a round in a Challenger tournament
export function getChallengerMoneyForRound(category: ChallengerCategory, round: string): number {
  const pm = CHALLENGER_PRIZE_MONEY[category];
  if (!pm) return 0;
  switch (round) {
    case 'Winner': return pm.winner;
    case 'Final': case 'Finalist': return pm.finalist;
    case 'Semifinal': case 'SF': return pm.sf;
    case 'Quarterfinal': case 'QF': return pm.qf;
    case 'R16': return pm.r16;
    case 'R32': return pm.r32;
    default: return 0;
  }
}

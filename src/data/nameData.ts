/**
 * Regional first/last name pools used to generate new players (retirements replacements,
 * Davis Cup country backfill, etc.) so a generated player's name actually fits their country —
 * no more "Kenji Martínez" showing up in Croatia. Grouped by linguistic/cultural region rather
 * than one pool per country (there are 80+ country codes across the game), which is close enough
 * for a name that just needs to feel plausible for where the player is from.
 */

export interface NamePool {
  first: string[];
  last: string[];
}

const english: NamePool = {
  first: ['James', 'William', 'Henry', 'Jack', 'Thomas', 'Oliver', 'George', 'Charlie', 'Daniel', 'Michael', 'Ryan', 'Connor', 'Liam', 'Ethan', 'Nathan'],
  last: ['Smith', 'Johnson', 'Williams', 'Brown', 'Taylor', 'Anderson', 'Clarke', 'Wilson', 'Walker', 'Hughes', 'Murphy', 'Campbell', 'Edwards', 'Mitchell', 'Bennett'],
};

const spanish: NamePool = {
  first: ['Mateo', 'Santiago', 'Sebastián', 'Nicolás', 'Joaquín', 'Agustín', 'Tomás', 'Lucas', 'Emiliano', 'Franco', 'Iván', 'Diego', 'Rodrigo', 'Martín', 'Facundo'],
  last: ['García', 'Rodríguez', 'González', 'Fernández', 'López', 'Martínez', 'Sánchez', 'Pérez', 'Gómez', 'Díaz', 'Torres', 'Ramírez', 'Flores', 'Acosta', 'Herrera'],
};

const portuguese: NamePool = {
  first: ['João', 'Pedro', 'Miguel', 'Rafael', 'Gustavo', 'Lucas', 'Bruno', 'Tiago', 'André', 'Diogo', 'Rodrigo', 'Vítor', 'Gonçalo', 'Henrique', 'Matheus'],
  last: ['Silva', 'Santos', 'Oliveira', 'Souza', 'Pereira', 'Costa', 'Carvalho', 'Almeida', 'Ribeiro', 'Ferreira', 'Rocha', 'Teixeira', 'Lima', 'Martins', 'Correia'],
};

const italian: NamePool = {
  first: ['Marco', 'Luca', 'Matteo', 'Andrea', 'Lorenzo', 'Alessandro', 'Francesco', 'Giovanni', 'Stefano', 'Davide', 'Simone', 'Riccardo', 'Nicolò', 'Federico', 'Gabriele'],
  last: ['Rossi', 'Russo', 'Ferrari', 'Esposito', 'Bianchi', 'Romano', 'Colombo', 'Ricci', 'Marino', 'Greco', 'Bruno', 'Gallo', 'Conti', 'De Luca', 'Mancini'],
};

const french: NamePool = {
  first: ['Louis', 'Hugo', 'Gabriel', 'Arthur', 'Thomas', 'Antoine', 'Nicolas', 'Julien', 'Maxime', 'Alexandre', 'Théo', 'Léo', 'Pierre', 'Baptiste', 'Quentin'],
  last: ['Martin', 'Bernard', 'Dubois', 'Thomas', 'Robert', 'Petit', 'Durand', 'Leroy', 'Moreau', 'Simon', 'Laurent', 'Lefebvre', 'Michel', 'Garnier', 'Rousseau'],
};

const german: NamePool = {
  first: ['Lukas', 'Maximilian', 'Felix', 'Jonas', 'Tim', 'Julian', 'Niklas', 'Fabian', 'Moritz', 'Leon', 'Paul', 'Sebastian', 'Jan', 'Tobias', 'Simon'],
  last: ['Müller', 'Schmidt', 'Schneider', 'Fischer', 'Weber', 'Meyer', 'Wagner', 'Becker', 'Hoffmann', 'Schulz', 'Koch', 'Richter', 'Klein', 'Wolf', 'Neumann'],
};

const dutch: NamePool = {
  first: ['Daan', 'Sem', 'Lars', 'Jesse', 'Thijs', 'Bram', 'Thomas', 'Ruben', 'Luuk', 'Wouter', 'Koen', 'Niels', 'Joost', 'Stijn', 'Tim'],
  last: ['de Jong', 'Jansen', 'Bakker', 'Visser', 'Smit', 'Meijer', 'de Boer', 'Mulder', 'Dekker', 'Brouwer', 'de Groot', 'Bos', 'Vos', 'Peters', 'Hendriks'],
};

const nordic: NamePool = {
  first: ['Erik', 'Anders', 'Lars', 'Henrik', 'Magnus', 'Oskar', 'Emil', 'Viktor', 'Aksel', 'Mikael', 'Niklas', 'Sven', 'Anton', 'Elias', 'Jesper'],
  last: ['Andersson', 'Johansson', 'Karlsson', 'Nilsson', 'Eriksson', 'Larsen', 'Hansen', 'Nielsen', 'Virtanen', 'Korhonen', 'Mäkinen', 'Berg', 'Lindqvist', 'Holm', 'Dahl'],
};

const balkan: NamePool = {
  first: ['Nikola', 'Stefan', 'Marko', 'Luka', 'Filip', 'Ivan', 'Milan', 'Aleksandar', 'Petar', 'Dušan', 'Vuk', 'Andrej', 'Goran', 'Dario', 'Ante'],
  last: ['Petrović', 'Jovanović', 'Marković', 'Nikolić', 'Popović', 'Stojanović', 'Kovačević', 'Horvat', 'Novak', 'Babić', 'Radić', 'Vuković', 'Đorđević', 'Pavlović', 'Kolar'],
};

const westSlavic: NamePool = {
  first: ['Jakub', 'Filip', 'Michał', 'Piotr', 'Wojciech', 'Tomáš', 'Jan', 'Martin', 'Petr', 'Adam', 'Kacper', 'Mateusz', 'Dominik', 'Marek', 'Krzysztof'],
  last: ['Nowak', 'Kowalski', 'Wiśniewski', 'Wójcik', 'Dvořák', 'Novák', 'Svoboda', 'Procházka', 'Horák', 'Kučera', 'Kowalczyk', 'Kamiński', 'Zieliński', 'Král', 'Marek'],
};

const eastSlavic: NamePool = {
  first: ['Dmitri', 'Andrei', 'Ivan', 'Mikhail', 'Sergei', 'Alexei', 'Nikolai', 'Pavel', 'Viktor', 'Roman', 'Vladimir', 'Yuri', 'Oleg', 'Igor', 'Artem'],
  last: ['Ivanov', 'Petrov', 'Sidorov', 'Volkov', 'Sokolov', 'Kuznetsov', 'Morozov', 'Popov', 'Vasiliev', 'Fedorov', 'Smirnov', 'Novikov', 'Koval', 'Bondarenko', 'Melnyk'],
};

const baltic: NamePool = {
  first: ['Karolis', 'Tomas', 'Mantas', 'Rokas', 'Andrius', 'Kristaps', 'Jānis', 'Mārtiņš', 'Rainer', 'Marek', 'Kaspar', 'Gustav', 'Erik', 'Toivo', 'Andres'],
  last: ['Jankauskas', 'Kazlauskas', 'Petrauskas', 'Vasiliauskas', 'Bērziņš', 'Kalniņš', 'Ozoliņš', 'Tamm', 'Saar', 'Kask', 'Sepp', 'Rebane', 'Laine', 'Mets', 'Kukk'],
};

const greek: NamePool = {
  first: ['Stefanos', 'Nikos', 'Giorgos', 'Kostas', 'Dimitris', 'Yannis', 'Alexandros', 'Vasilis', 'Panagiotis', 'Christos', 'Michalis', 'Aris', 'Petros', 'Andreas', 'Marios'],
  last: ['Papadopoulos', 'Papadakis', 'Nikolaidis', 'Georgiou', 'Vasileiou', 'Antoniou', 'Christodoulou', 'Konstantinou', 'Ioannou', 'Dimitriou', 'Michaelides', 'Stavrou', 'Petrides', 'Pavlou', 'Loizou'],
};

const turkish: NamePool = {
  first: ['Emre', 'Mert', 'Berk', 'Can', 'Yusuf', 'Ahmet', 'Mehmet', 'Burak', 'Onur', 'Kaan', 'Serkan', 'Umut', 'Cem', 'Baran', 'Tolga'],
  last: ['Yılmaz', 'Kaya', 'Demir', 'Şahin', 'Çelik', 'Yıldız', 'Aydın', 'Arslan', 'Doğan', 'Kılıç', 'Aslan', 'Çetin', 'Koç', 'Kurt', 'Özdemir'],
};

const hungarian: NamePool = {
  first: ['Bence', 'Ádám', 'Balázs', 'Gergő', 'Zoltán', 'László', 'Péter', 'Tamás', 'Levente', 'Máté', 'Dániel', 'Krisztián', 'Attila', 'Gábor', 'Márton'],
  last: ['Nagy', 'Kovács', 'Tóth', 'Szabó', 'Horváth', 'Varga', 'Kiss', 'Molnár', 'Németh', 'Farkas', 'Balogh', 'Papp', 'Takács', 'Juhász', 'Lakatos'],
};

const romanian: NamePool = {
  first: ['Andrei', 'Mihai', 'Alexandru', 'Radu', 'Cristian', 'Florin', 'Daniel', 'Ionuț', 'Vlad', 'Gabriel', 'Adrian', 'Sorin', 'Cătălin', 'Marius', 'Ștefan'],
  last: ['Popescu', 'Ionescu', 'Popa', 'Dumitru', 'Stan', 'Stoica', 'Gheorghe', 'Constantin', 'Matei', 'Ilie', 'Tudor', 'Marin', 'Toma', 'Dinu', 'Radu'],
};

const japanese: NamePool = {
  first: ['Kenji', 'Hiroshi', 'Takeshi', 'Yuto', 'Sora', 'Haruto', 'Ren', 'Sota', 'Daiki', 'Yuki', 'Kaito', 'Riku', 'Sho', 'Naoki', 'Tatsuya'],
  last: ['Sato', 'Suzuki', 'Takahashi', 'Tanaka', 'Watanabe', 'Ito', 'Yamamoto', 'Nakamura', 'Kobayashi', 'Saito', 'Kato', 'Yoshida', 'Yamada', 'Sasaki', 'Matsumoto'],
};

const korean: NamePool = {
  first: ['Min-jun', 'Ji-ho', 'Seo-jun', 'Do-yun', 'Joon-ho', 'Hyun-woo', 'Tae-yang', 'Jun-seo', 'Woo-jin', 'Sung-min', 'Jae-won', 'Dong-hyun', 'Kyung-soo', 'Yong-jin', 'Chan-ho'],
  last: ['Kim', 'Lee', 'Park', 'Choi', 'Jung', 'Kang', 'Cho', 'Yoon', 'Jang', 'Lim', 'Han', 'Oh', 'Seo', 'Shin', 'Kwon'],
};

const chinese: NamePool = {
  first: ['Wei', 'Jun', 'Hao', 'Lei', 'Ming', 'Chen', 'Tao', 'Bo', 'Yong', 'Kai', 'Jian', 'Feng', 'Qiang', 'Peng', 'Zhi'],
  last: ['Wang', 'Li', 'Zhang', 'Liu', 'Chen', 'Yang', 'Huang', 'Zhao', 'Wu', 'Zhou', 'Xu', 'Sun', 'Ma', 'Zhu', 'Hu'],
};

const southeastAsian: NamePool = {
  first: ['Somchai', 'Arthit', 'Krit', 'Nattapong', 'Chai', 'Jose', 'Mark', 'Paolo', 'Carlo', 'Miguel', 'Budi', 'Agus', 'Made', 'Wayan', 'Andi'],
  last: ['Srisai', 'Charoen', 'Suwan', 'Thongchai', 'Santos', 'Reyes', 'Cruz', 'Bautista', 'Ramos', 'Wijaya', 'Santoso', 'Kusuma', 'Saputra', 'Putra', 'Gunawan'],
};

const southAsian: NamePool = {
  first: ['Arjun', 'Rohan', 'Aditya', 'Vikram', 'Rahul', 'Karan', 'Siddharth', 'Aryan', 'Kabir', 'Rishi', 'Ahmed', 'Usman', 'Bilal', 'Hamza', 'Zain'],
  last: ['Sharma', 'Patel', 'Singh', 'Kumar', 'Verma', 'Gupta', 'Reddy', 'Khan', 'Malik', 'Chaudhry', 'Iqbal', 'Raza', 'Hussain', 'Ali', 'Shaikh'],
};

const arabic: NamePool = {
  first: ['Karim', 'Omar', 'Youssef', 'Hamza', 'Amine', 'Rachid', 'Khaled', 'Tarek', 'Samir', 'Nabil', 'Adnan', 'Bassam', 'Rami', 'Hassan', 'Ziad'],
  last: ['El Amrani', 'Haddad', 'Khalil', 'Mansour', 'Saad', 'Nasser', 'Fares', 'Chahine', 'Barakat', 'Aziz', 'Al-Sayed', 'Benali', 'Idrissi', 'Zidan', 'Younes'],
};

const hebrew: NamePool = {
  first: ['Amit', 'Yonatan', 'Tomer', 'Daniel', 'Itai', 'Noam', 'Eitan', 'Roee', 'Guy', 'Ariel', 'Omer', 'Ido', 'Nadav', 'Uri', 'Liam'],
  last: ['Cohen', 'Levi', 'Mizrahi', 'Peretz', 'Biton', 'Azoulay', 'Katz', 'Friedman', 'Shapiro', 'Avraham', 'Dahan', 'Malka', 'Amar', 'Gabay', 'Bar'],
};

const caucasus: NamePool = {
  first: ['Giorgi', 'Nika', 'Luka', 'Davit', 'Levan', 'Saba', 'Otar', 'Tornike', 'Beka', 'Irakli', 'Zaza', 'Vakhtang', 'Guram', 'Kakha', 'Shota'],
  last: ['Beridze', 'Kapanadze', 'Lomidze', 'Gelashvili', 'Meladze', 'Tsiklauri', 'Kiknadze', 'Chikvaidze', 'Japaridze', 'Kavtaradze', 'Machaidze', 'Tsereteli', 'Abashidze', 'Kobakhidze', 'Gogia'],
};

const centralAsian: NamePool = {
  first: ['Timur', 'Alisher', 'Dias', 'Nurlan', 'Aidos', 'Bekzat', 'Yerlan', 'Ruslan', 'Daulet', 'Sanjar', 'Bakhtiyor', 'Farrukh', 'Shokhrukh', 'Javokhir', 'Otabek'],
  last: ['Nazarov', 'Yusupov', 'Karimov', 'Ismailov', 'Rashidov', 'Abdullaev', 'Sultanov', 'Aliyev', 'Rakhimov', 'Ahmedov', 'Saidov', 'Tashkentov', 'Yuldashev', 'Ergashev', 'Nurmatov'],
};

const african: NamePool = {
  first: ['Thabo', 'Sipho', 'Lwazi', 'Kagiso', 'Tumelo', 'Kwame', 'Kofi', 'Emeka', 'Chidi', 'Ibrahima', 'Mamadou', 'Cheikh', 'Ousmane', 'Abdoulaye', 'Oluwaseun'],
  last: ['Nkosi', 'Dlamini', 'Mokoena', 'van der Merwe', 'Botha', 'Pretorius', 'Diallo', 'Traoré', 'Diop', 'Okafor', 'Adeyemi', 'Balogun', 'Mensah', 'Owusu', 'Boateng'],
};

// Fallback for any country code not explicitly mapped below — a small mixed-region pool rather
// than crashing or defaulting to one specific culture.
const fallback: NamePool = {
  first: ['Alex', 'Sam', 'Chris', 'Leo', 'Max', 'Nico', 'Dani', 'Robin', 'Kim', 'Jordan'],
  last: ['Silva', 'Novak', 'Allen', 'Bergman', 'Moreau', 'Okoro', 'Rahman', 'Popescu', 'Lindgren', 'Castillo'],
};

/** Maps every country code used by the game's player pool and Davis Cup country lists to a
 * regional name pool. Anything not listed here falls back to a small mixed pool. */
const COUNTRY_TO_NAME_POOL: Record<string, NamePool> = {
  // English-speaking
  USA: english, GBR: english, AUS: english, NZL: english, CAN: english, IRL: english,
  BER: english, JAM: english, BAR: english,
  // Spanish-speaking
  ARG: spanish, CHI: spanish, COL: spanish, PER: spanish, ECU: spanish, URU: spanish,
  PAR: spanish, BOL: spanish, MEX: spanish, ESP: spanish, DOM: spanish, PUR: spanish, ESA: spanish,
  // Portuguese-speaking
  BRA: portuguese, POR: portuguese,
  // Italian
  ITA: italian,
  // French-speaking
  FRA: french, MON: french, LUX: french,
  // German-speaking
  GER: german, AUT: german, SUI: german,
  // Dutch-speaking
  NED: dutch, BEL: dutch,
  // Nordic
  SWE: nordic, NOR: nordic, DEN: nordic, FIN: nordic,
  // Balkan / South Slavic
  CRO: balkan, SRB: balkan, SLO: balkan, BIH: balkan, MNE: balkan, MKD: balkan, BUL: balkan,
  // West Slavic
  POL: westSlavic, CZE: westSlavic, SVK: westSlavic,
  // East Slavic
  UKR: eastSlavic, RUS: eastSlavic,
  // Baltic
  LTU: baltic, LAT: baltic, EST: baltic,
  // Greek
  GRE: greek, CYP: greek,
  // Turkish
  TUR: turkish,
  // Hungarian
  HUN: hungarian,
  // Romanian
  ROU: romanian, MDA: romanian,
  // East Asian
  JPN: japanese, KOR: korean, CHN: chinese, TPE: chinese, HKG: chinese,
  // Southeast Asian
  THA: southeastAsian, PHI: southeastAsian, INA: southeastAsian,
  // South Asian
  IND: southAsian, PAK: southAsian,
  // Arabic-speaking
  LIB: arabic, JOR: arabic, EGY: arabic, TUN: arabic, MAR: arabic, SYR: arabic,
  // Hebrew-speaking
  ISR: hebrew,
  // Caucasus
  GEO: caucasus,
  // Central Asian
  KAZ: centralAsian, UZB: centralAsian,
  // Sub-Saharan African
  RSA: african, NAM: african, TOG: african, BEN: african, SEN: african, NGR: african,
};

/** Get the regional name pool for a country code, falling back to a mixed pool for anything
 * not explicitly mapped (so an unrecognized/new code never crashes name generation). */
export function getNamePool(countryCode: string): NamePool {
  return COUNTRY_TO_NAME_POOL[countryCode] || fallback;
}

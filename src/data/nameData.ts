/**
 * Regional first/last name pools used to generate new players (retirements replacements,
 * Davis Cup country backfill, etc.) so a generated player's name actually fits their country —
 * no more "Kenji Martínez" showing up in Croatia. Grouped by linguistic/cultural region rather
 * than one pool per country (there are 80+ country codes across the game), which is close enough
 * for a name that just needs to feel plausible for where the player is from. Each pool is kept
 * fairly large so repeated rookie generation across many seasons doesn't start recycling the same
 * handful of names.
 */

export interface NamePool {
  first: string[];
  last: string[];
}

const english: NamePool = {
  first: ['James', 'William', 'Henry', 'Jack', 'Thomas', 'Oliver', 'George', 'Charlie', 'Daniel', 'Michael',
    'Ryan', 'Connor', 'Liam', 'Ethan', 'Nathan', 'Joshua', 'Samuel', 'Benjamin', 'Jacob', 'Matthew',
    'Andrew', 'Christopher', 'Joseph', 'David', 'Alexander', 'Owen', 'Luke', 'Harrison', 'Cameron', 'Dylan'],
  last: ['Smith', 'Johnson', 'Williams', 'Brown', 'Taylor', 'Anderson', 'Clarke', 'Wilson', 'Walker', 'Hughes',
    'Murphy', 'Campbell', 'Edwards', 'Mitchell', 'Bennett', 'Turner', 'Phillips', 'Robinson', 'Stewart', 'Morris',
    'Cook', 'Bailey', 'Reid', 'Cooper', 'Ward', 'Foster', 'Gray', 'James', 'Watson', 'Kelly'],
};

const spanish: NamePool = {
  first: ['Mateo', 'Santiago', 'Sebastián', 'Nicolás', 'Joaquín', 'Agustín', 'Tomás', 'Lucas', 'Emiliano', 'Franco',
    'Iván', 'Diego', 'Rodrigo', 'Martín', 'Facundo', 'Gonzalo', 'Cristian', 'Alejandro', 'Fernando', 'Manuel',
    'Pablo', 'Adrián', 'Rafael', 'Víctor', 'Javier', 'Andrés', 'Ignacio', 'Emilio', 'Enzo', 'Bautista'],
  last: ['García', 'Rodríguez', 'González', 'Fernández', 'López', 'Martínez', 'Sánchez', 'Pérez', 'Gómez', 'Díaz',
    'Torres', 'Ramírez', 'Flores', 'Acosta', 'Herrera', 'Molina', 'Ortiz', 'Vargas', 'Aguirre', 'Medina',
    'Castro', 'Rojas', 'Ibarra', 'Cabrera', 'Vega', 'Domínguez', 'Peña', 'Silva', 'Navarro', 'Guzmán'],
};

const portuguese: NamePool = {
  first: ['João', 'Pedro', 'Miguel', 'Rafael', 'Gustavo', 'Lucas', 'Bruno', 'Tiago', 'André', 'Diogo',
    'Rodrigo', 'Vítor', 'Gonçalo', 'Henrique', 'Matheus', 'Felipe', 'Caio', 'Leonardo', 'Eduardo', 'Fábio',
    'Ricardo', 'Nuno', 'Hugo', 'Marcelo', 'Thiago', 'Igor', 'Renato', 'Vinícius', 'Gabriel', 'Danilo'],
  last: ['Silva', 'Santos', 'Oliveira', 'Souza', 'Pereira', 'Costa', 'Carvalho', 'Almeida', 'Ribeiro', 'Ferreira',
    'Rocha', 'Teixeira', 'Lima', 'Martins', 'Correia', 'Alves', 'Barbosa', 'Cardoso', 'Nunes', 'Moreira',
    'Machado', 'Pinto', 'Dias', 'Freitas', 'Araújo', 'Cavalcanti', 'Gonçalves', 'Fonseca', 'Azevedo', 'Batista'],
};

const italian: NamePool = {
  first: ['Marco', 'Luca', 'Matteo', 'Andrea', 'Lorenzo', 'Alessandro', 'Francesco', 'Giovanni', 'Stefano', 'Davide',
    'Simone', 'Riccardo', 'Nicolò', 'Federico', 'Gabriele', 'Antonio', 'Giuseppe', 'Roberto', 'Fabio', 'Emanuele',
    'Paolo', 'Michele', 'Vincenzo', 'Salvatore', 'Alberto', 'Tommaso', 'Filippo', 'Leonardo', 'Enrico', 'Claudio'],
  last: ['Rossi', 'Russo', 'Ferrari', 'Esposito', 'Bianchi', 'Romano', 'Colombo', 'Ricci', 'Marino', 'Greco',
    'Bruno', 'Gallo', 'Conti', 'De Luca', 'Mancini', 'Costa', 'Giordano', 'Rizzo', 'Lombardi', 'Moretti',
    'Barbieri', 'Fontana', 'Santoro', 'Mariani', 'Rinaldi', 'Caruso', 'Ferrara', 'Galli', 'Martini', 'Leone'],
};

const french: NamePool = {
  first: ['Louis', 'Hugo', 'Gabriel', 'Arthur', 'Thomas', 'Antoine', 'Nicolas', 'Julien', 'Maxime', 'Alexandre',
    'Théo', 'Léo', 'Pierre', 'Baptiste', 'Quentin', 'Mathieu', 'Clément', 'Romain', 'Vincent', 'Florian',
    'Benoît', 'Guillaume', 'Adrien', 'Yohann', 'Kylian', 'Enzo', 'Rayan', 'Noé', 'Ethan', 'Valentin'],
  last: ['Martin', 'Bernard', 'Dubois', 'Thomas', 'Robert', 'Petit', 'Durand', 'Leroy', 'Moreau', 'Simon',
    'Laurent', 'Lefebvre', 'Michel', 'Garnier', 'Rousseau', 'Vincent', 'Fournier', 'Girard', 'Bonnet', 'Dupont',
    'Lambert', 'Fontaine', 'Rousset', 'Blanc', 'Guerin', 'Muller', 'Henry', 'Roussel', 'Nicolas', 'Perrin'],
};

const german: NamePool = {
  first: ['Lukas', 'Maximilian', 'Felix', 'Jonas', 'Tim', 'Julian', 'Niklas', 'Fabian', 'Moritz', 'Leon',
    'Paul', 'Sebastian', 'Jan', 'Tobias', 'Simon', 'Florian', 'Philipp', 'Daniel', 'Christian', 'Alexander',
    'Benedikt', 'Dominik', 'Matthias', 'Stefan', 'Andreas', 'Markus', 'Kevin', 'Marcel', 'Patrick', 'Robin'],
  last: ['Müller', 'Schmidt', 'Schneider', 'Fischer', 'Weber', 'Meyer', 'Wagner', 'Becker', 'Hoffmann', 'Schulz',
    'Koch', 'Richter', 'Klein', 'Wolf', 'Neumann', 'Schwarz', 'Zimmermann', 'Braun', 'Krüger', 'Hofmann',
    'Werner', 'Schmitt', 'Lange', 'Schäfer', 'Krause', 'Meier', 'Lehmann', 'Huber', 'Mayer', 'Herrmann'],
};

const dutch: NamePool = {
  first: ['Daan', 'Sem', 'Lars', 'Jesse', 'Thijs', 'Bram', 'Thomas', 'Ruben', 'Luuk', 'Wouter',
    'Koen', 'Niels', 'Joost', 'Stijn', 'Tim', 'Milan', 'Sander', 'Bas', 'Dirk', 'Willem',
    'Pieter', 'Gijs', 'Rick', 'Tom', 'Boaz', 'Jesper', 'Max', 'Sven', 'Job', 'Luca'],
  last: ['de Jong', 'Jansen', 'Bakker', 'Visser', 'Smit', 'Meijer', 'de Boer', 'Mulder', 'Dekker', 'Brouwer',
    'de Groot', 'Bos', 'Vos', 'Peters', 'Hendriks', 'van Dijk', 'Vermeulen', 'van der Berg', 'Kuipers', 'de Wit',
    'Willems', 'Dijkstra', 'Smits', 'de Ruiter', 'Post', 'Kok', 'Vink', 'Schouten', 'van Leeuwen', 'Hermans'],
};

const nordic: NamePool = {
  first: ['Erik', 'Anders', 'Lars', 'Henrik', 'Magnus', 'Oskar', 'Emil', 'Viktor', 'Aksel', 'Mikael',
    'Niklas', 'Sven', 'Anton', 'Elias', 'Jesper', 'Gustav', 'Fredrik', 'Johan', 'Karl', 'Oscar',
    'Aleksi', 'Juho', 'Ville', 'Onni', 'Jonas', 'Bjørn', 'Ole', 'Sigurd', 'Espen', 'Kalle'],
  last: ['Andersson', 'Johansson', 'Karlsson', 'Nilsson', 'Eriksson', 'Larsen', 'Hansen', 'Nielsen', 'Virtanen', 'Korhonen',
    'Mäkinen', 'Berg', 'Lindqvist', 'Holm', 'Dahl', 'Pedersen', 'Olsen', 'Sørensen', 'Lindberg', 'Sundberg',
    'Nygaard', 'Haugen', 'Iversen', 'Kallio', 'Laine', 'Heikkinen', 'Salminen', 'Lund', 'Bergström', 'Jokinen'],
};

const balkan: NamePool = {
  first: ['Nikola', 'Stefan', 'Marko', 'Luka', 'Filip', 'Ivan', 'Milan', 'Aleksandar', 'Petar', 'Dušan',
    'Vuk', 'Andrej', 'Goran', 'Dario', 'Ante', 'Bojan', 'Miloš', 'Dejan', 'Vladimir', 'Zoran',
    'Igor', 'Marin', 'Tin', 'Josip', 'Domagoj', 'Slaven', 'Vlado', 'Denis', 'Damir', 'Kristijan'],
  last: ['Petrović', 'Jovanović', 'Marković', 'Nikolić', 'Popović', 'Stojanović', 'Kovačević', 'Horvat', 'Novak', 'Babić',
    'Radić', 'Vuković', 'Đorđević', 'Pavlović', 'Kolar', 'Ilić', 'Simić', 'Knežević', 'Kovač', 'Matić',
    'Perić', 'Kralj', 'Blažević', 'Lukić', 'Tomić', 'Dimitrijević', 'Šarić', 'Rakić', 'Vidović', 'Kos'],
};

const westSlavic: NamePool = {
  first: ['Jakub', 'Filip', 'Michał', 'Piotr', 'Wojciech', 'Tomáš', 'Jan', 'Martin', 'Petr', 'Adam',
    'Kacper', 'Mateusz', 'Dominik', 'Marek', 'Krzysztof', 'Paweł', 'Łukasz', 'Bartosz', 'Rafał', 'Ondřej',
    'Václav', 'Jakub', 'Šimon', 'Lukáš', 'David', 'Kamil', 'Igor', 'Jindřich', 'Radek', 'Přemysl'],
  last: ['Nowak', 'Kowalski', 'Wiśniewski', 'Wójcik', 'Dvořák', 'Novák', 'Svoboda', 'Procházka', 'Horák', 'Kučera',
    'Kowalczyk', 'Kamiński', 'Zieliński', 'Král', 'Marek', 'Wójtowicz', 'Lewandowski', 'Szymański', 'Woźniak', 'Dąbrowski',
    'Beneš', 'Pokorný', 'Sedláček', 'Veselý', 'Krejčí', 'Hájek', 'Urban', 'Kolář', 'Bartoš', 'Vaněk'],
};

const eastSlavic: NamePool = {
  first: ['Dmitri', 'Andrei', 'Ivan', 'Mikhail', 'Sergei', 'Alexei', 'Nikolai', 'Pavel', 'Viktor', 'Roman',
    'Vladimir', 'Yuri', 'Oleg', 'Igor', 'Artem', 'Denis', 'Maxim', 'Anton', 'Konstantin', 'Vadim',
    'Stanislav', 'Yevgeny', 'Ruslan', 'Bogdan', 'Taras', 'Oleksandr', 'Volodymyr', 'Ihor', 'Vitaliy', 'Sergiy'],
  last: ['Ivanov', 'Petrov', 'Sidorov', 'Volkov', 'Sokolov', 'Kuznetsov', 'Morozov', 'Popov', 'Vasiliev', 'Fedorov',
    'Smirnov', 'Novikov', 'Koval', 'Bondarenko', 'Melnyk', 'Shevchenko', 'Kovalenko', 'Kravchenko', 'Tkachenko', 'Boyko',
    'Lysenko', 'Marchenko', 'Rudenko', 'Savchenko', 'Pavlenko', 'Zaitsev', 'Orlov', 'Gusev', 'Belov', 'Egorov'],
};

const baltic: NamePool = {
  first: ['Karolis', 'Tomas', 'Mantas', 'Rokas', 'Andrius', 'Kristaps', 'Jānis', 'Mārtiņš', 'Rainer', 'Marek',
    'Kaspar', 'Gustav', 'Erik', 'Toivo', 'Andres', 'Aivars', 'Edgars', 'Gatis', 'Raivis', 'Normunds',
    'Vytautas', 'Darius', 'Gediminas', 'Arūnas', 'Marius', 'Priit', 'Margus', 'Tanel', 'Rein', 'Urmas'],
  last: ['Jankauskas', 'Kazlauskas', 'Petrauskas', 'Vasiliauskas', 'Bērziņš', 'Kalniņš', 'Ozoliņš', 'Tamm', 'Saar', 'Kask',
    'Sepp', 'Rebane', 'Laine', 'Mets', 'Kukk', 'Vīksne', 'Krastiņš', 'Zariņš', 'Balčiūnas', 'Stankevičius',
    'Butkus', 'Urbonas', 'Paulauskas', 'Riibe', 'Kallas', 'Mägi', 'Kelder', 'Pärn', 'Talvik', 'Kivi'],
};

const greek: NamePool = {
  first: ['Stefanos', 'Nikos', 'Giorgos', 'Kostas', 'Dimitris', 'Yannis', 'Alexandros', 'Vasilis', 'Panagiotis', 'Christos',
    'Michalis', 'Aris', 'Petros', 'Andreas', 'Marios', 'Thanos', 'Spyros', 'Theodoros', 'Apostolos', 'Leonidas',
    'Ioannis', 'Konstantinos', 'Pavlos', 'Efstathios', 'Charalambos', 'Grigoris', 'Emmanouil', 'Nikolaos', 'Achilleas', 'Orestis'],
  last: ['Papadopoulos', 'Papadakis', 'Nikolaidis', 'Georgiou', 'Vasileiou', 'Antoniou', 'Christodoulou', 'Konstantinou', 'Ioannou', 'Dimitriou',
    'Michaelides', 'Stavrou', 'Petrides', 'Pavlou', 'Loizou', 'Papastavrou', 'Karagiannis', 'Economou', 'Angelopoulos', 'Makris',
    'Pappas', 'Fotiadis', 'Triantafyllou', 'Kyriakou', 'Stefanidis', 'Zervas', 'Moschos', 'Sideris', 'Katsaros', 'Liakos'],
};

const turkish: NamePool = {
  first: ['Emre', 'Mert', 'Berk', 'Can', 'Yusuf', 'Ahmet', 'Mehmet', 'Burak', 'Onur', 'Kaan',
    'Serkan', 'Umut', 'Cem', 'Baran', 'Tolga', 'Emirhan', 'Furkan', 'Enes', 'Ege', 'Kerem',
    'Hakan', 'Barış', 'Alp', 'Deniz', 'Ozan', 'Batuhan', 'Yiğit', 'Mustafa', 'Caner', 'Sinan'],
  last: ['Yılmaz', 'Kaya', 'Demir', 'Şahin', 'Çelik', 'Yıldız', 'Aydın', 'Arslan', 'Doğan', 'Kılıç',
    'Aslan', 'Çetin', 'Koç', 'Kurt', 'Özdemir', 'Şimşek', 'Polat', 'Korkmaz', 'Özkan', 'Bulut',
    'Yalçın', 'Aksoy', 'Avcı', 'Erdoğan', 'Türk', 'Güneş', 'Aktaş', 'Akın', 'Keskin', 'Uçar'],
};

const hungarian: NamePool = {
  first: ['Bence', 'Ádám', 'Balázs', 'Gergő', 'Zoltán', 'László', 'Péter', 'Tamás', 'Levente', 'Máté',
    'Dániel', 'Krisztián', 'Attila', 'Gábor', 'Márton', 'Csaba', 'Norbert', 'Ákos', 'Zsolt', 'Áron',
    'Szabolcs', 'Ferenc', 'Roland', 'Milán', 'Botond', 'Kristóf', 'Barnabás', 'Erik', 'Vince', 'Bálint'],
  last: ['Nagy', 'Kovács', 'Tóth', 'Szabó', 'Horváth', 'Varga', 'Kiss', 'Molnár', 'Németh', 'Farkas',
    'Balogh', 'Papp', 'Takács', 'Juhász', 'Lakatos', 'Mészáros', 'Oláh', 'Simon', 'Rácz', 'Fekete',
    'Szűcs', 'Balázs', 'Fehér', 'Gál', 'Sipos', 'Kis', 'Vörös', 'Kelemen', 'Magyar', 'Csonka'],
};

const romanian: NamePool = {
  first: ['Andrei', 'Mihai', 'Alexandru', 'Radu', 'Cristian', 'Florin', 'Daniel', 'Ionuț', 'Vlad', 'Gabriel',
    'Adrian', 'Sorin', 'Cătălin', 'Marius', 'Ștefan', 'Bogdan', 'Cosmin', 'Emil', 'Valentin', 'Tudor',
    'Dan', 'Marian', 'Constantin', 'Nicolae', 'George', 'Paul', 'Iulian', 'Victor', 'Laurențiu', 'Codrin'],
  last: ['Popescu', 'Ionescu', 'Popa', 'Dumitru', 'Stan', 'Stoica', 'Gheorghe', 'Constantin', 'Matei', 'Ilie',
    'Tudor', 'Marin', 'Toma', 'Dinu', 'Radu', 'Rusu', 'Munteanu', 'Neagu', 'Barbu', 'Diaconu',
    'Nistor', 'Preda', 'Lungu', 'Coman', 'Manea', 'Petrescu', 'Anghel', 'Florea', 'Voicu', 'Tănase'],
};

const japanese: NamePool = {
  first: ['Kenji', 'Hiroshi', 'Takeshi', 'Yuto', 'Sora', 'Haruto', 'Ren', 'Sota', 'Daiki', 'Yuki',
    'Kaito', 'Riku', 'Sho', 'Naoki', 'Tatsuya', 'Kazuki', 'Ryo', 'Hayato', 'Ryota', 'Kosuke',
    'Yamato', 'Shun', 'Kenta', 'Aoi', 'Itsuki', 'Mizuki', 'Rento', 'Kai', 'Tsubasa', 'Ken'],
  last: ['Sato', 'Suzuki', 'Takahashi', 'Tanaka', 'Watanabe', 'Ito', 'Yamamoto', 'Nakamura', 'Kobayashi', 'Saito',
    'Kato', 'Yoshida', 'Yamada', 'Sasaki', 'Matsumoto', 'Inoue', 'Kimura', 'Hayashi', 'Shimizu', 'Yamazaki',
    'Ikeda', 'Hashimoto', 'Abe', 'Ishikawa', 'Mori', 'Ogawa', 'Fujita', 'Okada', 'Goto', 'Hasegawa'],
};

const korean: NamePool = {
  first: ['Min-jun', 'Ji-ho', 'Seo-jun', 'Do-yun', 'Joon-ho', 'Hyun-woo', 'Tae-yang', 'Jun-seo', 'Woo-jin', 'Sung-min',
    'Jae-won', 'Dong-hyun', 'Kyung-soo', 'Yong-jin', 'Chan-ho', 'Seung-hyun', 'Min-ho', 'Jong-suk', 'Kang-in', 'Hyun-jun',
    'Tae-min', 'Yoon-seok', 'Ji-hoon', 'Sang-woo', 'Byung-chul', 'Won-jae', 'Se-jin', 'Hyeon-woo', 'In-su', 'Dae-ho'],
  last: ['Kim', 'Lee', 'Park', 'Choi', 'Jung', 'Kang', 'Cho', 'Yoon', 'Jang', 'Lim',
    'Han', 'Oh', 'Seo', 'Shin', 'Kwon', 'Hwang', 'Ahn', 'Song', 'Yoo', 'Hong',
    'Moon', 'Yang', 'Bae', 'Baek', 'Nam', 'Noh', 'Gwon', 'Ha', 'Ryu', 'Jin'],
};

const chinese: NamePool = {
  first: ['Wei', 'Jun', 'Hao', 'Lei', 'Ming', 'Chen', 'Tao', 'Bo', 'Yong', 'Kai',
    'Jian', 'Feng', 'Qiang', 'Peng', 'Zhi', 'Yang', 'Fei', 'Long', 'Zhen', 'Cheng',
    'Ping', 'Hui', 'Jie', 'Yu', 'Bin', 'Xin', 'Rui', 'Shun', 'Wen', 'Han'],
  last: ['Wang', 'Li', 'Zhang', 'Liu', 'Chen', 'Yang', 'Huang', 'Zhao', 'Wu', 'Zhou',
    'Xu', 'Sun', 'Ma', 'Zhu', 'Hu', 'Guo', 'He', 'Gao', 'Lin', 'Luo',
    'Zheng', 'Liang', 'Xie', 'Song', 'Tang', 'Han', 'Cao', 'Deng', 'Feng', 'Yu'],
};

const southeastAsian: NamePool = {
  first: ['Somchai', 'Arthit', 'Krit', 'Nattapong', 'Chai', 'Jose', 'Mark', 'Paolo', 'Carlo', 'Miguel',
    'Budi', 'Agus', 'Made', 'Wayan', 'Andi', 'Anucha', 'Sirawit', 'Panupong', 'Jomtien', 'Ekachai',
    'Ronnie', 'Alvin', 'John', 'Angelo', 'Renz', 'Rizal', 'Bayu', 'Dedi', 'Fajar', 'Hendra'],
  last: ['Srisai', 'Charoen', 'Suwan', 'Thongchai', 'Santos', 'Reyes', 'Cruz', 'Bautista', 'Ramos', 'Wijaya',
    'Santoso', 'Kusuma', 'Saputra', 'Putra', 'Gunawan', 'Pattanakul', 'Kittikorn', 'Jaidee', 'Chaiyaporn', 'Boonmee',
    'Villanueva', 'Aquino', 'Mendoza', 'Torres', 'De Guzman', 'Wibowo', 'Setiawan', 'Nugroho', 'Pratama', 'Hidayat'],
};

const southAsian: NamePool = {
  first: ['Arjun', 'Rohan', 'Aditya', 'Vikram', 'Rahul', 'Karan', 'Siddharth', 'Aryan', 'Kabir', 'Rishi',
    'Ahmed', 'Usman', 'Bilal', 'Hamza', 'Zain', 'Varun', 'Aman', 'Dev', 'Nikhil', 'Sameer',
    'Farhan', 'Imran', 'Danish', 'Shahid', 'Anand', 'Suresh', 'Ramesh', 'Manoj', 'Ashwin', 'Harsh'],
  last: ['Sharma', 'Patel', 'Singh', 'Kumar', 'Verma', 'Gupta', 'Reddy', 'Khan', 'Malik', 'Chaudhry',
    'Iqbal', 'Raza', 'Hussain', 'Ali', 'Shaikh', 'Mehta', 'Joshi', 'Nair', 'Rao', 'Chauhan',
    'Yadav', 'Bhatt', 'Kapoor', 'Bajwa', 'Farooq', 'Siddiqui', 'Qureshi', 'Butt', 'Naidu', 'Menon'],
};

const arabic: NamePool = {
  first: ['Karim', 'Omar', 'Youssef', 'Hamza', 'Amine', 'Rachid', 'Khaled', 'Tarek', 'Samir', 'Nabil',
    'Adnan', 'Bassam', 'Rami', 'Hassan', 'Ziad', 'Walid', 'Ayman', 'Mourad', 'Anas', 'Ismail',
    'Fadi', 'Marwan', 'Sami', 'Zakaria', 'Hicham', 'Ayoub', 'Mehdi', 'Reda', 'Sofiane', 'Kamal'],
  last: ['El Amrani', 'Haddad', 'Khalil', 'Mansour', 'Saad', 'Nasser', 'Fares', 'Chahine', 'Barakat', 'Aziz',
    'Al-Sayed', 'Benali', 'Idrissi', 'Zidan', 'Younes', 'Cherkaoui', 'Bensalem', 'El Fassi', 'Alaoui', 'Bouzid',
    'Rahal', 'Karimi', 'Nassar', 'Hamdi', 'Chraibi', 'Belkacem', 'Ouazzani', 'Fahmy', 'Salim', 'Kassab'],
};

const hebrew: NamePool = {
  first: ['Amit', 'Yonatan', 'Tomer', 'Daniel', 'Itai', 'Noam', 'Eitan', 'Roee', 'Guy', 'Ariel',
    'Omer', 'Ido', 'Nadav', 'Uri', 'Liam', 'Yair', 'Matan', 'Asaf', 'Ron', 'Adam',
    'Yaniv', 'Shahar', 'Elad', 'Gilad', 'Amir', 'Doron', 'Oren', 'Tal', 'Yuval', 'Ilan'],
  last: ['Cohen', 'Levi', 'Mizrahi', 'Peretz', 'Biton', 'Azoulay', 'Katz', 'Friedman', 'Shapiro', 'Avraham',
    'Dahan', 'Malka', 'Amar', 'Gabay', 'Bar', 'Sasson', 'Ben David', 'Barak', 'Golan', 'Hazan',
    'Toledano', 'Elbaz', 'Shalev', 'Nahum', 'Yosef', 'Sharon', 'Mor', 'Ezra', 'Aharon', 'Ohana'],
};

const caucasus: NamePool = {
  first: ['Giorgi', 'Nika', 'Luka', 'Davit', 'Levan', 'Saba', 'Otar', 'Tornike', 'Beka', 'Irakli',
    'Zaza', 'Vakhtang', 'Guram', 'Kakha', 'Shota', 'Data', 'Mamuka', 'Gia', 'Archil', 'Zurab',
    'Lasha', 'Temuri', 'Rezo', 'Merab', 'Koba', 'Vano', 'Giga', 'Avto', 'Sandro', 'Bacho'],
  last: ['Beridze', 'Kapanadze', 'Lomidze', 'Gelashvili', 'Meladze', 'Tsiklauri', 'Kiknadze', 'Chikvaidze', 'Japaridze', 'Kavtaradze',
    'Machaidze', 'Tsereteli', 'Abashidze', 'Kobakhidze', 'Gogia', 'Kldiashvili', 'Nadiradze', 'Tsintsadze', 'Sharashenidze', 'Managadze',
    'Kekelidze', 'Gagnidze', 'Khachidze', 'Lortkipanidze', 'Metreveli', 'Dzhaparidze', 'Bakhtadze', 'Tabatadze', 'Chachanidze', 'Odishvili'],
};

const centralAsian: NamePool = {
  first: ['Timur', 'Alisher', 'Dias', 'Nurlan', 'Aidos', 'Bekzat', 'Yerlan', 'Ruslan', 'Daulet', 'Sanjar',
    'Bakhtiyor', 'Farrukh', 'Shokhrukh', 'Javokhir', 'Otabek', 'Nurbek', 'Erlan', 'Askar', 'Nursultan', 'Damir',
    'Temirlan', 'Azamat', 'Islambek', 'Sardor', 'Jasur', 'Murat', 'Sabyr', 'Yergali', 'Bauyrzhan', 'Kanat'],
  last: ['Nazarov', 'Yusupov', 'Karimov', 'Ismailov', 'Rashidov', 'Abdullaev', 'Sultanov', 'Aliyev', 'Rakhimov', 'Ahmedov',
    'Saidov', 'Tashkentov', 'Yuldashev', 'Ergashev', 'Nurmatov', 'Bekov', 'Tulegenov', 'Ospanov', 'Zhaksybekov', 'Amanov',
    'Seitkali', 'Dzhaksybekov', 'Turgunov', 'Kamalov', 'Mirzoev', 'Sharipov', 'Tashkulov', 'Kydyrov', 'Abenov', 'Sagynov'],
};

const african: NamePool = {
  first: ['Thabo', 'Sipho', 'Lwazi', 'Kagiso', 'Tumelo', 'Kwame', 'Kofi', 'Emeka', 'Chidi', 'Ibrahima',
    'Mamadou', 'Cheikh', 'Ousmane', 'Abdoulaye', 'Oluwaseun', 'Sizwe', 'Bongani', 'Themba', 'Lindani', 'Andile',
    'Kwabena', 'Yaw', 'Chukwuemeka', 'Adewale', 'Babajide', 'Moussa', 'Seydou', 'Alassane', 'Modou', 'Souleymane'],
  last: ['Nkosi', 'Dlamini', 'Mokoena', 'van der Merwe', 'Botha', 'Pretorius', 'Diallo', 'Traoré', 'Diop', 'Okafor',
    'Adeyemi', 'Balogun', 'Mensah', 'Owusu', 'Boateng', 'Khumalo', 'Ndlovu', 'Zulu', 'Naidoo', 'Steyn',
    'Sow', 'Toure', 'Fall', 'Kane', 'Ndiaye', 'Osei', 'Asante', 'Nwosu', 'Eze', 'Bello'],
};

// Fallback for any country code not explicitly mapped below — a small mixed-region pool rather
// than crashing or defaulting to one specific culture.
const fallback: NamePool = {
  first: ['Alex', 'Sam', 'Chris', 'Leo', 'Max', 'Nico', 'Dani', 'Robin', 'Kim', 'Jordan',
    'Ariel', 'Charlie', 'Micha', 'Andrea', 'Noa', 'Kai', 'Rene', 'Sasha', 'Toni', 'Morgan'],
  last: ['Silva', 'Novak', 'Allen', 'Bergman', 'Moreau', 'Okoro', 'Rahman', 'Popescu', 'Lindgren', 'Castillo',
    'Weiss', 'Adams', 'Ferreira', 'Kowal', 'Lindholm', 'Petit', 'Osei', 'Malik', 'Varga', 'Sandoval'],
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

/**
 * Regional first/last name pools used to generate new players (retirements replacements,
 * Davis Cup country backfill, etc.) so a generated player's name actually fits their country —
 * no more "Kenji Martínez" showing up in Croatia. Grouped by linguistic/cultural region rather
 * than one pool per country (there are 80+ country codes across the game), which is close enough
 * for a name that just needs to feel plausible for where the player is from.
 *
 * Pools are kept large (60-90 names per list) specifically so that a long Career-mode save
 * doesn't start recycling the same handful of names after a few dozen seasons of rookie/backfill
 * generation. Spanish-speaking countries — the single biggest cluster of country codes in the
 * game (Spain, Argentina, Chile, Mexico, Colombia, Peru, Ecuador, Uruguay, Paraguay, Bolivia,
 * Dominican Republic, Puerto Rico, El Salvador) — are additionally split into four sub-regional
 * pools instead of one shared list, both for extra combinations and so a Mexican and an Argentine
 * rookie don't end up sounding identical.
 */

export interface NamePool {
  first: string[];
  last: string[];
}

const english: NamePool = {
  first: ['James', 'William', 'Henry', 'Jack', 'Thomas', 'Oliver', 'George', 'Charlie', 'Daniel', 'Michael',
    'Ryan', 'Connor', 'Liam', 'Ethan', 'Nathan', 'Joshua', 'Samuel', 'Benjamin', 'Jacob', 'Matthew',
    'Andrew', 'Christopher', 'Joseph', 'David', 'Alexander', 'Owen', 'Luke', 'Harrison', 'Cameron', 'Dylan',
    'Callum', 'Aidan', 'Felix', 'Jasper', 'Finlay', 'Archie', 'Freddie', 'Toby', 'Isaac', 'Elliot',
    'Zachary', 'Caleb', 'Noah', 'Adam', 'Dominic', 'Edward', 'Leo', 'Max', 'Sean', 'Declan',
    'Brendan', 'Kyle', 'Jordan', 'Ashton', 'Cody', 'Blake', 'Travis', 'Corey', 'Tyler', 'Austin'],
  last: ['Smith', 'Johnson', 'Williams', 'Brown', 'Taylor', 'Anderson', 'Clarke', 'Wilson', 'Walker', 'Hughes',
    'Murphy', 'Campbell', 'Edwards', 'Mitchell', 'Bennett', 'Turner', 'Phillips', 'Robinson', 'Stewart', 'Morris',
    'Cook', 'Bailey', 'Reid', 'Cooper', 'Ward', 'Foster', 'Gray', 'James', 'Watson', 'Kelly',
    'Hunter', 'Palmer', 'Chapman', 'Price', 'Fisher', 'Webb', 'Marshall', 'Harrison', 'Sullivan', 'Gordon',
    'Ferguson', 'Douglas', 'Graham', 'Barrett', 'Henderson', 'Mackenzie', 'Dawson', 'Lawson', 'Whitfield', 'Nolan',
    'O’Brien', 'Flynn', 'Kennedy', 'Doyle', 'Byrne', 'Ryan', 'Walsh', 'Maguire', 'Cassidy', 'Quinn'],
};

// ---------- Spanish-speaking, split by sub-region ----------

const spanishRiver: NamePool = { // Argentina, Uruguay, Paraguay
  first: ['Mateo', 'Santiago', 'Sebastián', 'Nicolás', 'Joaquín', 'Agustín', 'Tomás', 'Lucas', 'Emiliano', 'Franco',
    'Iván', 'Diego', 'Rodrigo', 'Martín', 'Facundo', 'Gonzalo', 'Cristian', 'Alejandro', 'Fernando', 'Manuel',
    'Pablo', 'Adrián', 'Rafael', 'Víctor', 'Javier', 'Andrés', 'Ignacio', 'Emilio', 'Enzo', 'Bautista',
    'Ramiro', 'Julián', 'Bruno', 'Ezequiel', 'Maximiliano', 'Nahuel', 'Lautaro', 'Federico', 'Valentín', 'Gaspar',
    'Ariel', 'Marcelo', 'Leandro', 'Guido', 'Rolando', 'Ceferino', 'Camilo', 'Esteban', 'Ulises', 'Renzo',
    'Tobías', 'Thiago', 'Benicio', 'Dante', 'Ian', 'Bastián', 'Cristóbal', 'Rocco', 'Salvador', 'Gael'],
  last: ['García', 'Rodríguez', 'González', 'Fernández', 'López', 'Martínez', 'Sánchez', 'Pérez', 'Gómez', 'Díaz',
    'Torres', 'Ramírez', 'Flores', 'Acosta', 'Herrera', 'Molina', 'Ortiz', 'Vargas', 'Aguirre', 'Medina',
    'Castro', 'Rojas', 'Ibarra', 'Cabrera', 'Vega', 'Domínguez', 'Peña', 'Silva', 'Navarro', 'Guzmán',
    'Benítez', 'Duarte', 'Ayala', 'Villalba', 'Coronel', 'Insaurralde', 'Cardozo', 'Bogado', 'Ledesma', 'Gauna',
    'Quiroga', 'Alvarado', 'Bustos', 'Ponce', 'Correa', 'Godoy', 'Paredes', 'Escobar', 'Carrizo', 'Cáceres',
    'Almada', 'Suárez', 'Vera', 'Villanueva', 'Robledo', 'Funes', 'Miranda', 'Zabala', 'Techera', 'Píriz'],
};

const spanishAndean: NamePool = { // Chile, Peru, Bolivia, Ecuador, Colombia
  first: ['Mateo', 'Santiago', 'Sebastián', 'Nicolás', 'Joaquín', 'Vicente', 'Tomás', 'Cristóbal', 'Matías', 'Felipe',
    'Diego', 'Rodrigo', 'Alonso', 'Fabián', 'Camilo', 'Andrés', 'Alejandro', 'Manuel', 'David', 'Jorge',
    'Julián', 'Esteban', 'Sergio', 'Óscar', 'Iván', 'Eduardo', 'Ricardo', 'Bryan', 'Kevin', 'Jhon',
    'Cristian', 'Wilmer', 'Freddy', 'Yerko', 'Nayel', 'Byron', 'Erick', 'Anderson', 'Steven', 'Luis',
    'Danilo', 'Ronaldo', 'Marlon', 'Israel', 'Segundo', 'Wilson', 'Alan', 'Renato', 'Yerson', 'Elian',
    'Claudio', 'Rubén', 'Hernán', 'Pascual', 'Domingo', 'Aldo', 'Mauricio', 'Gonzalo', 'Emerson', 'Nixon'],
  last: ['Muñoz', 'Rojas', 'Soto', 'Vargas', 'Reyes', 'Contreras', 'Espinoza', 'Sepúlveda', 'Fuentes', 'Tapia',
    'Carrasco', 'Morales', 'Araya', 'Cortés', 'Sandoval', 'Fernández', 'Valdés', 'Bravo', 'Lagos', 'Zúñiga',
    'Mamani', 'Quispe', 'Huamán', 'Condori', 'Vilca', 'Choque', 'Cusi', 'Apaza', 'Flores', 'Gutiérrez',
    'Ramos', 'Chávez', 'Salazar', 'Cárdenas', 'Vásquez', 'Quintero', 'Zapata', 'Marín', 'Cadena', 'Lasso',
    'Toapanta', 'Yépez', 'Guaman', 'Andrade', 'Cevallos', 'Zambrano', 'Pinzón', 'Bermúdez', 'Valderrama', 'Ospina',
    'Gaviria', 'Villegas', 'Restrepo', 'Cuellar', 'Rincón', 'Mosquera', 'Balcázar', 'Chura', 'Yucra', 'Vega'],
};

const spanishIberian: NamePool = { // Spain
  first: ['Álvaro', 'Pablo', 'Daniel', 'Hugo', 'Adrián', 'Mario', 'Javier', 'Sergio', 'Marcos', 'Carlos',
    'Diego', 'Rubén', 'Iker', 'Aitor', 'Unai', 'Óscar', 'Raúl', 'Eduardo', 'Guillermo', 'Jaime',
    'Ismael', 'Lucas', 'Bruno', 'Martín', 'Gonzalo', 'Nacho', 'Rodrigo', 'Fermín', 'Mikel', 'Ander',
    'Iván', 'Borja', 'Íñigo', 'Enrique', 'Tomás', 'Julio', 'Emilio', 'Agustín', 'Vicente', 'Ximo',
    'Roc', 'Pol', 'Biel', 'Jan', 'Gerard', 'Marc', 'Jordi', 'Arnau', 'Eneko', 'Asier',
    'Cristian', 'Iago', 'Xoel', 'Brais', 'Noel', 'Antón', 'Fran', 'Nando', 'Salva', 'Toni'],
  last: ['Fernández', 'González', 'Rodríguez', 'López', 'Martínez', 'Sánchez', 'Pérez', 'Gómez', 'Martín', 'Jiménez',
    'Ruiz', 'Hernández', 'Díaz', 'Moreno', 'Muñoz', 'Álvarez', 'Romero', 'Alonso', 'Gutiérrez', 'Navarro',
    'Torres', 'Domínguez', 'Vázquez', 'Ramos', 'Gil', 'Serrano', 'Blanco', 'Suárez', 'Molina', 'Morales',
    'Ortega', 'Delgado', 'Castro', 'Ortiz', 'Rubio', 'Marín', 'Sanz', 'Iglesias', 'Nuñez', 'Medina',
    'Garrido', 'Cortés', 'Santos', 'Guerrero', 'Cano', 'Prieto', 'Méndez', 'Cruz', 'Calvo', 'Gallego',
    'Vidal', 'Soler', 'Roca', 'Puig', 'Bosch', 'Ferrer', 'Camps', 'Costa', 'Vila', 'Esteve'],
};

const spanishMexCaribe: NamePool = { // Mexico, Dominican Republic, Puerto Rico, El Salvador
  first: ['Emiliano', 'Santiago', 'Leonardo', 'Mateo', 'Diego', 'Daniel', 'Ángel', 'José', 'Miguel', 'Alejandro',
    'Iker', 'Osvaldo', 'Rodrigo', 'Kevin', 'Christopher', 'Erick', 'Jesús', 'Jonathan', 'Édgar', 'Ricardo',
    'Luis', 'Carlos', 'Fernando', 'Raúl', 'Marco', 'Antonio', 'Alan', 'Uriel', 'Giovanni', 'Yahir',
    'Franklin', 'Yohan', 'Anderson', 'Elvis', 'Junior', 'Manuel', 'Eddy', 'Wilfredo', 'Elías', 'Yeuri',
    'Yandel', 'Wilson', 'Deivid', 'Ronny', 'Bryan', 'Abner', 'Moisés', 'Nelson', 'Jairo', 'Denis',
    'Wilber', 'Saúl', 'Noé', 'Ezequiel', 'Ronaldo', 'Douglas', 'Balmore', 'Salomón', 'Milton', 'Édwin'],
  last: ['Hernández', 'García', 'Martínez', 'López', 'González', 'Pérez', 'Sánchez', 'Ramírez', 'Cruz', 'Flores',
    'Gómez', 'Díaz', 'Reyes', 'Morales', 'Jiménez', 'Ortiz', 'Gutiérrez', 'Chávez', 'Ramos', 'Mendoza',
    'Vargas', 'Castillo', 'Rivera', 'Rojas', 'Aguilar', 'Salazar', 'Estrada', 'Guerrero', 'Vázquez', 'Ibarra',
    'Peralta', 'Familia', 'Tavárez', 'Rosario', 'Féliz', 'Matos', 'Encarnación', 'Guzmán', 'Ventura', 'Núñez',
    'Rondón', 'Bautista', 'Severino', 'Colón', 'Vega', 'Figueroa', 'Cortés', 'Alfaro', 'Menjívar', 'Portillo',
    'Escobar', 'Cerón', 'Argueta', 'Majano', 'Henríquez', 'Quijano', 'Cea', 'Rivas', 'Chacón', 'Zaldívar'],
};

const portuguese: NamePool = {
  first: ['João', 'Pedro', 'Miguel', 'Rafael', 'Gustavo', 'Lucas', 'Bruno', 'Tiago', 'André', 'Diogo',
    'Rodrigo', 'Vítor', 'Gonçalo', 'Henrique', 'Matheus', 'Felipe', 'Caio', 'Leonardo', 'Eduardo', 'Fábio',
    'Ricardo', 'Nuno', 'Hugo', 'Marcelo', 'Thiago', 'Igor', 'Renato', 'Vinícius', 'Gabriel', 'Danilo',
    'Murilo', 'Breno', 'Everton', 'Wesley', 'Anderson', 'Kaique', 'Otávio', 'Rogério', 'Yuri', 'Wagner',
    'Cauã', 'Enzo', 'Davi', 'Heitor', 'Bernardo', 'Samuel', 'Arthur', 'Théo', 'Emanuel', 'Lorenzo',
    'Simão', 'Duarte', 'Afonso', 'Salvador', 'Martim', 'Francisco', 'Rui', 'Sérgio', 'Paulo', 'José'],
  last: ['Silva', 'Santos', 'Oliveira', 'Souza', 'Pereira', 'Costa', 'Carvalho', 'Almeida', 'Ribeiro', 'Ferreira',
    'Rocha', 'Teixeira', 'Lima', 'Martins', 'Correia', 'Alves', 'Barbosa', 'Cardoso', 'Nunes', 'Moreira',
    'Machado', 'Pinto', 'Dias', 'Freitas', 'Araújo', 'Cavalcanti', 'Gonçalves', 'Fonseca', 'Azevedo', 'Batista',
    'Monteiro', 'Cunha', 'Melo', 'Pinheiro', 'Farias', 'Vieira', 'Andrade', 'Campos', 'Braga', 'Nogueira',
    'Amaral', 'Reis', 'Marques', 'Coelho', 'Guerra', 'Xavier', 'Tavares', 'Assunção', 'Peixoto', 'Salgado',
    'Neves', 'Caldeira', 'Esteves', 'Antunes', 'Matos', 'Sousa', 'Lopes', 'Faria', 'Brito', 'Magalhães'],
};

const italian: NamePool = {
  first: ['Marco', 'Luca', 'Matteo', 'Andrea', 'Lorenzo', 'Alessandro', 'Francesco', 'Giovanni', 'Stefano', 'Davide',
    'Simone', 'Riccardo', 'Nicolò', 'Federico', 'Gabriele', 'Antonio', 'Giuseppe', 'Roberto', 'Fabio', 'Emanuele',
    'Paolo', 'Michele', 'Vincenzo', 'Salvatore', 'Alberto', 'Tommaso', 'Filippo', 'Leonardo', 'Enrico', 'Claudio',
    'Massimo', 'Edoardo', 'Pietro', 'Cristian', 'Gianluca', 'Daniele', 'Raffaele', 'Domenico', 'Mattia', 'Samuele',
    'Jacopo', 'Nicola', 'Renato', 'Sebastiano', 'Valerio', 'Ivan', 'Manuel', 'Corrado', 'Ettore', 'Bruno',
    'Luigi', 'Dario', 'Umberto', 'Gioele', 'Tiziano', 'Carlo', 'Franco', 'Aldo', 'Ugo', 'Bernardo'],
  last: ['Rossi', 'Russo', 'Ferrari', 'Esposito', 'Bianchi', 'Romano', 'Colombo', 'Ricci', 'Marino', 'Greco',
    'Bruno', 'Gallo', 'Conti', 'De Luca', 'Mancini', 'Costa', 'Giordano', 'Rizzo', 'Lombardi', 'Moretti',
    'Barbieri', 'Fontana', 'Santoro', 'Mariani', 'Rinaldi', 'Caruso', 'Ferrara', 'Galli', 'Martini', 'Leone',
    'Longo', 'Gentile', 'Martinelli', 'Vitale', 'Lombardo', 'Serra', 'Coppola', 'De Santis', 'D’Angelo', 'Marchetti',
    'Parisi', 'Villa', 'Conte', 'Ferraro', 'Sartori', 'Monti', 'Valentini', 'Piras', 'Fabbri', 'Testa',
    'Grasso', 'Amato', 'Pellegrini', 'Palumbo', 'Sala', 'Farina', 'Vitali', 'Milani', 'Orlando', 'Basile'],
};

const french: NamePool = {
  first: ['Louis', 'Hugo', 'Gabriel', 'Arthur', 'Thomas', 'Antoine', 'Nicolas', 'Julien', 'Maxime', 'Alexandre',
    'Théo', 'Léo', 'Pierre', 'Baptiste', 'Quentin', 'Mathieu', 'Clément', 'Romain', 'Vincent', 'Florian',
    'Benoît', 'Guillaume', 'Adrien', 'Yohann', 'Kylian', 'Enzo', 'Rayan', 'Noé', 'Ethan', 'Valentin',
    'Corentin', 'Mathis', 'Axel', 'Bastien', 'Alexis', 'Rémi', 'Sacha', 'Timothée', 'Gaspard', 'Côme',
    'Yanis', 'Bilal', 'Samir', 'Malo', 'Erwan', 'Nolan', 'Aurélien', 'Loïc', 'Anaël', 'Killian',
    'Cyprien', 'Marius', 'Titouan', 'Ilyes', 'Tanguy', 'Émile', 'Maël', 'Ismaël', 'Younes', 'Jules'],
  last: ['Martin', 'Bernard', 'Dubois', 'Thomas', 'Robert', 'Petit', 'Durand', 'Leroy', 'Moreau', 'Simon',
    'Laurent', 'Lefebvre', 'Michel', 'Garnier', 'Rousseau', 'Vincent', 'Fournier', 'Girard', 'Bonnet', 'Dupont',
    'Lambert', 'Fontaine', 'Rousset', 'Blanc', 'Guerin', 'Muller', 'Henry', 'Roussel', 'Nicolas', 'Perrin',
    'Morel', 'Meunier', 'Blanchard', 'Gauthier', 'Chevalier', 'Francois', 'Legrand', 'Faure', 'Andre', 'Mercier',
    'Boyer', 'Dumont', 'Marchand', 'Duval', 'Denis', 'Dumas', 'Marie', 'Lemaire', 'Renard', 'Barbier',
    'Brunet', 'Caron', 'Aubert', 'Guyot', 'Charrier', 'Perret', 'Fabre', 'Gaillard', 'Pierre', 'Renault'],
};

const german: NamePool = {
  first: ['Lukas', 'Maximilian', 'Felix', 'Jonas', 'Tim', 'Julian', 'Niklas', 'Fabian', 'Moritz', 'Leon',
    'Paul', 'Sebastian', 'Jan', 'Tobias', 'Simon', 'Florian', 'Philipp', 'Daniel', 'Christian', 'Alexander',
    'Benedikt', 'Dominik', 'Matthias', 'Stefan', 'Andreas', 'Markus', 'Kevin', 'Marcel', 'Patrick', 'Robin',
    'Jannik', 'Elias', 'Noah', 'Finn', 'Luca', 'David', 'Erik', 'Benjamin', 'Nico', 'Anton',
    'Konstantin', 'Henrik', 'Johannes', 'Georg', 'Karl', 'Lorenz', 'Vincent', 'Marius', 'Hendrik', 'Kilian',
    'Rico', 'Marlon', 'Timo', 'Bastian', 'Frank', 'Werner', 'Rainer', 'Helmut', 'Gunther', 'Wolfgang'],
  last: ['Müller', 'Schmidt', 'Schneider', 'Fischer', 'Weber', 'Meyer', 'Wagner', 'Becker', 'Hoffmann', 'Schulz',
    'Koch', 'Richter', 'Klein', 'Wolf', 'Neumann', 'Schwarz', 'Zimmermann', 'Braun', 'Krüger', 'Hofmann',
    'Werner', 'Schmitt', 'Lange', 'Schäfer', 'Krause', 'Meier', 'Lehmann', 'Huber', 'Mayer', 'Herrmann',
    'König', 'Walter', 'Peters', 'Vogel', 'Jäger', 'Frank', 'Winkler', 'Berger', 'Kraus', 'Pohl',
    'Sommer', 'Baumann', 'Franke', 'Albrecht', 'Winter', 'Ludwig', 'Kuhn', 'Arnold', 'Busch', 'Voigt',
    'Seidel', 'Horn', 'Kaiser', 'Fuchs', 'Stein', 'Lorenz', 'Graf', 'Beck', 'Geiger', 'Brandt'],
};

const dutch: NamePool = {
  first: ['Daan', 'Sem', 'Lars', 'Jesse', 'Thijs', 'Bram', 'Thomas', 'Ruben', 'Luuk', 'Wouter',
    'Koen', 'Niels', 'Joost', 'Stijn', 'Tim', 'Milan', 'Sander', 'Bas', 'Dirk', 'Willem',
    'Pieter', 'Gijs', 'Rick', 'Tom', 'Boaz', 'Jesper', 'Max', 'Sven', 'Job', 'Luca',
    'Jort', 'Teun', 'Cas', 'Floris', 'Wessel', 'Ties', 'Guus', 'Mees', 'Twan', 'Siem',
    'Julian', 'Fedde', 'Daniël', 'Wout', 'Robbert', 'Casper', 'Ivo', 'Arne', 'Niek', 'Willem-Jan',
    'Bart', 'Kevin', 'Erwin', 'Rutger', 'Vince', 'Roel', 'Hidde', 'Timo', 'Jarno', 'Stef'],
  last: ['de Jong', 'Jansen', 'Bakker', 'Visser', 'Smit', 'Meijer', 'de Boer', 'Mulder', 'Dekker', 'Brouwer',
    'de Groot', 'Bos', 'Vos', 'Peters', 'Hendriks', 'van Dijk', 'Vermeulen', 'van der Berg', 'Kuipers', 'de Wit',
    'Willems', 'Dijkstra', 'Smits', 'de Ruiter', 'Post', 'Kok', 'Vink', 'Schouten', 'van Leeuwen', 'Hermans',
    'van der Meer', 'van der Linden', 'Peeters', 'Maas', 'Verhoeven', 'Kramer', 'Verbeek', 'Blom', 'van Vliet', 'Timmermans',
    'de Haan', 'van der Velde', 'Huisman', 'de Vos', 'Prins', 'Vermeer', 'de Bruijn', 'Verhoef', 'Wolters', 'Sanders',
    'van den Berg', 'van Dam', 'Terpstra', 'Scholten', 'Kuiper', 'van Beek', 'Koster', 'Rietveld', 'Hoekstra', 'Bosman'],
};

const nordic: NamePool = {
  first: ['Erik', 'Anders', 'Lars', 'Henrik', 'Magnus', 'Oskar', 'Emil', 'Viktor', 'Aksel', 'Mikael',
    'Niklas', 'Sven', 'Anton', 'Elias', 'Jesper', 'Gustav', 'Fredrik', 'Johan', 'Karl', 'Oscar',
    'Aleksi', 'Juho', 'Ville', 'Onni', 'Jonas', 'Bjørn', 'Ole', 'Sigurd', 'Espen', 'Kalle',
    'Axel', 'Casper', 'Frederik', 'Mads', 'Rasmus', 'Thor', 'Kasper', 'Malte', 'Kristian', 'Simon',
    'Aapo', 'Elmeri', 'Eino', 'Otto', 'Väinö', 'Niilo', 'Olavi', 'Matias', 'Teemu', 'Joonas',
    'Halvor', 'Trygve', 'Sindre', 'Vegard', 'Tobias', 'Are', 'Torgeir', 'Knut', 'Leif', 'Arvid'],
  last: ['Andersson', 'Johansson', 'Karlsson', 'Nilsson', 'Eriksson', 'Larsen', 'Hansen', 'Nielsen', 'Virtanen', 'Korhonen',
    'Mäkinen', 'Berg', 'Lindqvist', 'Holm', 'Dahl', 'Pedersen', 'Olsen', 'Sørensen', 'Lindberg', 'Sundberg',
    'Nygaard', 'Haugen', 'Iversen', 'Kallio', 'Laine', 'Heikkinen', 'Salminen', 'Lund', 'Bergström', 'Jokinen',
    'Persson', 'Gustafsson', 'Svensson', 'Jönsson', 'Lindström', 'Nyström', 'Ström', 'Åkesson', 'Forsberg', 'Wikström',
    'Aho', 'Lehtonen', 'Kinnunen', 'Turunen', 'Räsänen', 'Koskinen', 'Nieminen', 'Mattila', 'Hakkarainen', 'Hämäläinen',
    'Johnsen', 'Kristiansen', 'Aas', 'Berge', 'Dahle', 'Sæther', 'Moen', 'Bakken', 'Amundsen', 'Solberg'],
};

const balkan: NamePool = {
  first: ['Nikola', 'Stefan', 'Marko', 'Luka', 'Filip', 'Ivan', 'Milan', 'Aleksandar', 'Petar', 'Dušan',
    'Vuk', 'Andrej', 'Goran', 'Dario', 'Ante', 'Bojan', 'Miloš', 'Dejan', 'Vladimir', 'Zoran',
    'Igor', 'Marin', 'Tin', 'Josip', 'Domagoj', 'Slaven', 'Vlado', 'Denis', 'Damir', 'Kristijan',
    'Ognjen', 'Uroš', 'Bogdan', 'Đorđe', 'Nemanja', 'Branko', 'Radovan', 'Boris', 'Mario', 'Ivo',
    'Tihomir', 'Krešimir', 'Hrvoje', 'Matej', 'Ivica', 'Predrag', 'Nenad', 'Saša', 'Ljubomir', 'Vojin',
    'Emir', 'Adnan', 'Amar', 'Haris', 'Kenan', 'Armin', 'Edin', 'Damjan', 'Blaž', 'Rok'],
  last: ['Petrović', 'Jovanović', 'Marković', 'Nikolić', 'Popović', 'Stojanović', 'Kovačević', 'Horvat', 'Novak', 'Babić',
    'Radić', 'Vuković', 'Đorđević', 'Pavlović', 'Kolar', 'Ilić', 'Simić', 'Knežević', 'Kovač', 'Matić',
    'Perić', 'Kralj', 'Blažević', 'Lukić', 'Tomić', 'Dimitrijević', 'Šarić', 'Rakić', 'Vidović', 'Kos',
    'Todorović', 'Đukić', 'Cvetković', 'Stanković', 'Ranković', 'Jeremić', 'Vasić', 'Antić', 'Filipović', 'Bogdanović',
    'Grubić', 'Barišić', 'Katić', 'Mikulić', 'Bilić', 'Jurić', 'Tadić', 'Vujović', 'Mijatović', 'Savić',
    'Hodžić', 'Selimović', 'Mujić', 'Halilović', 'Begić', 'Delić', 'Zorić', 'Čović', 'Kuzmanović', 'Đurić'],
};

const westSlavic: NamePool = {
  first: ['Jakub', 'Filip', 'Michał', 'Piotr', 'Wojciech', 'Tomáš', 'Jan', 'Martin', 'Petr', 'Adam',
    'Kacper', 'Mateusz', 'Dominik', 'Marek', 'Krzysztof', 'Paweł', 'Łukasz', 'Bartosz', 'Rafał', 'Ondřej',
    'Václav', 'Šimon', 'Lukáš', 'David', 'Kamil', 'Igor', 'Jindřich', 'Radek', 'Přemysl', 'Grzegorz',
    'Sebastian', 'Damian', 'Patryk', 'Konrad', 'Norbert', 'Tymon', 'Ignacy', 'Antoni', 'Alan', 'Miloš',
    'Vojtěch', 'Matěj', 'Jáchym', 'Vít', 'Zdeněk', 'Karel', 'Vladimír', 'Marián', 'Ján', 'Patrik',
    'Erik', 'Tibor', 'Dušan', 'Peter', 'Ľuboš', 'Jaroslav', 'Stanislav', 'Bohumil', 'Bronislav', 'Kazimierz'],
  last: ['Nowak', 'Kowalski', 'Wiśniewski', 'Wójcik', 'Dvořák', 'Novák', 'Svoboda', 'Procházka', 'Horák', 'Kučera',
    'Kowalczyk', 'Kamiński', 'Zieliński', 'Král', 'Marek', 'Wójtowicz', 'Lewandowski', 'Szymański', 'Woźniak', 'Dąbrowski',
    'Beneš', 'Pokorný', 'Sedláček', 'Veselý', 'Krejčí', 'Hájek', 'Urban', 'Kolář', 'Bartoš', 'Vaněk',
    'Mazur', 'Jankowski', 'Wieczorek', 'Kalinowski', 'Sikora', 'Baran', 'Rutkowski', 'Michalski', 'Szewczyk', 'Wysocki',
    'Dušek', 'Blažek', 'Fiala', 'Kovář', 'Pospíšil', 'Vondráček', 'Zeman', 'Holub', 'Musil', 'Zahradník',
    'Varga', 'Horváth', 'Kováč', 'Baláž', 'Poláček', 'Švec', 'Šimko', 'Hudák', 'Kolesár', 'Bartík'],
};

const eastSlavic: NamePool = {
  first: ['Dmitri', 'Andrei', 'Ivan', 'Mikhail', 'Sergei', 'Alexei', 'Nikolai', 'Pavel', 'Viktor', 'Roman',
    'Vladimir', 'Yuri', 'Oleg', 'Igor', 'Artem', 'Denis', 'Maxim', 'Anton', 'Konstantin', 'Vadim',
    'Stanislav', 'Yevgeny', 'Ruslan', 'Bogdan', 'Taras', 'Oleksandr', 'Volodymyr', 'Ihor', 'Vitaliy', 'Sergiy',
    'Danylo', 'Yaroslav', 'Anatoliy', 'Leonid', 'Boris', 'Grigori', 'Timofey', 'Kirill', 'Arseniy', 'Gleb',
    'Fedir', 'Mykola', 'Petro', 'Mykhailo', 'Vasyl', 'Yevhen', 'Andriy', 'Bohdan', 'Nazar', 'Orest',
    'Gennadi', 'Rodion', 'Zakhar', 'Matvei', 'Savva', 'Yaropolk', 'Vsevolod', 'Rostislav', 'Miroslav', 'Svyatoslav'],
  last: ['Ivanov', 'Petrov', 'Sidorov', 'Volkov', 'Sokolov', 'Kuznetsov', 'Morozov', 'Popov', 'Vasiliev', 'Fedorov',
    'Smirnov', 'Novikov', 'Koval', 'Bondarenko', 'Melnyk', 'Shevchenko', 'Kovalenko', 'Kravchenko', 'Tkachenko', 'Boyko',
    'Lysenko', 'Marchenko', 'Rudenko', 'Savchenko', 'Pavlenko', 'Zaitsev', 'Orlov', 'Gusev', 'Belov', 'Egorov',
    'Makarov', 'Nikitin', 'Frolov', 'Zhukov', 'Sorokin', 'Panov', 'Semenov', 'Gavrilov', 'Kozlov', 'Stepanov',
    'Oliynyk', 'Kravets', 'Poliakov', 'Moroz', 'Tkachuk', 'Litvin', 'Klymenko', 'Hrytsenko', 'Yaremenko', 'Shcherbak',
    'Dorenko', 'Vasylenko', 'Danylenko', 'Zinchenko', 'Kolomiets', 'Chumak', 'Bilyk', 'Sydorenko', 'Kravchuk', 'Lytvynenko'],
};

const baltic: NamePool = {
  first: ['Karolis', 'Tomas', 'Mantas', 'Rokas', 'Andrius', 'Kristaps', 'Jānis', 'Mārtiņš', 'Rainer', 'Marek',
    'Kaspar', 'Gustav', 'Erik', 'Toivo', 'Andres', 'Aivars', 'Edgars', 'Gatis', 'Raivis', 'Normunds',
    'Vytautas', 'Darius', 'Gediminas', 'Arūnas', 'Marius', 'Priit', 'Margus', 'Tanel', 'Rein', 'Urmas',
    'Dovydas', 'Paulius', 'Lukas', 'Justinas', 'Deividas', 'Gvidas', 'Modestas', 'Domantas', 'Nerijus', 'Egidijus',
    'Uldis', 'Valdis', 'Māris', 'Reinis', 'Artūrs', 'Rihards', 'Toms', 'Elvijs', 'Dāvis', 'Krišjānis',
    'Sten', 'Karl', 'Meelis', 'Indrek', 'Ants', 'Peeter', 'Jaanus', 'Taavi', 'Siim', 'Hando'],
  last: ['Jankauskas', 'Kazlauskas', 'Petrauskas', 'Vasiliauskas', 'Bērziņš', 'Kalniņš', 'Ozoliņš', 'Tamm', 'Saar', 'Kask',
    'Sepp', 'Rebane', 'Laine', 'Mets', 'Kukk', 'Vīksne', 'Krastiņš', 'Zariņš', 'Balčiūnas', 'Stankevičius',
    'Butkus', 'Urbonas', 'Paulauskas', 'Riibe', 'Kallas', 'Mägi', 'Kelder', 'Pärn', 'Talvik', 'Kivi',
    'Žukauskas', 'Baranauskas', 'Sakalauskas', 'Simonaitis', 'Grigaitis', 'Radzevičius', 'Stankūnas', 'Ambrazas', 'Norkus', 'Gedvilas',
    'Liepiņš', 'Krūmiņš', 'Freimanis', 'Vītols', 'Podnieks', 'Circenis', 'Auziņš', 'Puriņš', 'Lūsis', 'Grāvītis',
    'Tammik', 'Kuusk', 'Lepik', 'Raudsepp', 'Org', 'Pärnamets', 'Roosaar', 'Vaher', 'Koppel', 'Aasmäe'],
};

const greek: NamePool = {
  first: ['Stefanos', 'Nikos', 'Giorgos', 'Kostas', 'Dimitris', 'Yannis', 'Alexandros', 'Vasilis', 'Panagiotis', 'Christos',
    'Michalis', 'Aris', 'Petros', 'Andreas', 'Marios', 'Thanos', 'Spyros', 'Theodoros', 'Apostolos', 'Leonidas',
    'Ioannis', 'Konstantinos', 'Pavlos', 'Efstathios', 'Charalambos', 'Grigoris', 'Emmanouil', 'Nikolaos', 'Achilleas', 'Orestis',
    'Panos', 'Christoforos', 'Angelos', 'Theofilos', 'Zisis', 'Iason', 'Neofytos', 'Kyriakos', 'Loukas', 'Tasos',
    'Stavros', 'Dinos', 'Fotis', 'Vangelis', 'Harris', 'Ilias', 'Sotiris', 'Timos', 'Xenofon', 'Odysseas',
    'Antonis', 'Manolis', 'Prokopis', 'Savvas', 'Thodoris', 'Alekos', 'Thymios', 'Dimos', 'Babis', 'Yorgos'],
  last: ['Papadopoulos', 'Papadakis', 'Nikolaidis', 'Georgiou', 'Vasileiou', 'Antoniou', 'Christodoulou', 'Konstantinou', 'Ioannou', 'Dimitriou',
    'Michaelides', 'Stavrou', 'Petrides', 'Pavlou', 'Loizou', 'Papastavrou', 'Karagiannis', 'Economou', 'Angelopoulos', 'Makris',
    'Pappas', 'Fotiadis', 'Triantafyllou', 'Kyriakou', 'Stefanidis', 'Zervas', 'Moschos', 'Sideris', 'Katsaros', 'Liakos',
    'Vlachos', 'Lambros', 'Kostopoulos', 'Anastasiou', 'Theodorou', 'Alexiou', 'Karydis', 'Politis', 'Roussos', 'Skoufis',
    'Panagiotou', 'Georgiadis', 'Xanthopoulos', 'Manolis', 'Charalambous', 'Koutsoukos', 'Vassiliou', 'Papathanasiou', 'Sakellariou', 'Voulgaris',
    'Andreou', 'Pantazis', 'Argyriou', 'Danielidis', 'Kalogeropoulos', 'Papanikolaou', 'Kalantzis', 'Iliopoulos', 'Chatzis', 'Drakos'],
};

const turkish: NamePool = {
  first: ['Emre', 'Mert', 'Berk', 'Can', 'Yusuf', 'Ahmet', 'Mehmet', 'Burak', 'Onur', 'Kaan',
    'Serkan', 'Umut', 'Cem', 'Baran', 'Tolga', 'Emirhan', 'Furkan', 'Enes', 'Ege', 'Kerem',
    'Hakan', 'Barış', 'Alp', 'Deniz', 'Ozan', 'Batuhan', 'Yiğit', 'Mustafa', 'Caner', 'Sinan',
    'Efe', 'Arda', 'Berkay', 'Doğukan', 'Yiğitcan', 'Görkem', 'Kağan', 'Metehan', 'Oğuzhan', 'Selim',
    'Taner', 'Uğur', 'Volkan', 'Yavuz', 'Bora', 'Cengiz', 'Erhan', 'Fatih', 'Gökhan', 'Halil',
    'İbrahim', 'Kadir', 'Levent', 'Murat', 'Necati', 'Orhan', 'Recep', 'Süleyman', 'Tarık', 'Ziya'],
  last: ['Yılmaz', 'Kaya', 'Demir', 'Şahin', 'Çelik', 'Yıldız', 'Aydın', 'Arslan', 'Doğan', 'Kılıç',
    'Aslan', 'Çetin', 'Koç', 'Kurt', 'Özdemir', 'Şimşek', 'Polat', 'Korkmaz', 'Özkan', 'Bulut',
    'Yalçın', 'Aksoy', 'Avcı', 'Erdoğan', 'Türk', 'Güneş', 'Aktaş', 'Akın', 'Keskin', 'Uçar',
    'Karadağ', 'Sarı', 'Çakır', 'Tekin', 'Özkaya', 'Bozkurt', 'Tunç', 'Erkan', 'Güler', 'Bilgin',
    'Doğru', 'Ergün', 'Kaplan', 'Aydemir', 'Yavuz', 'Özer', 'Aydoğan', 'Turan', 'Karaca', 'Sezer',
    'Uslu', 'Tosun', 'Baran', 'Çınar', 'Gündoğdu', 'Koçak', 'Öztürk', 'Çiftçi', 'Yücel', 'Sönmez'],
};

const hungarian: NamePool = {
  first: ['Bence', 'Ádám', 'Balázs', 'Gergő', 'Zoltán', 'László', 'Péter', 'Tamás', 'Levente', 'Máté',
    'Dániel', 'Krisztián', 'Attila', 'Gábor', 'Márton', 'Csaba', 'Norbert', 'Ákos', 'Zsolt', 'Áron',
    'Szabolcs', 'Ferenc', 'Roland', 'Milán', 'Botond', 'Kristóf', 'Barnabás', 'Erik', 'Vince', 'Bálint',
    'Domonkos', 'Szilárd', 'Gyula', 'Endre', 'Imre', 'Tibor', 'Sándor', 'Győző', 'Hunor', 'Zalán',
    'Benedek', 'Miklós', 'Károly', 'Bertalan', 'Dezső', 'Előd', 'Ernő', 'Géza', 'Jenő', 'Kálmán',
    'Kornél', 'Marcell', 'Nándor', 'Ottó', 'Rezső', 'Vilmos', 'Zsombor', 'Ábel', 'Csongor', 'Dénes'],
  last: ['Nagy', 'Kovács', 'Tóth', 'Szabó', 'Horváth', 'Varga', 'Kiss', 'Molnár', 'Németh', 'Farkas',
    'Balogh', 'Papp', 'Takács', 'Juhász', 'Lakatos', 'Mészáros', 'Oláh', 'Simon', 'Rácz', 'Fekete',
    'Szűcs', 'Balázs', 'Fehér', 'Gál', 'Sipos', 'Kis', 'Vörös', 'Kelemen', 'Magyar', 'Csonka',
    'Antal', 'Barta', 'Császár', 'Dudás', 'Fazekas', 'Gulyás', 'Halász', 'Illés', 'Jakab', 'Kocsis',
    'Lengyel', 'Major', 'Nemes', 'Orsós', 'Pásztor', 'Rimóczi', 'Sárközi', 'Tamás', 'Ürmös', 'Varjú',
    'Zsigmond', 'Bakos', 'Csizmadia', 'Deák', 'Erdős', 'Gombás', 'Hegedűs', 'Iványi', 'Katona', 'Lukács'],
};

const romanian: NamePool = {
  first: ['Andrei', 'Mihai', 'Alexandru', 'Radu', 'Cristian', 'Florin', 'Daniel', 'Ionuț', 'Vlad', 'Gabriel',
    'Adrian', 'Sorin', 'Cătălin', 'Marius', 'Ștefan', 'Bogdan', 'Cosmin', 'Emil', 'Valentin', 'Tudor',
    'Dan', 'Marian', 'Constantin', 'Nicolae', 'George', 'Paul', 'Iulian', 'Victor', 'Laurențiu', 'Codrin',
    'Ionel', 'Petru', 'Gheorghe', 'Silviu', 'Vasile', 'Cezar', 'Eduard', 'Mircea', 'Octavian', 'Răzvan',
    'Alin', 'Claudiu', 'Doru', 'Fănel', 'Horia', 'Liviu', 'Nelu', 'Ovidiu', 'Sergiu', 'Teodor',
    'Vasilică', 'Cristi', 'Dorin', 'Iosif', 'Lucian', 'Mihail', 'Petrică', 'Remus', 'Traian', 'Virgil'],
  last: ['Popescu', 'Ionescu', 'Popa', 'Dumitru', 'Stan', 'Stoica', 'Gheorghe', 'Constantin', 'Matei', 'Ilie',
    'Tudor', 'Marin', 'Toma', 'Dinu', 'Radu', 'Rusu', 'Munteanu', 'Neagu', 'Barbu', 'Diaconu',
    'Nistor', 'Preda', 'Lungu', 'Coman', 'Manea', 'Petrescu', 'Anghel', 'Florea', 'Voicu', 'Tănase',
    'Ciobanu', 'Cristea', 'Enache', 'Iordache', 'Manolache', 'Nedelcu', 'Oprea', 'Pavel', 'Robu', 'Sandu',
    'Trandafir', 'Ungureanu', 'Vasilescu', 'Zamfir', 'Bălan', 'Chiriac', 'Dascălu', 'Grigore', 'Hriscu', 'Iancu',
    'Lazăr', 'Moldovan', 'Negoiță', 'Oancea', 'Pîrvu', 'Rotaru', 'Sima', 'Ștefănescu', 'Tudose', 'Vlad'],
};

const japanese: NamePool = {
  first: ['Kenji', 'Hiroshi', 'Takeshi', 'Yuto', 'Sora', 'Haruto', 'Ren', 'Sota', 'Daiki', 'Yuki',
    'Kaito', 'Riku', 'Sho', 'Naoki', 'Tatsuya', 'Kazuki', 'Ryo', 'Hayato', 'Ryota', 'Kosuke',
    'Yamato', 'Shun', 'Kenta', 'Aoi', 'Itsuki', 'Mizuki', 'Rento', 'Kai', 'Tsubasa', 'Ken',
    'Akira', 'Daisuke', 'Hikaru', 'Isamu', 'Jin', 'Keita', 'Makoto', 'Noboru', 'Osamu', 'Rikuto',
    'Shinji', 'Takumi', 'Toshiro', 'Wataru', 'Yasushi', 'Yoshiki', 'Yudai', 'Yusei', 'Zen', 'Ryusei',
    'Hiroto', 'Kento', 'Masaki', 'Shota', 'Taiga', 'Tenma', 'Kohei', 'Souta', 'Minato', 'Asahi'],
  last: ['Sato', 'Suzuki', 'Takahashi', 'Tanaka', 'Watanabe', 'Ito', 'Yamamoto', 'Nakamura', 'Kobayashi', 'Saito',
    'Kato', 'Yoshida', 'Yamada', 'Sasaki', 'Matsumoto', 'Inoue', 'Kimura', 'Hayashi', 'Shimizu', 'Yamazaki',
    'Ikeda', 'Hashimoto', 'Abe', 'Ishikawa', 'Mori', 'Ogawa', 'Fujita', 'Okada', 'Goto', 'Hasegawa',
    'Murakami', 'Kondo', 'Ishii', 'Kubo', 'Sakamoto', 'Endo', 'Aoki', 'Fujii', 'Nishimura', 'Fukuda',
    'Ota', 'Miura', 'Fujiwara', 'Okamoto', 'Matsuda', 'Nakagawa', 'Nakajima', 'Ono', 'Maeda', 'Fujimoto',
    'Sugiyama', 'Kaneko', 'Uchida', 'Ueda', 'Morita', 'Hara', 'Shibata', 'Sakai', 'Yamashita', 'Yokoyama'],
};

const korean: NamePool = {
  first: ['Min-jun', 'Ji-ho', 'Seo-jun', 'Do-yun', 'Joon-ho', 'Hyun-woo', 'Tae-yang', 'Jun-seo', 'Woo-jin', 'Sung-min',
    'Jae-won', 'Dong-hyun', 'Kyung-soo', 'Yong-jin', 'Chan-ho', 'Seung-hyun', 'Min-ho', 'Jong-suk', 'Kang-in', 'Hyun-jun',
    'Tae-min', 'Yoon-seok', 'Ji-hoon', 'Sang-woo', 'Byung-chul', 'Won-jae', 'Se-jin', 'Hyeon-woo', 'In-su', 'Dae-ho',
    'Yeong-su', 'Chang-min', 'Hae-sung', 'Il-woo', 'Jae-hyun', 'Ki-tae', 'Nam-gil', 'Pil-sung', 'Sang-hyun', 'Tae-hoon',
    'Bum-jin', 'Chul-soo', 'Do-hyun', 'Eun-woo', 'Geon-woo', 'Ho-jin', 'Jin-woo', 'Kyu-won', 'Myung-ho', 'Sung-jae',
    'Wook-jin', 'Yong-hoon', 'Beom-seok', 'Choong-ho', 'Deok-soo', 'Gwang-il', 'Hak-soo', 'Jong-hyun', 'Kwan-woo', 'Young-jae'],
  last: ['Kim', 'Lee', 'Park', 'Choi', 'Jung', 'Kang', 'Cho', 'Yoon', 'Jang', 'Lim',
    'Han', 'Oh', 'Seo', 'Shin', 'Kwon', 'Hwang', 'Ahn', 'Song', 'Yoo', 'Hong',
    'Moon', 'Yang', 'Bae', 'Baek', 'Nam', 'Noh', 'Gwon', 'Ha', 'Ryu', 'Jin',
    'Ko', 'Gu', 'Min', 'Pyo', 'Chun', 'Gong', 'Do', 'Eom', 'Gye', 'Ji',
    'Joo', 'Ma', 'Na', 'On', 'Pi', 'Sim', 'Uhm', 'Woo', 'Yu', 'Cha',
    'Chi', 'Gwak', 'Ok', 'Pyun', 'Seok', 'Sun', 'Tak', 'Wi', 'Yeom', 'Yeon'],
};

const chinese: NamePool = {
  first: ['Wei', 'Jun', 'Hao', 'Lei', 'Ming', 'Chen', 'Tao', 'Bo', 'Yong', 'Kai',
    'Jian', 'Feng', 'Qiang', 'Peng', 'Zhi', 'Yang', 'Fei', 'Long', 'Zhen', 'Cheng',
    'Ping', 'Hui', 'Jie', 'Yu', 'Bin', 'Xin', 'Rui', 'Shun', 'Wen', 'Han',
    'Zhao', 'Xiang', 'Jia', 'Dong', 'Guang', 'Hua', 'Kang', 'Liang', 'Mao', 'Ning',
    'Qi', 'Song', 'Tian', 'Wu', 'Xu', 'Yan', 'Zheng', 'Zi', 'An', 'Chao',
    'De', 'Fan', 'Gang', 'Heng', 'Jin', 'Lin', 'Nian', 'Pu', 'Shen', 'Yi'],
  last: ['Wang', 'Li', 'Zhang', 'Liu', 'Chen', 'Yang', 'Huang', 'Zhao', 'Wu', 'Zhou',
    'Xu', 'Sun', 'Ma', 'Zhu', 'Hu', 'Guo', 'He', 'Gao', 'Lin', 'Luo',
    'Zheng', 'Liang', 'Xie', 'Song', 'Tang', 'Han', 'Cao', 'Deng', 'Feng', 'Yu',
    'Shen', 'Cai', 'Peng', 'Lu', 'Jiang', 'Kong', 'Bai', 'Cui', 'Yuan', 'Qin',
    'Fu', 'Fang', 'Jin', 'Meng', 'Pan', 'Qian', 'Ren', 'Shi', 'Tan', 'Wei',
    'Xia', 'Yan', 'Ye', 'Yin', 'Zhan', 'Zou', 'Ni', 'Du', 'Dai', 'Gu'],
};

const southeastAsian: NamePool = {
  first: ['Somchai', 'Arthit', 'Krit', 'Nattapong', 'Chai', 'Jose', 'Mark', 'Paolo', 'Carlo', 'Miguel',
    'Budi', 'Agus', 'Made', 'Wayan', 'Andi', 'Anucha', 'Sirawit', 'Panupong', 'Jomtien', 'Ekachai',
    'Ronnie', 'Alvin', 'John', 'Angelo', 'Renz', 'Rizal', 'Bayu', 'Dedi', 'Fajar', 'Hendra',
    'Nguyen', 'Minh', 'Duc', 'Quang', 'Hoang', 'Tuan', 'Long', 'Phong', 'Khanh', 'Bao',
    'Chanthavy', 'Sokha', 'Vichai', 'Boonmee', 'Prasert', 'Somkiat', 'Weerapong', 'Thanakorn', 'Nattawut', 'Peerapat',
    'Jayson', 'Christian', 'Kevin', 'Michael', 'Vincent', 'Gerald', 'Marlon', 'Rommel', 'Jerico', 'Xander'],
  last: ['Srisai', 'Charoen', 'Suwan', 'Thongchai', 'Santos', 'Reyes', 'Cruz', 'Bautista', 'Ramos', 'Wijaya',
    'Santoso', 'Kusuma', 'Saputra', 'Putra', 'Gunawan', 'Pattanakul', 'Kittikorn', 'Jaidee', 'Chaiyaporn', 'Boonmee',
    'Villanueva', 'Aquino', 'Mendoza', 'Torres', 'De Guzman', 'Wibowo', 'Setiawan', 'Nugroho', 'Pratama', 'Hidayat',
    'Nguyen', 'Tran', 'Le', 'Pham', 'Hoang', 'Phan', 'Vu', 'Dang', 'Bui', 'Do',
    'Chandara', 'Sopheak', 'Vannak', 'Dara', 'Sovan', 'Phoumin', 'Keo', 'Sisavath', 'Phommachanh', 'Vongsa',
    'Dela Cruz', 'Garcia', 'Fernandez', 'Gonzales', 'Manalo', 'Tolentino', 'Salvador', 'Custodio', 'Padilla', 'Rivera'],
};

const southAsian: NamePool = {
  first: ['Arjun', 'Rohan', 'Aditya', 'Vikram', 'Rahul', 'Karan', 'Siddharth', 'Aryan', 'Kabir', 'Rishi',
    'Ahmed', 'Usman', 'Bilal', 'Hamza', 'Zain', 'Varun', 'Aman', 'Dev', 'Nikhil', 'Sameer',
    'Farhan', 'Imran', 'Danish', 'Shahid', 'Anand', 'Suresh', 'Ramesh', 'Manoj', 'Ashwin', 'Harsh',
    'Abhinav', 'Chirag', 'Gaurav', 'Ishaan', 'Jayant', 'Kunal', 'Lakshay', 'Naveen', 'Pranav', 'Ravi',
    'Sahil', 'Tarun', 'Utkarsh', 'Vivek', 'Yash', 'Adarsh', 'Bhavesh', 'Deepak', 'Girish', 'Hemant',
    'Junaid', 'Kashif', 'Mubashir', 'Nadeem', 'Omer', 'Qasim', 'Rizwan', 'Salman', 'Talha', 'Waqas'],
  last: ['Sharma', 'Patel', 'Singh', 'Kumar', 'Verma', 'Gupta', 'Reddy', 'Khan', 'Malik', 'Chaudhry',
    'Iqbal', 'Raza', 'Hussain', 'Ali', 'Shaikh', 'Mehta', 'Joshi', 'Nair', 'Rao', 'Chauhan',
    'Yadav', 'Bhatt', 'Kapoor', 'Bajwa', 'Farooq', 'Siddiqui', 'Qureshi', 'Butt', 'Naidu', 'Menon',
    'Agarwal', 'Desai', 'Iyer', 'Jain', 'Kulkarni', 'Mishra', 'Pandey', 'Rastogi', 'Saxena', 'Trivedi',
    'Akhtar', 'Baig', 'Chishti', 'Dar', 'Gill', 'Javed', 'Khokhar', 'Mahmood', 'Niazi', 'Pasha',
    'Rehman', 'Sheikh', 'Tariq', 'Ansari', 'Bukhari', 'Chowdhury', 'Haq', 'Latif', 'Mirza', 'Zaidi'],
};

const arabic: NamePool = {
  first: ['Karim', 'Omar', 'Youssef', 'Hamza', 'Amine', 'Rachid', 'Khaled', 'Tarek', 'Samir', 'Nabil',
    'Adnan', 'Bassam', 'Rami', 'Hassan', 'Ziad', 'Walid', 'Ayman', 'Mourad', 'Anas', 'Ismail',
    'Fadi', 'Marwan', 'Sami', 'Zakaria', 'Hicham', 'Ayoub', 'Mehdi', 'Reda', 'Sofiane', 'Kamal',
    'Abdullah', 'Faisal', 'Jamal', 'Malik', 'Nasser', 'Qusay', 'Rashid', 'Saad', 'Tamer', 'Wael',
    'Bilal', 'Firas', 'Ghassan', 'Hadi', 'Imad', 'Jawad', 'Louay', 'Murad', 'Nael', 'Osama',
    'Qasim', 'Riad', 'Sabri', 'Talal', 'Usama', 'Wissam', 'Yasser', 'Zaki', 'Ahmad', 'Bashir'],
  last: ['El Amrani', 'Haddad', 'Khalil', 'Mansour', 'Saad', 'Nasser', 'Fares', 'Chahine', 'Barakat', 'Aziz',
    'Al-Sayed', 'Benali', 'Idrissi', 'Zidan', 'Younes', 'Cherkaoui', 'Bensalem', 'El Fassi', 'Alaoui', 'Bouzid',
    'Rahal', 'Karimi', 'Nassar', 'Hamdi', 'Chraibi', 'Belkacem', 'Ouazzani', 'Fahmy', 'Salim', 'Kassab',
    'Abboud', 'Chamoun', 'Daher', 'Fadel', 'Ghanem', 'Haidar', 'Jabbour', 'Khoury', 'Maalouf', 'Nader',
    'Qabbani', 'Rida', 'Saleh', 'Tannous', 'Wehbe', 'Yamani', 'Zeitoun', 'Al-Amin', 'Al-Rashid', 'Al-Masri',
    'Bakr', 'Darwish', 'Farouk', 'Jibril', 'Karam', 'Makki', 'Odeh', 'Rifai', 'Sabbagh', 'Tabbara'],
};

const hebrew: NamePool = {
  first: ['Amit', 'Yonatan', 'Tomer', 'Daniel', 'Itai', 'Noam', 'Eitan', 'Roee', 'Guy', 'Ariel',
    'Omer', 'Ido', 'Nadav', 'Uri', 'Liam', 'Yair', 'Matan', 'Asaf', 'Ron', 'Adam',
    'Yaniv', 'Shahar', 'Elad', 'Gilad', 'Amir', 'Doron', 'Oren', 'Tal', 'Yuval', 'Ilan',
    'Avi', 'Boaz', 'Chaim', 'Dor', 'Eyal', 'Gal', 'Hillel', 'Ilai', 'Jonathan', 'Kfir',
    'Lior', 'Meir', 'Netanel', 'Ofir', 'Pini', 'Raanan', 'Shlomo', 'Tzuriel', 'Uziel', 'Ziv',
    'Aviv', 'Barak', 'Dolev', 'Ephraim', 'Gefen', 'Hod', 'Idan', 'Kobi', 'Micha', 'Nir'],
  last: ['Cohen', 'Levi', 'Mizrahi', 'Peretz', 'Biton', 'Azoulay', 'Katz', 'Friedman', 'Shapiro', 'Avraham',
    'Dahan', 'Malka', 'Amar', 'Gabay', 'Bar', 'Sasson', 'Ben David', 'Barak', 'Golan', 'Hazan',
    'Toledano', 'Elbaz', 'Shalev', 'Nahum', 'Yosef', 'Sharon', 'Mor', 'Ezra', 'Aharon', 'Ohana',
    'Vaknin', 'Yadid', 'Zohar', 'Harel', 'Kaplan', 'Lavi', 'Meiri', 'Naor', 'Ophir', 'Peled',
    'Rosen', 'Segal', 'Tzur', 'Uzan', 'Weiss', 'Yerushalmi', 'Zamir', 'Ben Simon', 'Cohen-Tal', 'Dagan',
    'Elad', 'Fink', 'Gilboa', 'Hadad', 'Ilan', 'Kadosh', 'Levy', 'Mizrachi', 'Navon', 'Or'],
};

const caucasus: NamePool = {
  first: ['Giorgi', 'Nika', 'Luka', 'Davit', 'Levan', 'Saba', 'Otar', 'Tornike', 'Beka', 'Irakli',
    'Zaza', 'Vakhtang', 'Guram', 'Kakha', 'Shota', 'Data', 'Mamuka', 'Gia', 'Archil', 'Zurab',
    'Lasha', 'Temuri', 'Rezo', 'Merab', 'Koba', 'Vano', 'Giga', 'Avto', 'Sandro', 'Bacho',
    'Vazha', 'Bidzina', 'Malkhaz', 'Nodar', 'Revaz', 'Tariel', 'Vaja', 'Zviad', 'Aleksandre', 'Besik',
    'Gaga', 'Ilia', 'Kote', 'Mikheil', 'Paata', 'Rati', 'Soso', 'Teimuraz', 'Vasil', 'Zakaria'],
  last: ['Beridze', 'Kapanadze', 'Lomidze', 'Gelashvili', 'Meladze', 'Tsiklauri', 'Kiknadze', 'Chikvaidze', 'Japaridze', 'Kavtaradze',
    'Machaidze', 'Tsereteli', 'Abashidze', 'Kobakhidze', 'Gogia', 'Kldiashvili', 'Nadiradze', 'Tsintsadze', 'Sharashenidze', 'Managadze',
    'Kekelidze', 'Gagnidze', 'Khachidze', 'Lortkipanidze', 'Metreveli', 'Dzhaparidze', 'Bakhtadze', 'Tabatadze', 'Chachanidze', 'Odishvili',
    'Khutsishvili', 'Zoidze', 'Mchedlishvili', 'Gvaramia', 'Sharabidze', 'Ninidze', 'Turashvili', 'Basilashvili', 'Kikabidze', 'Vashadze'],
};

const centralAsian: NamePool = {
  first: ['Timur', 'Alisher', 'Dias', 'Nurlan', 'Aidos', 'Bekzat', 'Yerlan', 'Ruslan', 'Daulet', 'Sanjar',
    'Bakhtiyor', 'Farrukh', 'Shokhrukh', 'Javokhir', 'Otabek', 'Nurbek', 'Erlan', 'Askar', 'Nursultan', 'Damir',
    'Temirlan', 'Azamat', 'Islambek', 'Sardor', 'Jasur', 'Murat', 'Sabyr', 'Yergali', 'Bauyrzhan', 'Kanat',
    'Ablay', 'Bekbol', 'Daniyar', 'Erasyl', 'Galym', 'Ilyas', 'Marat', 'Nurdaulet', 'Ospan', 'Talgat',
    'Bekhruz', 'Davron', 'Elyor', 'Firdavs', 'Golib', 'Ilhom', 'Jamshid', 'Kamron', 'Lochin', 'Muzaffar'],
  last: ['Nazarov', 'Yusupov', 'Karimov', 'Ismailov', 'Rashidov', 'Abdullaev', 'Sultanov', 'Aliyev', 'Rakhimov', 'Ahmedov',
    'Saidov', 'Tashkentov', 'Yuldashev', 'Ergashev', 'Nurmatov', 'Bekov', 'Tulegenov', 'Ospanov', 'Zhaksybekov', 'Amanov',
    'Seitkali', 'Dzhaksybekov', 'Turgunov', 'Kamalov', 'Mirzoev', 'Sharipov', 'Tashkulov', 'Kydyrov', 'Abenov', 'Sagynov',
    'Bekmuratov', 'Dosmukhamedov', 'Esenov', 'Ganiyev', 'Hasanov', 'Ikramov', 'Juraev', 'Kadyrov', 'Latipov', 'Mamatov'],
};

const african: NamePool = {
  first: ['Thabo', 'Sipho', 'Lwazi', 'Kagiso', 'Tumelo', 'Kwame', 'Kofi', 'Emeka', 'Chidi', 'Ibrahima',
    'Mamadou', 'Cheikh', 'Ousmane', 'Abdoulaye', 'Oluwaseun', 'Sizwe', 'Bongani', 'Themba', 'Lindani', 'Andile',
    'Kwabena', 'Yaw', 'Chukwuemeka', 'Adewale', 'Babajide', 'Moussa', 'Seydou', 'Alassane', 'Modou', 'Souleymane',
    'Tendai', 'Farai', 'Tafadzwa', 'Blessing', 'Emmanuel', 'Kelvin', 'Innocent', 'Given', 'Munashe', 'Simba',
    'Jabari', 'Zola', 'Vusi', 'Mandla', 'Nkosana', 'Sabelo', 'Sanele', 'Ayanda', 'Bandile', 'Dumisani',
    'Kondwani', 'Chisomo', 'Mphatso', 'Takudzwa', 'Tinashe', 'Wesley', 'Prosper', 'Gift', 'Godfrey', 'Amara'],
  last: ['Nkosi', 'Dlamini', 'Mokoena', 'van der Merwe', 'Botha', 'Pretorius', 'Diallo', 'Traoré', 'Diop', 'Okafor',
    'Adeyemi', 'Balogun', 'Mensah', 'Owusu', 'Boateng', 'Khumalo', 'Ndlovu', 'Zulu', 'Naidoo', 'Steyn',
    'Sow', 'Toure', 'Fall', 'Kane', 'Ndiaye', 'Osei', 'Asante', 'Nwosu', 'Eze', 'Bello',
    'Moyo', 'Ncube', 'Sibanda', 'Chikwava', 'Muchena', 'Gumbo', 'Mutasa', 'Chirwa', 'Banda', 'Phiri',
    'Zwane', 'Cele', 'Mahlangu', 'Radebe', 'Sithole', 'Tshabalala', 'Xaba', 'Zwelithini', 'Kunene', 'Mabaso',
    'Coker', 'Fashola', 'Ogundipe', 'Sowande', 'Abiola', 'Danjuma', 'Garba', 'Musa', 'Suleiman', 'Yakubu'],
};

// Fallback for any country code not explicitly mapped below — a small mixed-region pool rather
// than crashing or defaulting to one specific culture.
const fallback: NamePool = {
  first: ['Alex', 'Sam', 'Chris', 'Leo', 'Max', 'Nico', 'Dani', 'Robin', 'Kim', 'Jordan',
    'Ariel', 'Charlie', 'Micha', 'Andrea', 'Noa', 'Kai', 'Rene', 'Sasha', 'Toni', 'Morgan',
    'Casey', 'Devon', 'Quinn', 'Reese', 'Skyler', 'Tatum', 'Avery', 'Blair', 'Ellis', 'Frankie'],
  last: ['Silva', 'Novak', 'Allen', 'Bergman', 'Moreau', 'Okoro', 'Rahman', 'Popescu', 'Lindgren', 'Castillo',
    'Weiss', 'Adams', 'Ferreira', 'Kowal', 'Lindholm', 'Petit', 'Osei', 'Malik', 'Varga', 'Sandoval',
    'Kessler', 'Marchetti', 'Halim', 'Vogel', 'Santoro', 'Delgado', 'Brenner', 'Kowalczyk', 'Amaro', 'Winther'],
};

/** Maps every country code used by the game's player pool and Davis Cup country lists to a
 * regional name pool. Anything not listed here falls back to a small mixed pool. */
const COUNTRY_TO_NAME_POOL: Record<string, NamePool> = {
  // English-speaking
  USA: english, GBR: english, AUS: english, NZL: english, CAN: english, IRL: english,
  BER: english, JAM: english, BAR: english,
  // Spanish-speaking, split by sub-region for more variety and country-appropriate flavor
  ARG: spanishRiver, URU: spanishRiver, PAR: spanishRiver,
  CHI: spanishAndean, COL: spanishAndean, PER: spanishAndean, ECU: spanishAndean, BOL: spanishAndean,
  ESP: spanishIberian,
  MEX: spanishMexCaribe, DOM: spanishMexCaribe, PUR: spanishMexCaribe, ESA: spanishMexCaribe,
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

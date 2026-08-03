
import { Tactic, Position, TacticSettings, PlayerTacticSettings, TrainingSchedule, RealManager, StaffAttributes } from "../types";

export interface RealClubDef {
   name: string;
   short: string;
   pCol: string;
   sCol: string;
   stadium: string;
   rep: number;
   country: string;
}

export const COUNTRY_CODES: Record<string, string> = {
  "Argentina": "ar",
  "Brasil": "br",
  "Uruguay": "uy",
  "Chile": "cl",
  "Colombia": "co",
  "Ecuador": "ec",
  "Paraguay": "py",
  "Bolivia": "bo",
  "Perú": "pe",
  "Venezuela": "ve",
  "España": "es",
  "Inglaterra": "gb-eng",
  "Alemania": "de",
  "Italia": "it",
  "Francia": "fr",
  "Portugal": "pt",
  "Bélgica": "be",
  "Países Bajos": "nl",
  "Japón": "jp",
  "México": "mx",
  "USA": "us",
  "Austria": "at",
  "Croacia": "hr",
  "Dinamarca": "dk",
  "Grecia": "gr",
  "Noruega": "no",
  "Polonia": "pl",
  "Rusia": "ru",
  "Suecia": "se",
  "Suiza": "ch",
  "Turquía": "tr",
  "Ucrania": "ua",
  "Arabia Saudita": "sa",
  // Selecciones nacionales adicionales
  "Serbia": "rs",
  "Canadá": "ca",
  "Australia": "au",
  "Marruecos": "ma",
  "Senegal": "sn",
  "Nigeria": "ng",
  "Egipto": "eg",
  "Ghana": "gh",
  "Camerún": "cm",
  "Costa de Marfil": "ci",
  "Túnez": "tn",
  "Corea del Sur": "kr",
  "Estados Unidos": "us",
  "Peru": "pe",
};

// Lookup sin acentos ni mayúsculas para que 'Peru' y 'Perú', 'USA' y 'Estados Unidos' resuelvan igual.
const normalizeCountryName = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
const COUNTRY_CODE_LOOKUP: Record<string, string> = {};
Object.entries(COUNTRY_CODES).forEach(([name, code]) => {
  COUNTRY_CODE_LOOKUP[normalizeCountryName(name)] = code;
});

export const getFlagUrl = (countryName: string) => {
  const code = COUNTRY_CODE_LOOKUP[normalizeCountryName(countryName || '')];
  // Fallback to UN flag if not found
  if (!code) return "https://flagcdn.com/w40/un.png";
  return `https://flagcdn.com/w40/${code}.png`;
};

export const REGEN_DB: any = {
  "espana": {
    "nombres": ["Iker", "Pau", "Jordi", "Álvaro", "Unai", "Gavi", "Ferran", "Aitor", "Lamine", "Brais", "Yeray", "Borja", "Koke", "Hugo", "Dani", "Mikel", "Xabi", "Santi", "Iñaki", "Rodri"],
    "apellidos": ["García", "Rodríguez", "González", "Fernández", "López", "Martínez", "Sánchez", "Pérez", "Gómez", "Torres", "Ruiz", "Navarro", "Ramos", "Vázquez", "Castro", "Murillo", "Expósito", "Iglesias", "Soler", "Zubeldia"]
  },
  "inglaterra": {
    "nombres": ["Harry", "Jack", "Mason", "Declan", "Jude", "Cole", "Trent", "Bukayo", "Marcus", "Harvey", "Oliver", "George", "James", "Kyle", "Callum", "Reece", "Connor", "Luke", "Adam", "Ben"],
    "apellidos": ["Walker", "Smith", "Palmer", "Bellingham", "Stones", "Rice", "Foden", "Shaw", "Cook", "Ward", "Kane", "White", "Moore", "Green", "Wood", "Cooper", "Brown", "Wilson", "Harrison", "Taylor"]
  },
  "alemania": {
    "nombres": ["Lukas", "Finn", "Leon", "Jonas", "Maximilian", "Kai", "Florian", "Julian", "Timo", "Bastian", "Joshua", "Jan", "Lars", "Nico", "Stefan", "Mats", "Emil", "Niklas", "Benedikt", "Marco"],
    "apellidos": ["Müller", "Schmidt", "Schneider", "Fischer", "Weber", "Meyer", "Wagner", "Becker", "Schulz", "Hoffmann", "Koch", "Richter", "Klein", "Wolf", "Schröder", "Neumann", "Zimmermann", "Krüger", "Hofmann", "Hartmann"]
  },
  "brasil": {
    "nombres": ["Thiago", "Vinícius", "Cauã", "Gabriel", "Luan", "Matheus", "Vitor", "Douglas", "Endrick", "Lucas", "Igor", "Bruno", "Murilo", "Renan", "Caio", "Felipe", "Rodrigo", "Alison", "Rafael", "Éder"],
    "apellidos": ["da Silva", "dos Santos", "Ferreira", "Barbosa", "Pereira", "Oliveira", "Costa", "Rodrigues", "Almeida", "Nascimento", "Lopes", "Araújo", "Cardoso", "Melo", "Ribeiro", "Teixeira", "Gomes", "Martins", "Soares", "Vieira"]
  },
  "ecuador": {
    "nombres": ["Jefferson", "Bryan", "Pervis", "Enner", "Moises", "Jeremy", "Kendry", "Gonzalo", "Ángelo", "Janner", "Robert", "Xavier", "Stiven", "Willian", "Kevin", "Christian", "Leonardo", "Junior", "Jordy", "Darwin"],
    "apellidos": ["Estupiñán", "Caicedo", "Valencia", "Hincapié", "Pacho", "Preciado", "Plata", "Arboleda", "Mena", "Gruezo", "Sornoza", "Campana", "Tenorio", "Hurtado", "Angulo", "Quiñónez", "Reasco", "Chalá", "Ibarra", "Estrada"]
  },
  "chile": {
    "nombres": ["Matías", "Benjamín", "Vicente", "Tomás", "Joaquín", "Marcelino", "Brayan", "Gabriel", "Esteban", "Damián", "Francisco", "Rodrigo", "Ignacio", "Lucas", "Sebastián", "Felipe", "Bastián", "Alexander", "Cristóbal", "Diego"],
    "apellidos": ["Pavez", "Suelazo", "Vidal", "Sánchez", "Aránguiz", "Isla", "Medel", "Brereton", "Maripán", "Catalán", "Loyola", "Echeverría", "Méndez", "Pulgar", "Osorio", "Assadi", "Tapia", "Aravena", "Bolados", "Fuentes"]
  },
  "uruguay": {
    "nombres": ["Nahitan", "Federico", "Darwin", "Facundo", "Ronald", "Mathías", "Manuel", "Giorgian", "Rodrigo", "Santiago", "Sebastián", "Nicolás", "Agustín", "Renzo", "Emiliano", "Luciano", "Tiago", "Matías", "Mauro", "Ignacio"],
    "apellidos": ["Valverde", "Araújo", "Núñez", "Bentancur", "Ugarte", "De La Cruz", "Olivera", "Giménez", "Pellistri", "Cáceres", "Viña", "Vecino", "Torres", "Arezo", "Canobbio", "Brizuela", "Godín", "Nández", "Suárez", "Cavani"]
  },
  "colombia": {
    "nombres": ["Luis", "James", "Jhon", "Yerson", "Mateus", "Davinson", "Jefferson", "Wilmar", "Rafael", "Camilo", "Daniel", "Kevin", "Yáser", "Jorge", "Cristian", "Deiver", "Brayan", "Juan", "Johan", "Santiago"],
    "apellidos": ["Díaz", "Rodríguez", "Arias", "Durán", "Lerma", "Sánchez", "Cuesta", "Castaño", "Borré", "Quintero", "Asprilla", "Carrascal", "Machado", "Lucumí", "Sinisterra", "Borja", "Zapata", "Uribe", "Munoz", "Mojica"]
  },
  "paraguay": {
    "nombres": ["Miguel", "Julio", "Gustavo", "Mathías", "Ramón", "Braian", "Matías", "Omar", "Junior", "Alejandro", "Iván", "Robert", "Diego", "Kaku", "Adam", "Antonio", "Lorenzo", "Derlis", "Ángel", "Fabrizio"],
    "apellidos": ["Almirón", "Enciso", "Gómez", "Villasanti", "Sosa", "Ojeda", "Espinoza", "Alonso", "Rojas", "Balbuena", "Romero", "Bareiro", "Sanabria", "Avalos", "Gamarra", "Piris", "Cáceres", "Galdames", "Villalba", "Acosta"]
  },
  "bolivia": {
    "nombres": ["Marcelo", "Ramiro", "Henry", "Guillermo", "Jaume", "Jeyson", "Gabriel", "Roberto", "Jairo", "Carmelo", "Leonel", "Diego", "Luis", "Boris", "Moises", "Adalid", "Miguel", "Victor", "Franz", "Bruno"],
    "apellidos": ["Moreno", "Vaca", "Cuéllar", "Viscarra", "Haquin", "Fernández", "Bejarano", "Chura", "Algarañaz", "Justiniano", "Arrascaita", "Sagredo", "Terceros", "Villamil", "Ursino", "Quinteros", "Lampe", "Paniagua", "Álvarez", "Roca"]
  },
   "venezuela": {
     "nombres": ["Salomón", "Yeferson", "Darwin", "Telasco", "Nahuel", "Samuel", "Christian", "Jefferson", "Wilker", "Jon", "Jhon", "Eric", "Eduard", "Rómulo", "Sergio", "Alexander", "Alain", "José", "Bryan", "Kevin"],
     "apellidos": ["Rondón", "Soteldo", "Machís", "Segovia", "Ferraresi", "Cáseres", "Savarino", "Martínez", "Ángel", "Aramburu", "Chancellor", "Ramírez", "Bello", "Otero", "Córdova", "Rincón", "Baroja", "González", "Makoun", "Navarro"]
   },
   "francia": {
     "nombres": ["Kylian", "Antoine", "Neymar", "Karim", "Kingsley", "Aurélien", "Eduardo", "Théo", "Christopher", "Randal", "Dayot", "Bradley", "Moussa", "Ibrahim", "Florian", "Marcus", "Jean", "Pierre", "Matteo", "Lucas"],
     "apellidos": ["Mbappé", "Griezmann", "Junior", "Benzema", "Coman", "Tchouaméni", "Camavinga", "Hernández", "Nkunku", "Kolo", "Upamecano", "Barcola", "Diaby", "Konaté", "Thuram", "Thiago", "Dembélé", "Rabiot", "Guendouzi", "Tolisso"]
   },
   "portugal": {
     "nombres": ["Cristiano", "Bruno", "Bernardo", "Rúben", "João", "Víctor", "Diogo", "João", "Rafa", "Nuno", "Pedro", "Gonçalo", "André", "Ricardo", "Hugo", "Tiago", "Fábio", "Nélson", "Sérgio", "Miguel"],
     "apellidos": ["Silva", "Santos", "Oliveira", "Costa", "Ferreira", "Pereira", "Ramos", "Almeida", "Rodrigues", "Martins", "Lopes", "Gomes", "Teixeira", "Carvalho", "Mendes", "Rocha", "Moreira", "Nunes", "Machado", "Ribeiro"]
   },
   "italia": {
     "nombres": ["Francesco", "Nicolò", "Lorenzo", "Federico", "Alessandro", "Giacomo", "Riccardo", "Andrea", "Matteo", "Davide", "Simone", "Antonio", "Marco", "Edoardo", "Tommaso", "Leonardo", "Gabriele", "Diego", "Enrico", "Christian"],
     "apellidos": ["Rossi", "Ferrari", "Esposito", "Bianchi", "Romano", "Colombo", "Ricci", "Marino", "Greco", "Bruno", "Gallo", "Conti", "De Luca", "Mancini", "Costa", "Giordano", "Rizzo", "Lombardi", "Bianco", "Santoro"]
   },
   "paisesbajos": {
     "nombres": ["Cody", "Dusan", "Memphis", "Frenkie", "Virgil", "Denzel", "Steven", "Nathan", "Davy", "Georginio", "Arnaut", "Matthijs", "Ryan", "Luuk", "Noa", "Brian", "Jasper", "Xavi", "Wout", "Quinten"],
     "apellidos": ["Gakpo", "Tadic", "Depay", "de Jong", "van Dijk", "Dumfries", "Bergwijn", "Aké", "Klassen", "Wijnaldum", "Danjuma", "de Ligt", "Gravenberch", "de Vrij", "Lang", "Brobbey", "Timber", "Simons", "Weghorst", "Malen"]
   },
   "mexico": {
     "nombres": ["Hirving", "Jesús", "Andrés", "Raúl", "Carlos", "Diego", "Luis", "Oribe", "Carlos", "Alexis", "Uriel", "Diego", "Guillermo", "Jorge", "Marco", "Gerardo", "Jonathan", "Néstor", "Víctor", "Erick"],
     "apellidos": ["Lozano", "Corona", "Guardado", "Jiménez", "Vela", "Lainez", "Chávez", "Peralta", "González", "Vega", "Antuna", "Pineda", "Ochoa", "Sánchez", "Araujo", "Martínez", "dos Santos", "Araujo", "Montes", "Gutiérrez"]
   },
   "usa": {
     "nombres": ["Christian", "Weston", "Giovanni", "Tyler", "Sergiño", "Yunus", "Brenden", "Ricardo", "Cade", "Johnny", "Kevin", "James", "Timothy", "Kellyn", "Erik", "DeAndre", "Jordan", "Matt", "Joe", "Chris"],
     "apellidos": ["Pulisic", "McKennie", "Reyna", "Adams", "Dest", "Musah", "Aaronson", "Pepi", "Cowan", "Durkin", "Parsons", "Bello", "Weygate", "Moore", "Turner", "Yedlin", "Morris", "Turner", "Scally", "Gudelj"]
   },
   "japon": {
     "nombres": ["Takefusa", "Ritsu", "Daizen", "Kaoru", "Yuya", "Ao", "Hiroki", "Takumi", "Wataru", "Yuta", "Shoya", "Genki", "Sota", "Ryoya", "Hayao", "Kota", "Yuki", "Reo", "Keito", "Shuto"],
     "apellidos": ["Kubo", "Dōan", "Maeda", "Mitoma", "Kubo", "Tanaka", "Soma", "Minamino", "Endō", "Nakajima", "Yamaguchi", "Harada", "Shimizu", "Ito", "Takahashi", "Wakizaka", "Hayashi", "Hatate", "Sugawara", "Nakamura"]
   },
   "belgica": {
     "nombres": ["Kevin", "Romelu", "Thibaut", "Youri", "Leandro", "Axel", "Hans", "Dries", "Timothy", "Leander", "Thomas", "Arthur", "Amadou", "Eden", "Yannick", "Toby", "Jan", "Charles", "Alexis", "Jérémy"],
     "apellidos": ["De Bruyne", "Lukaku", "Courtois", "Tielemans", "Trossard", "Witsel", "Vanaken", "Mertens", "Castagne", "Dendoncker", "Meunier", "Theate", "Onana", "Hazard", "Vertonghen", "Alderweireld", "Carrasco", "De Ketelaere", "Mangala", "Doku"]
   },
   "turquia": {
     "nombres": ["Emre", "Eren", "Barış", "Ferdi", "Cengiz", "Yusuf", "Arda", "Salih", "Burak", "Merih", "Ozan", "Zeki", "Kerem", "Hakan", "Orkun", "Deniz", "Can", "İsmail", "Umut", "Kaan"],
     "apellidos": ["Kökçü", "Yılmaz", "Özcan", "Yıldırım", "Ünal", "Akbaba", "Güler", "Kabak", "Tufan", "Çalhanoğlu", "Demiral", "Çelik", "Ak", "Bayındır", "Aktürkoğlu", "Kara", "Özdemir", "Yüksel", "Şahin", "Arslan"]
   },
   "rusia": {
     "nombres": ["Ivan", "Fyodor", "Andrey", "Sergey", "Mikhail", "Yuri", "Denis", "Konstantin", "Roman", "Nikolay", "Georgiy", "Vladimir", "Kirill", "Maksim", "Artyom", "Timofey", "Yegor", "Boris", "Leonid", "Evgeniy"],
     "apellidos": ["Smirnov", "Ivanov", "Kuznetsov", "Popov", "Volkov", "Morozov", "Petrov", "Sokolov", "Kozlov", "Lebedev", "Novikov", "Fyodorov", "Mikhailov", "Vasiliev", "Orlov", "Nikolaev", "Zaytsev", "Bogdanov", "Tikhonov", "Romanov"]
   },
   "croacia": {
     "nombres": ["Luka", "Mateo", "Ivan", "Borna", "Bruno", "Nikola", "Dominik", "Josip", "Darijo", "Tin", "Mario", "Marko", "Ante", "Lovro", "Lovren", "Jakov", "Kristijan", "Danijel", "Karlo", "Mihael"],
     "apellidos": ["Kovačić", "Brozović", "Perišić", "Livaković", "Lovren", "Kramarić", "Petković", "Vlašić", "Juranović", "Sosa", "Gvardiol", "Pašalić", "Majer", "Oršić", "Šutalo", "Erlić", "Ivanušec", "Barišić", "Brekalo", "Sučić"]
   },
   "grecia": {
     "nombres": ["Nikos", "Dimitris", "Petros", "Andreas", "Kostas", "Ioannis", "Vasilis", "Georgios", "Sokratis", "Christos", "Spyros", "Alexandros", "Marios", "Elias", "Lefteris", "Stathis", "Giannis", "Thanasis", "Manolis", "Anastasios"],
     "apellidos": ["Papadopoulos", "Georgiou", "Vasilakis", "Karagounis", "Ntinos", "Samaras", "Bakas", "Lazaridis", "Manolis", "Xenakis", "Stavrou", "Athanasopoulos", "Alexiou", "Angelopoulos", "Kyriazis", "Petrakis", "Giannakopoulos", "Kalogeropoulos", "Sotiropoulos", "Charalampidis"]
   },
   "austria": {
     "nombres": ["David", "Marko", "Philipp", "Bastian", "Christoph", "Andreas", "Dominik", "Jakob", "Marcel", "Florian", "Konrad", "Julian", "Kevin", "Lukas", "Maximilian", "Tobias", "Patrick", "Sebastian", "Simon", "Stefan"],
     "apellidos": ["Gruber", "Huber", "Bauer", "Wimmer", "Pichler", "Moser", "Fischer", "Schmid", "Leitner", "Winkler", "Weber", "Schwarz", "Seidl", "Hofer", "Mayer", "Berger", "Wagner", "Eder", "Riegler", "Haas"]
   },
   "suiza": {
     "nombres": ["Nico", "Noah", "Liam", "Fabian", "Remo", "Cedric", "Gabriel", "Vincent", "Manuel", "Marco", "Simon", "Eren", "Yann", "Michel", "Severin", "Alain", "Breel", "Xherdan", "Eray", "Johan"],
     "apellidos": ["Frei", "Müller", "Meier", "Schmid", "Schneider", "Steiner", "Brunner", "Keller", "Zimmermann", "Roth", "Weber", "Bachmann", "Graf", "Hofmann", "Egli", "Hess", "Bucher", "Fischer", "Gerber", "Zürcher"]
   },
   "dinamarca": {
     "nombres": ["Christian", "Pierre-Emile", "Joakim", "Jens", "Simon", "Jonas", "Mikkel", "Andreas", "Lasse", "Kasper", "Mads", "Mathias", "Rasmus", "Daniel", "Frederik", "Jacob", "Morten", "Philip", "Oliver", "Jesper"],
     "apellidos": ["Eriksen", "Højbjerg", "Mæhle", "Stryger", "Kjær", "Wind", "Damsgaard", "Poulsen", "Schmeichel", "Dolberg", "Christensen", "Nielsen", "Jensen", "Larsen", "Sørensen", "Jørgensen", "Olsen", "Rasmussen", "Hansen", "Pedersen"]
   },
   "suecia": {
     "nombres": ["Erik", "Johan", "Anders", "Niklas", "Lars", "Magnus", "Emil", "Oscar", "Karl", "Viktor", "Mattias", "Gustav", "Per", "Fredrik", "Henrik", "Axel", "Linus", "Ludvig", "Anton", "Simon"],
     "apellidos": ["Karlsson", "Johansson", "Andersson", "Larsson", "Svensson", "Nilsson", "Gustafsson", "Eriksson", "Persson", "Olsson", "Jansson", "Pettersson", "Jönsson", "Bergström", "Henriksson", "Lindström", "Nyström", "Jakobsson", "Lundström", "Forsberg"]
   },
   "noruega": {
     "nombres": ["Erling", "Martin", "Sander", "Alexander", "Stefan", "Mats", "Marius", "Ola", "Kristian", "Leo", "Jonas", "Henrik", "Fredrik", "Bjørn", "Ole", "Thomas", "Tobias", "Einar", "Tor", "Daniel"],
     "apellidos": ["Hansen", "Olsen", "Larsen", "Haugen", "Moen", "Berg", "Pedersen", "Nilsen", "Jakobsen", "Eriksen", "Solberg", "Andersen", "Johannesen", "Halvorsen", "Strand", "Dahl", "Bakke", "Lund", "Aas", "Vik"]
   },
   "polonia": {
     "nombres": ["Mateusz", "Piotr", "Kamil", "Jakub", "Błażej", "Rafał", "Tomasz", "Michał", "Pawel", "Jan", "Bartosz", "Grzegorz", "Lukasz", "Dariusz", "Robert", "Wlodzimierz", "Adrian", "Dawid", "Maciej", "Adam"],
     "apellidos": ["Kowalski", "Nowak", "Wiśniewski", "Kaczmarek", "Lewandowski", "Wójcik", "Kamiński", "Chmiel", "Zieliński", "Kozłowski", "Szymański", "Baran", "Duda", "Pawlak", "Lis", "Adamczyk", "Walczak", "Sikora", "Mazur", "Tomczyk"]
   },
   "ucrania": {
     "nombres": ["Andriy", "Taras", "Denys", "Yevhen", "Mykhailo", "Oleksandr", "Danylo", "Roman", "Vladyslav", "Sergiy", "Maxim", "Yuriy", "Ihor", "Kyrylo", "Heorhiy", "Ievgen", "Petro", "Bogdan", "Maksym", "Yaroslav"],
     "apellidos": ["Shevchenko", "Kovalenko", "Bondarenko", "Moroz", "Tkachenko", "Kovalchuk", "Khmara", "Boyko", "Melnyk", "Lysenko", "Zinchenko", "Petrenko", "Shevchuk", "Hrytsenko", "Polishchuk", "Tereshchenko", "Mosiychuk", "Kravchuk", "Yarmolenko", "Romanchuk"]
   },
   "arabiasaudita": {
     "nombres": ["Mohammed", "Fahad", "Abdullah", "Ali", "Hussein", "Khaled", "Yahya", "Tariq", "Nawaf", "Bader", "Mansour", "Sultan", "Majed", "Ahmed", "Omar", "Rashid", "Hassan", "Jassim", "Waheed", "Sami"],
     "apellidos": ["Al-Harbi", "Al-Shammari", "Al-Mutairi", "Al-Rashidi", "Al-Otaibi", "Al-Dosari", "Al-Ghamdi", "Al-Qahtani", "Al-Ansari", "Al-Zahrani", "Abusahmain", "Al-Johani", "Al-Saleh", "Al-Nemer", "Al-Faraj", "Al-Shehri", "Al-Muwallad", "Al-Khobar", "Al-Moosa", "Al-Tamimi"]
   }
 };

export const ARG_PRIMERA: RealClubDef[] = [
    { name: "River Plate", short: "RIV", pCol: "bg-white", sCol: "text-red-600", stadium: "Mas Monumental", rep: 9000, country: "Argentina" },
    { name: "Boca Juniors", short: "BOC", pCol: "bg-blue-900", sCol: "text-yellow-400", stadium: "La Bombonera", rep: 8950, country: "Argentina" },
    { name: "Independiente", short: "IND", pCol: "bg-red-700", sCol: "text-white", stadium: "Libertadores de América", rep: 8200, country: "Argentina" },
    { name: "Racing Club", short: "RAC", pCol: "bg-sky-300", sCol: "text-white", stadium: "El Cilindro", rep: 8300, country: "Argentina" },
    { name: "San Lorenzo", short: "SLO", pCol: "bg-blue-900", sCol: "text-red-600", stadium: "Pedro Bidegain", rep: 8100, country: "Argentina" },
    { name: "Estudiantes LP", short: "EST", pCol: "bg-red-600", sCol: "text-white", stadium: "UNO", rep: 7900, country: "Argentina" },
    { name: "Vélez Sarsfield", short: "VEL", pCol: "bg-white", sCol: "text-blue-800", stadium: "José Amalfitani", rep: 7800, country: "Argentina" },
    { name: "Rosario Central", short: "CEN", pCol: "bg-blue-800", sCol: "text-yellow-400", stadium: "Gigante de Arroyito", rep: 7600, country: "Argentina" },
    { name: "Newell's Old Boys", short: "NOB", pCol: "bg-red-600", sCol: "text-black", stadium: "Marcelo Bielsa", rep: 7550, country: "Argentina" },
    { name: "Talleres", short: "TAL", pCol: "bg-blue-900", sCol: "text-white", stadium: "Mario Kempes", rep: 7500, country: "Argentina" },
    { name: "Belgrano", short: "BEL", pCol: "bg-sky-400", sCol: "text-white", stadium: "Julio César Villagra", rep: 7200, country: "Argentina" },
    { name: "Argentinos Jrs", short: "ARG", pCol: "bg-red-600", sCol: "text-white", stadium: "Diego A. Maradona", rep: 7100, country: "Argentina" },
    { name: "Lanús", short: "LAN", pCol: "bg-red-900", sCol: "text-white", stadium: "La Fortaleza", rep: 7150, country: "Argentina" },
    { name: "Huracán", short: "HUR", pCol: "bg-white", sCol: "text-red-600", stadium: "Tomás A. Ducó", rep: 7000, country: "Argentina" },
    { name: "Gimnasia LP", short: "GEL", pCol: "bg-white", sCol: "text-blue-900", stadium: "El Bosque", rep: 6900, country: "Argentina" },
    { name: "Banfield", short: "BAN", pCol: "bg-green-600", sCol: "text-white", stadium: "Florencio Sola", rep: 6800, country: "Argentina" },
    { name: "Unión", short: "UNI", pCol: "bg-red-600", sCol: "text-white", stadium: "15 de Abril", rep: 6600, country: "Argentina" },
    { name: "Colón", short: "COL", pCol: "bg-red-600", sCol: "text-black", stadium: "Cementerio de los Elefantes", rep: 6700, country: "Argentina" },
    { name: "Defensa y Justicia", short: "DYJ", pCol: "bg-green-600", sCol: "text-yellow-400", stadium: "Tito Tomaghello", rep: 6900, country: "Argentina" },
    { name: "Atlético Tucumán", short: "ATU", pCol: "bg-sky-300", sCol: "text-white", stadium: "José Fierro", rep: 6500, country: "Argentina" },
    { name: "Godoy Cruz", short: "GOD", pCol: "bg-blue-600", sCol: "text-white", stadium: "Malvinas Argentinas", rep: 6500, country: "Argentina" },
    { name: "Tigre", short: "TIG", pCol: "bg-blue-800", sCol: "text-red-600", stadium: "José Dellagiovanna", rep: 6400, country: "Argentina" },
    { name: "Platense", short: "PLA", pCol: "bg-white", sCol: "text-amber-900", stadium: "Ciudad de Vicente López", rep: 6200, country: "Argentina" },
    { name: "Sarmiento", short: "SAR", pCol: "bg-green-500", sCol: "text-white", stadium: "Eva Perón", rep: 6000, country: "Argentina" },
    { name: "Central Córdoba", short: "CCO", pCol: "bg-black", sCol: "text-white", stadium: "Madre de Ciudades", rep: 5900, country: "Argentina" },
    { name: "Barracas Central", short: "BAR", pCol: "bg-red-600", sCol: "text-white", stadium: "Claudio Tapia", rep: 5800, country: "Argentina" },
    { name: "Instituto", short: "INS", pCol: "bg-red-600", sCol: "text-white", stadium: "Monumental de Alta Córdoba", rep: 6300, country: "Argentina" },
    { name: "Riestra", short: "RIE", pCol: "bg-black", sCol: "text-white", stadium: "Guillermo Laza", rep: 5500, country: "Argentina" }
];

export const ARG_NACIONAL: RealClubDef[] = [
    { name: "Ferro Carril Oeste", short: "FCO", pCol: "bg-green-700", sCol: "text-white", stadium: "Arq. Etcheverri", rep: 5800, country: "Argentina" },
    { name: "Chacarita Jrs", short: "CHA", pCol: "bg-red-600", sCol: "text-black", stadium: "San Martín", rep: 5900, country: "Argentina" },
    { name: "Quilmes", short: "QUI", pCol: "bg-white", sCol: "text-blue-900", stadium: "Centenario", rep: 5800, country: "Argentina" },
    { name: "San Martín (T)", short: "SMT", pCol: "bg-red-600", sCol: "text-white", stadium: "La Ciudadela", rep: 6100, country: "Argentina" },
    { name: "San Martín (SJ)", short: "SMJ", pCol: "bg-green-800", sCol: "text-black", stadium: "Hilario Sánchez", rep: 5600, country: "Argentina" },
    { name: "All Boys", short: "ALL", pCol: "bg-white", sCol: "text-black", stadium: "Islas Malvinas", rep: 5500, country: "Argentina" },
    { name: "Atlanta", short: "ATL", pCol: "bg-blue-800", sCol: "text-yellow-400", stadium: "Don León Kolbowsky", rep: 5400, country: "Argentina" },
    { name: "Almirante Brown", short: "ALM", pCol: "bg-yellow-400", sCol: "text-black", stadium: "Fragata Sarmiento", rep: 5500, country: "Argentina" },
    { name: "Nueva Chicago", short: "NCH", pCol: "bg-green-600", sCol: "text-black", stadium: "República de Mataderos", rep: 5600, country: "Argentina" },
    { name: "Dep. Morón", short: "MOR", pCol: "bg-white", sCol: "text-red-600", stadium: "Nuevo Francisco Urbano", rep: 5300, country: "Argentina" },
    { name: "Temperley", short: "TEM", pCol: "bg-sky-400", sCol: "text-white", stadium: "Alfredo Beranger", rep: 5200, country: "Argentina" },
    { name: "Los Andes", short: "LAN", pCol: "bg-red-600", sCol: "text-white", stadium: "Eduardo Gallardón", rep: 5100, country: "Argentina" },
    { name: "Aldosivi", short: "ALD", pCol: "bg-green-500", sCol: "text-yellow-400", stadium: "José María Minella", rep: 5700, country: "Argentina" },
    { name: "Patronato", short: "PAT", pCol: "bg-red-600", sCol: "text-black", stadium: "Presbítero Grella", rep: 5600, country: "Argentina" },
    { name: "Gimnasia (J)", short: "GEJ", pCol: "bg-sky-300", sCol: "text-white", stadium: "23 de Agosto", rep: 5400, country: "Argentina" },
    { name: "Estudiantes RC", short: "ERC", pCol: "bg-sky-400", sCol: "text-white", stadium: "Antonio Candini", rep: 5300, country: "Argentina" },
    { name: "Agropecuario", short: "AGR", pCol: "bg-green-700", sCol: "text-red-600", stadium: "Ofelia Rosenzuaig", rep: 5000, country: "Argentina" },
    { name: "Alvarado", short: "ALV", pCol: "bg-blue-900", sCol: "text-white", stadium: "José María Minella", rep: 5100, country: "Argentina" },
    { name: "Brown (A)", short: "BRO", pCol: "bg-sky-300", sCol: "text-black", stadium: "Lorenzo Arandilla", rep: 4900, country: "Argentina" },
    { name: "Def. de Belgrano", short: "DEF", pCol: "bg-red-600", sCol: "text-black", stadium: "Juan Pasquale", rep: 5200, country: "Argentina" }
];

export const CONT_CLUBS: RealClubDef[] = [
    // Brazil
    { name: "Flamengo", short: "FLA", pCol: "bg-red-700", sCol: "text-black", stadium: "Maracanã", rep: 9300, country: "Brasil" },
    { name: "Palmeiras", short: "PAL", pCol: "bg-green-700", sCol: "text-white", stadium: "Allianz Parque", rep: 9200, country: "Brasil" },
    { name: "São Paulo", short: "SAO", pCol: "bg-white", sCol: "text-red-600", stadium: "Morumbi", rep: 9000, country: "Brasil" },
    { name: "Santos", short: "SAN", pCol: "bg-white", sCol: "text-black", stadium: "Vila Belmiro", rep: 8800, country: "Brasil" },
    { name: "Corinthians", short: "COR", pCol: "bg-white", sCol: "text-black", stadium: "Neo Química Arena", rep: 8900, country: "Brasil" },
    { name: "Grêmio", short: "GRE", pCol: "bg-sky-500", sCol: "text-black", stadium: "Arena do Grêmio", rep: 8700, country: "Brasil" },
    { name: "Internacional", short: "INT", pCol: "bg-red-600", sCol: "text-white", stadium: "Beira-Rio", rep: 8700, country: "Brasil" },
    { name: "Fluminense", short: "FLU", pCol: "bg-red-800", sCol: "text-green-700", stadium: "Maracanã", rep: 8600, country: "Brasil" },
    { name: "Atlético Mineiro", short: "CAM", pCol: "bg-black", sCol: "text-white", stadium: "Arena MRV", rep: 8800, country: "Brasil" },
    { name: "Botafogo", short: "BOT", pCol: "bg-black", sCol: "text-white", stadium: "Nilton Santos", rep: 8500, country: "Brasil" },
    // Uruguay
    { name: "Peñarol", short: "PEN", pCol: "bg-yellow-400", sCol: "text-black", stadium: "Campeón del Siglo", rep: 8200, country: "Uruguay" },
    { name: "Nacional", short: "NAC", pCol: "bg-white", sCol: "text-blue-800", stadium: "Gran Parque Central", rep: 8100, country: "Uruguay" },
    // Chile
    { name: "Colo-Colo", short: "COL", pCol: "bg-white", sCol: "text-black", stadium: "Monumental David Arellano", rep: 7800, country: "Chile" },
    { name: "U. de Chile", short: "UCH", pCol: "bg-blue-800", sCol: "text-white", stadium: "Nacional de Chile", rep: 7600, country: "Chile" },
    // Colombia
    { name: "Atl. Nacional", short: "ATN", pCol: "bg-green-600", sCol: "text-white", stadium: "Atanasio Girardot", rep: 7900, country: "Colombia" },
    { name: "Millonarios", short: "MIL", pCol: "bg-blue-700", sCol: "text-white", stadium: "El Campín", rep: 7500, country: "Colombia" },
    { name: "Junior", short: "JUN", pCol: "bg-red-600", sCol: "text-white", stadium: "Metropolitano", rep: 7400, country: "Colombia" },
    // Paraguay
    { name: "Olimpia", short: "OLI", pCol: "bg-white", sCol: "text-black", stadium: "Manuel Ferreira", rep: 7700, country: "Paraguay" },
    { name: "Cerro Porteño", short: "CER", pCol: "bg-red-700", sCol: "text-blue-800", stadium: "La Nueva Olla", rep: 7600, country: "Paraguay" },
    { name: "Libertad", short: "LIB", pCol: "bg-black", sCol: "text-white", stadium: "Dr. Nicolás Leoz", rep: 7400, country: "Paraguay" },
    // Ecuador
    { name: "LDU Quito", short: "LDU", pCol: "bg-white", sCol: "text-red-700", stadium: "Rodrigo Paz Delgado", rep: 7800, country: "Ecuador" },
    { name: "Ind. del Valle", short: "IDV", pCol: "bg-black", sCol: "text-blue-600", stadium: "Banco Guayaquil", rep: 8000, country: "Ecuador" },
    { name: "Barcelona SC", short: "BSC", pCol: "bg-yellow-400", sCol: "text-red-600", stadium: "Monumental Banco Pichincha", rep: 7700, country: "Ecuador" },
    // Peru
    { name: "Universitario", short: "UNI", pCol: "bg-red-100", sCol: "text-red-800", stadium: "Monumental U", rep: 7200, country: "Perú" },
    { name: "Sporting Cristal", short: "CRI", pCol: "bg-sky-400", sCol: "text-white", stadium: "Alberto Gallardo", rep: 7100, country: "Perú" },
    { name: "Alianza Lima", short: "ALI", pCol: "bg-blue-900", sCol: "text-white", stadium: "Alejandro Villanueva", rep: 7200, country: "Perú" },
    // Bolivia
    { name: "Bolívar", short: "BOL", pCol: "bg-sky-400", sCol: "text-white", stadium: "Hernando Siles", rep: 6800, country: "Bolivia" },
    { name: "The Strongest", short: "STR", pCol: "bg-yellow-400", sCol: "text-black", stadium: "Hernando Siles", rep: 6700, country: "Bolivia" },
    // Venezuela
    { name: "Caracas FC", short: "CFC", pCol: "bg-red-700", sCol: "text-white", stadium: "Olímpico de la UCV", rep: 6000, country: "Venezuela" },
    { name: "Dep. Táchira", short: "TAC", pCol: "bg-yellow-400", sCol: "text-black", stadium: "Pueblo Nuevo", rep: 6000, country: "Venezuela" }
];

export const CONT_CLUBS_TIER2: RealClubDef[] = [
    // Brazil
    { name: "Athletico PR", short: "CAP", pCol: "bg-red-700", sCol: "text-black", stadium: "Ligga Arena", rep: 8400, country: "Brasil" },
    { name: "Fortaleza", short: "FOR", pCol: "bg-blue-700", sCol: "text-red-600", stadium: "Castelão", rep: 8300, country: "Brasil" },
    { name: "Cruzeiro", short: "CRU", pCol: "bg-blue-700", sCol: "text-white", stadium: "Mineirão", rep: 8200, country: "Brasil" },
    { name: "Vasco da Gama", short: "VAS", pCol: "bg-white", sCol: "text-black", stadium: "São Januário", rep: 8100, country: "Brasil" },
    { name: "Bahia", short: "BAH", pCol: "bg-blue-600", sCol: "text-red-600", stadium: "Fonte Nova", rep: 7900, country: "Brasil" },
    // Chile
    { name: "U. Católica", short: "UCA", pCol: "bg-white", sCol: "text-blue-800", stadium: "San Carlos", rep: 7400, country: "Chile" },
    { name: "Cobreloa", short: "COB", pCol: "bg-orange-500", sCol: "text-white", stadium: "Zorros del Desierto", rep: 6800, country: "Chile" },
    { name: "Huachipato", short: "HUA", pCol: "bg-blue-900", sCol: "text-black", stadium: "CAP", rep: 6500, country: "Chile" },
    { name: "Palestino", short: "PAL", pCol: "bg-red-600", sCol: "text-green-700", stadium: "La Cisterna", rep: 6400, country: "Chile" },
    // Uruguay
    { name: "Defensor Sp.", short: "DEF", pCol: "bg-purple-700", sCol: "text-white", stadium: "Luis Franzini", rep: 6900, country: "Uruguay" },
    { name: "Danubio", short: "DAN", pCol: "bg-white", sCol: "text-black", stadium: "Jardines del Hipódromo", rep: 6800, country: "Uruguay" },
    { name: "Liverpool (U)", short: "LIV", pCol: "bg-blue-900", sCol: "text-black", stadium: "Belvedere", rep: 6600, country: "Uruguay" },
    // Colombia
    { name: "Ind. Medellín", short: "DIM", pCol: "bg-red-600", sCol: "text-blue-800", stadium: "Atanasio Girardot", rep: 7200, country: "Colombia" },
    { name: "América Cali", short: "AME", pCol: "bg-red-600", sCol: "text-white", stadium: "Pascual Guerrero", rep: 7300, country: "Colombia" },
    { name: "Dep. Cali", short: "CAL", pCol: "bg-green-700", sCol: "text-white", stadium: "Palmaseca", rep: 7100, country: "Colombia" },
    { name: "Santa Fe", short: "SFE", pCol: "bg-red-600", sCol: "text-white", stadium: "El Campín", rep: 7000, country: "Colombia" },
    // Paraguay
    { name: "Guaraní", short: "GUA", pCol: "bg-yellow-400", sCol: "text-black", stadium: "Rogelio Livieres", rep: 6800, country: "Paraguay" },
    { name: "Nacional (P)", short: "NAC", pCol: "bg-white", sCol: "text-blue-800", stadium: "Arsenio Erico", rep: 6500, country: "Paraguay" },
    // Ecuador
    { name: "Emelec", short: "EME", pCol: "bg-blue-700", sCol: "text-slate-400", stadium: "George Capwell", rep: 7400, country: "Ecuador" },
    { name: "El Nacional", short: "ELN", pCol: "bg-red-600", sCol: "text-blue-500", stadium: "Atahualpa", rep: 6700, country: "Ecuador" },
    // Peru
    { name: "Melgar", short: "MEL", pCol: "bg-red-700", sCol: "text-black", stadium: "UNSA", rep: 6900, country: "Perú" },
    { name: "Cienciano", short: "CIE", pCol: "bg-red-600", sCol: "text-white", stadium: "Garcilaso", rep: 6600, country: "Perú" },
    // Bolivia
    { name: "Wilstermann", short: "WIL", pCol: "bg-red-600", sCol: "text-blue-800", stadium: "Félix Capriles", rep: 6400, country: "Bolivia" },
    { name: "Oriente P.", short: "ORI", pCol: "bg-green-600", sCol: "text-white", stadium: "Tahuichi", rep: 6300, country: "Bolivia" }
];

export const WORLD_BOSSES: RealClubDef[] = [
   { name: "Real Madrid", short: "RMD", pCol: "bg-white", sCol: "text-slate-900", stadium: "Santiago Bernabéu", rep: 9800, country: "España" },
   { name: "Man Blue", short: "MCI", pCol: "bg-sky-400", sCol: "text-white", stadium: "Etihad", rep: 9700, country: "Inglaterra" },
   { name: "Bayern Munchen", short: "BAY", pCol: "bg-red-700", sCol: "text-white", stadium: "Allianz Arena", rep: 9600, country: "Alemania" }
];

export const BRA_SERIE_A: RealClubDef[] = [
    { name: "Palmeiras", short: "PAL", pCol: "bg-green-700", sCol: "text-white", stadium: "Allianz Parque", rep: 9200, country: "Brasil" },
    { name: "Flamengo", short: "FLA", pCol: "bg-red-700", sCol: "text-black", stadium: "Maracanã", rep: 9300, country: "Brasil" },
    { name: "São Paulo", short: "SAO", pCol: "bg-white", sCol: "text-red-600", stadium: "Morumbi", rep: 9000, country: "Brasil" },
    { name: "Corinthians", short: "COR", pCol: "bg-white", sCol: "text-black", stadium: "Neo Química Arena", rep: 8900, country: "Brasil" },
    { name: "Grêmio", short: "GRE", pCol: "bg-sky-500", sCol: "text-black", stadium: "Arena do Grêmio", rep: 8700, country: "Brasil" },
    { name: "Internacional", short: "INT", pCol: "bg-red-600", sCol: "text-white", stadium: "Beira-Rio", rep: 8700, country: "Brasil" },
    { name: "Fluminense", short: "FLU", pCol: "bg-red-800", sCol: "text-green-700", stadium: "Maracanã", rep: 8600, country: "Brasil" },
    { name: "Atlético Mineiro", short: "CAM", pCol: "bg-black", sCol: "text-white", stadium: "Arena MRV", rep: 8800, country: "Brasil" },
    { name: "Botafogo", short: "BOT", pCol: "bg-black", sCol: "text-white", stadium: "Nilton Santos", rep: 8500, country: "Brasil" },
    { name: "Santos", short: "SAN", pCol: "bg-white", sCol: "text-black", stadium: "Vila Belmiro", rep: 8800, country: "Brasil" },
    { name: "Athletico PR", short: "CAP", pCol: "bg-red-700", sCol: "text-black", stadium: "Ligga Arena", rep: 8400, country: "Brasil" },
    { name: "Cruzeiro", short: "CRU", pCol: "bg-blue-700", sCol: "text-white", stadium: "Mineirão", rep: 8200, country: "Brasil" },
    { name: "Fortaleza", short: "FOR", pCol: "bg-blue-700", sCol: "text-red-600", stadium: "Castelão", rep: 8300, country: "Brasil" },
    { name: "Bahia", short: "BAH", pCol: "bg-blue-600", sCol: "text-red-600", stadium: "Fonte Nova", rep: 7900, country: "Brasil" },
    { name: "Vasco da Gama", short: "VAS", pCol: "bg-white", sCol: "text-black", stadium: "São Januário", rep: 8100, country: "Brasil" },
    { name: "Criciúma", short: "CRI", pCol: "bg-black", sCol: "text-yellow-400", stadium: "Heriberto Hülse", rep: 7200, country: "Brasil" },
    { name: "Juventude", short: "JUV", pCol: "bg-green-700", sCol: "text-white", stadium: "Alfredo Jaconi", rep: 7000, country: "Brasil" },
    { name: "Vitória", short: "VIT", pCol: "bg-red-800", sCol: "text-white", stadium: "Barradão", rep: 7100, country: "Brasil" },
    { name: "Coritiba", short: "CFC", pCol: "bg-green-800", sCol: "text-white", stadium: "Couto Pereira", rep: 6800, country: "Brasil" },
    { name: "Goiás", short: "GOI", pCol: "bg-green-800", sCol: "text-white", stadium: "Serrinha", rep: 6700, country: "Brasil" }
];

export const BRA_SERIE_B: RealClubDef[] = [
    { name: "Ponte Preta", short: "PON", pCol: "bg-black", sCol: "text-white", stadium: "Moisés Lucarelli", rep: 6600, country: "Brasil" },
    { name: "Sport Recife", short: "SPO", pCol: "bg-red-800", sCol: "text-yellow-400", stadium: "Ilha do Retiro", rep: 6400, country: "Brasil" },
    { name: "Ceará", short: "CEA", pCol: "bg-black", sCol: "text-white", stadium: "Castelão", rep: 6300, country: "Brasil" },
    { name: "Mirassol", short: "MIR", pCol: "bg-yellow-400", sCol: "text-green-900", stadium: "José Maria de Campos Maia", rep: 6100, country: "Brasil" },
    { name: "Atlético GO", short: "ATL", pCol: "bg-red-700", sCol: "text-white", stadium: "Antônio Accioly", rep: 6200, country: "Brasil" },
    { name: "Avaí", short: "AVA", pCol: "bg-sky-400", sCol: "text-white", stadium: "Ressacada", rep: 5900, country: "Brasil" },
    { name: "Guarani", short: "GUA", pCol: "bg-green-800", sCol: "text-white", stadium: "Brinco de Ouro", rep: 5800, country: "Brasil" },
    { name: "CRB", short: "CRB", pCol: "bg-red-800", sCol: "text-white", stadium: "Rei Pelé", rep: 5600, country: "Brasil" },
    { name: "Sampaio Corrêa", short: "SAM", pCol: "bg-red-700", sCol: "text-white", stadium: "Castelão", rep: 5500, country: "Brasil" },
    { name: "Chapecoense", short: "CHA", pCol: "bg-green-800", sCol: "text-white", stadium: "Arena Condá", rep: 5400, country: "Brasil" }
];

export const ESP_LA_LIGA: RealClubDef[] = [
    { name: "Real Madrid", short: "RMA", pCol: "bg-white", sCol: "text-slate-900", stadium: "Santiago Bernabéu", rep: 9800, country: "España" },
    { name: "Barcelona", short: "FCB", pCol: "bg-red-700", sCol: "text-blue-900", stadium: "Spotify Camp Nou", rep: 9700, country: "España" },
    { name: "Atlético de Madrid", short: "ATM", pCol: "bg-red-700", sCol: "text-white", stadium: "Metropolitano", rep: 9200, country: "España" },
    { name: "Athletic Club", short: "ATH", pCol: "bg-red-700", sCol: "text-white", stadium: "San Mamés", rep: 8100, country: "España" },
    { name: "Real Sociedad", short: "RSO", pCol: "bg-blue-900", sCol: "text-white", stadium: "Reale Arena", rep: 8000, country: "España" },
    { name: "Valencia", short: "VAL", pCol: "bg-white", sCol: "text-black", stadium: "Mestalla", rep: 8200, country: "España" },
    { name: "Villarreal", short: "VIL", pCol: "bg-yellow-400", sCol: "text-slate-900", stadium: "Cerámica", rep: 8300, country: "España" },
    { name: "Real Betis", short: "BET", pCol: "bg-green-800", sCol: "text-white", stadium: "Benito Villamarín", rep: 7900, country: "España" },
    { name: "Sevilla", short: "SEV", pCol: "bg-white", sCol: "text-red-600", stadium: "Ramón Sánchez Pizjuán", rep: 8400, country: "España" },
    { name: "Osasuna", short: "OSA", pCol: "bg-red-800", sCol: "text-white", stadium: "El Sadar", rep: 7200, country: "España" },
    { name: "Celta", short: "CEL", pCol: "bg-sky-400", sCol: "text-white", stadium: "Balaídos", rep: 7400, country: "España" },
    { name: "Mallorca", short: "MAL", pCol: "bg-red-800", sCol: "text-white", stadium: "Son Moix", rep: 7000, country: "España" },
    { name: "Getafe", short: "GET", pCol: "bg-blue-900", sCol: "text-white", stadium: "Coliseum", rep: 6900, country: "España" },
    { name: "Alavés", short: "ALA", pCol: "bg-blue-900", sCol: "text-white", stadium: "Mendizorrotza", rep: 6800, country: "España" },
    { name: "Espanyol", short: "ESP", pCol: "bg-sky-400", sCol: "text-blue-900", stadium: "RCDE", rep: 7100, country: "España" },
    { name: "Rayo Vallecano", short: "RAY", pCol: "bg-white", sCol: "text-red-700", stadium: "Vallecas", rep: 6700, country: "España" },
    { name: "Leganés", short: "LEG", pCol: "bg-green-800", sCol: "text-white", stadium: "Butarque", rep: 6500, country: "España" },
    { name: "Girona", short: "GIR", pCol: "bg-red-800", sCol: "text-white", stadium: "Montilivi", rep: 7800, country: "España" },
    { name: "Las Palmas", short: "LPA", pCol: "bg-yellow-400", sCol: "text-blue-900", stadium: "Gran Canaria", rep: 6600, country: "España" },
    { name: "Valladolid", short: "VLD", pCol: "bg-purple-800", sCol: "text-white", stadium: "Zorrilla", rep: 6200, country: "España" }
];

export const ITA_SERIE_A: RealClubDef[] = [
    { name: "Inter de Milán", short: "INT", pCol: "bg-sky-400", sCol: "text-black", stadium: "Giuseppe Meazza", rep: 9400, country: "Italia" },
    { name: "Juventus", short: "JUV", pCol: "bg-white", sCol: "text-black", stadium: "Allianz Stadium", rep: 9000, country: "Italia" },
    { name: "AC Milan", short: "MIL", pCol: "bg-red-800", sCol: "text-white", stadium: "San Siro", rep: 9300, country: "Italia" },
    { name: "Napoli", short: "NAP", pCol: "bg-sky-400", sCol: "text-blue-900", stadium: "Diego Armando Maradona", rep: 8600, country: "Italia" },
    { name: "Roma", short: "ROM", pCol: "bg-red-800", sCol: "text-white", stadium: "Olímpico", rep: 8200, country: "Italia" },
    { name: "Lazio", short: "LAZ", pCol: "bg-sky-400", sCol: "text-white", stadium: "Olímpico", rep: 8000, country: "Italia" },
    { name: "Atalanta", short: "ATA", pCol: "bg-blue-900", sCol: "text-white", stadium: "Gewiss", rep: 7900, country: "Italia" },
    { name: "Fiorentina", short: "FIO", pCol: "bg-purple-800", sCol: "text-white", stadium: "Artemio Franchi", rep: 7800, country: "Italia" },
    { name: "Bologna", short: "BOL", pCol: "bg-red-800", sCol: "text-white", stadium: "Renato Dall'Ara", rep: 7600, country: "Italia" },
    { name: "Torino", short: "TOR", pCol: "bg-maroon-700", sCol: "text-white", stadium: "Giuseppe Meazza", rep: 7200, country: "Italia" },
    { name: "Monza", short: "MON", pCol: "bg-red-800", sCol: "text-white", stadium: "Brianteo", rep: 7000, country: "Italia" },
    { name: "Lecce", short: "LEC", pCol: "bg-yellow-400", sCol: "text-red-800", stadium: "Via del Mare", rep: 6500, country: "Italia" },
    { name: "Udinese", short: "UDI", pCol: "bg-black", sCol: "text-white", stadium: "Friuli", rep: 7300, country: "Italia" },
    { name: "Hellas Verona", short: "VER", pCol: "bg-yellow-400", sCol: "text-blue-900", stadium: "Marcantonio Bentegodi", rep: 6600, country: "Italia" },
    { name: "Cagliari", short: "CAG", pCol: "bg-red-800", sCol: "text-white", stadium: "Unipol Domus", rep: 6700, country: "Italia" },
    { name: "Empoli", short: "EMP", pCol: "bg-sky-400", sCol: "text-blue-900", stadium: "Castellani", rep: 6800, country: "Italia" },
    { name: "Parma", short: "PAR", pCol: "bg-yellow-400", sCol: "text-black", stadium: "Ennio Tardini", rep: 6800, country: "Italia" },
    { name: "Como", short: "COM", pCol: "bg-sky-400", sCol: "text-blue-900", stadium: "Sinigaglia", rep: 6900, country: "Italia" },
    { name: "Venezia", short: "VEN", pCol: "bg-orange-600", sCol: "text-black", stadium: "Pier Luigi Penzo", rep: 6300, country: "Italia" },
    { name: "Genoa", short: "GEN", pCol: "bg-red-800", sCol: "text-white", stadium: "Luigi Ferraris", rep: 7000, country: "Italia" }
];

export const DEU_BUNDESLIGA: RealClubDef[] = [
    { name: "Bayern Munchen", short: "BAY", pCol: "bg-red-700", sCol: "text-white", stadium: "Allianz Arena", rep: 9600, country: "Alemania" },
    { name: "B. Dortmund", short: "BVB", pCol: "bg-yellow-400", sCol: "text-black", stadium: "Signal Iduna Park", rep: 9400, country: "Alemania" },
    { name: "RB Leipzig", short: "RBL", pCol: "bg-red-800", sCol: "text-white", stadium: "Red Bull Arena", rep: 8800, country: "Alemania" },
    { name: "B. Leverkusen", short: "B04", pCol: "bg-red-800", sCol: "text-white", stadium: "BayArena", rep: 8900, country: "Alemania" },
    { name: "VfB Stuttgart", short: "VFB", pCol: "bg-red-800", sCol: "text-white", stadium: "MHPArena", rep: 8100, country: "Alemania" },
    { name: "Eintracht Frankfurt", short: "SGE", pCol: "bg-red-800", sCol: "text-white", stadium: "Deutsche Bank Park", rep: 8300, country: "Alemania" },
    { name: "Wolfsburg", short: "WOB", pCol: "bg-green-800", sCol: "text-white", stadium: "Volkswagen Arena", rep: 7800, country: "Alemania" },
    { name: "Freiburg", short: "SCF", pCol: "bg-red-800", sCol: "text-white", stadium: "Europa-Park Stadion", rep: 7600, country: "Alemania" },
    { name: "B. Mgladbach", short: "BMG", pCol: "bg-red-900", sCol: "text-white", stadium: "Borussia-Park", rep: 7700, country: "Alemania" },
    { name: "Bremen", short: "SVW", pCol: "bg-green-900", sCol: "text-white", stadium: "Weser-Stadion", rep: 7200, country: "Alemania" },
    { name: "Augsburg", short: "FCA", pCol: "bg-red-800", sCol: "text-white", stadium: "WWK Arena", rep: 6900, country: "Alemania" },
    { name: "Hoffenheim", short: "TSG", pCol: "bg-blue-900", sCol: "text-white", stadium: "PreZero Arena", rep: 7400, country: "Alemania" },
    { name: "St. Pauli", short: "STP", pCol: "bg-brown-600", sCol: "text-white", stadium: "Millerntor", rep: 6800, country: "Alemania" },
    { name: "Union Berlin", short: "FCU", pCol: "bg-red-800", sCol: "text-white", stadium: "Stadion An der Alten Försterei", rep: 7600, country: "Alemania" },
    { name: "Heidenheim", short: "FCH", pCol: "bg-blue-900", sCol: "text-white", stadium: "Voith-Arena", rep: 6500, country: "Alemania" },
    { name: "Holstein Kiel", short: "KSV", pCol: "bg-blue-900", sCol: "text-white", stadium: "Holstein-Stadion", rep: 5900, country: "Alemania" },
    { name: "Bochum", short: "VFL", pCol: "bg-blue-900", sCol: "text-white", stadium: "Vonovia Ruhrstadion", rep: 6200, country: "Alemania" },
    { name: "Mainz 05", short: "M05", pCol: "bg-red-800", sCol: "text-white", stadium: "Mewa Arena", rep: 7100, country: "Alemania" }
];

export const FRA_LIGUE_1: RealClubDef[] = [
    { name: "PSG", short: "PSG", pCol: "bg-blue-900", sCol: "text-white", stadium: "Parc des Princes", rep: 9500, country: "Francia" },
    { name: "Monaco", short: "ASM", pCol: "bg-red-800", sCol: "text-white", stadium: "Louis II", rep: 8800, country: "Francia" },
    { name: "Marsella", short: "OLM", pCol: "bg-sky-400", sCol: "text-blue-900", stadium: "Vélodrome", rep: 8700, country: "Francia" },
    { name: "Lyon", short: "OL", pCol: "bg-blue-900", sCol: "text-white", stadium: "Groupama Stadium", rep: 8500, country: "Francia" },
    { name: "Lille", short: "LOSC", pCol: "bg-red-800", sCol: "text-white", stadium: "Pierre Mauroy", rep: 8000, country: "Francia" },
    { name: "Niza", short: "OGCN", pCol: "bg-red-800", sCol: "text-white", stadium: "Allianz Riviera", rep: 7900, country: "Francia" },
    { name: "Lens", short: "RCL", pCol: "bg-red-800", sCol: "text-yellow-400", stadium: "Bollaert-Delelis", rep: 7600, country: "Francia" },
    { name: "Rennes", short: "SRFC", pCol: "bg-red-800", sCol: "text-white", stadium: "Roazhon", rep: 7700, country: "Francia" },
    { name: "Reims", short: "SDR", pCol: "bg-red-800", sCol: "text-white", stadium: "Auguste Delaune", rep: 7100, country: "Francia" },
    { name: "Toulouse", short: "TFC", pCol: "bg-red-800", sCol: "text-white", stadium: "Stadium de Toulouse", rep: 6900, country: "Francia" },
    { name: "Estrasburgo", short: "RCS", pCol: "bg-red-800", sCol: "text-white", stadium: "Meinau", rep: 7000, country: "Francia" },
    { name: "Nantes", short: "FCN", pCol: "bg-yellow-400", sCol: "text-green-900", stadium: "Beaujoire", rep: 7200, country: "Francia" },
    { name: "Auxerre", short: "AJ Auxerre", pCol: "bg-blue-900", sCol: "text-white", stadium: "Abbé Deschamps", rep: 6400, country: "Francia" },
    { name: "Montpellier", short: "MHSC", pCol: "bg-orange-600", sCol: "text-white", stadium: "Mosson", rep: 6800, country: "Francia" },
    { name: "Le Havre", short: "HAC", pCol: "bg-sky-400", sCol: "text-blue-900", stadium: "Océane", rep: 5800, country: "Francia" },
    { name: "Saint-Étienne", short: "ASSE", pCol: "bg-green-800", sCol: "text-white", stadium: "Geoffroy-Guichard", rep: 7300, country: "Francia" },
    { name: "Angers", short: "SCO", pCol: "bg-red-800", sCol: "text-white", stadium: "Raymond Kopa", rep: 6100, country: "Francia" }
];

export const PRT_LIGA: RealClubDef[] = [
    { name: "Benfica", short: "SLB", pCol: "bg-red-800", sCol: "text-white", stadium: "Luz", rep: 9100, country: "Portugal" },
    { name: "Porto", short: "FCP", pCol: "bg-blue-900", sCol: "text-white", stadium: "Dragão", rep: 9000, country: "Portugal" },
    { name: "Sporting CP", short: "SCP", pCol: "bg-green-800", sCol: "text-white", stadium: "José Alvalade", rep: 8800, country: "Portugal" },
    { name: "Braga", short: "SCB", pCol: "bg-red-800", sCol: "text-white", stadium: "Municipal", rep: 7800, country: "Portugal" },
    { name: "Vitória SC", short: "VSC", pCol: "bg-white", sCol: "text-black", stadium: "D. Afonso Henriques", rep: 7200, country: "Portugal" },
    { name: "Gil Vicente", short: "GIL", pCol: "bg-red-800", sCol: "text-white", stadium: "Cidade de Barcelos", rep: 6400, country: "Portugal" },
    { name: "Famalicão", short: "FAM", pCol: "bg-black", sCol: "text-white", stadium: "Municipal 22 de Junho", rep: 6200, country: "Portugal" },
    { name: "Arouca", short: "ARO", pCol: "bg-blue-900", sCol: "text-white", stadium: "Municipal", rep: 6100, country: "Portugal" },
    { name: "Rio Ave", short: "RAV", pCol: "bg-green-900", sCol: "text-white", stadium: "Dos Arcos", rep: 6000, country: "Portugal" },
    { name: "Estoril", short: "EST", pCol: "bg-sky-400", sCol: "text-blue-900", stadium: "António Coimbra da Mota", rep: 5900, country: "Portugal" },
    { name: "Moreirense", short: "MOR", pCol: "bg-green-900", sCol: "text-white", stadium: "João Campos", rep: 5600, country: "Portugal" },
    { name: "Boavista", short: "BOA", pCol: "bg-black", sCol: "text-white", stadium: "Bessa Século XXI", rep: 5800, country: "Portugal" },
    { name: "Portimonense", short: "POR", pCol: "bg-black", sCol: "text-white", stadium: "Municipal", rep: 5700, country: "Portugal" },
    { name: "Casa Pia", short: "CPI", pCol: "bg-gray-800", sCol: "text-white", stadium: "Municipal de Rio Maior", rep: 5300, country: "Portugal" },
    { name: "Estrela da Amadora", short: "EST", pCol: "bg-red-800", sCol: "text-white", stadium: "José Gomes", rep: 5400, country: "Portugal" },
    { name: "AVS", short: "AVS", pCol: "bg-green-900", sCol: "text-white", stadium: "Cidade de Barcelos", rep: 5100, country: "Portugal" },
    { name: "Farense", short: "FAR", pCol: "bg-black", sCol: "text-white", stadium: "São Luís", rep: 5500, country: "Portugal" }
];

export const NLD_EREDIVISIE: RealClubDef[] = [
    { name: "Ajax", short: "AJX", pCol: "bg-red-800", sCol: "text-white", stadium: "Johan Cruijff Arena", rep: 9200, country: "Países Bajos" },
    { name: "PSV", short: "PSV", pCol: "bg-red-800", sCol: "text-white", stadium: "Philips Stadion", rep: 9000, country: "Países Bajos" },
    { name: "Feyenoord", short: "FEY", pCol: "bg-red-800", sCol: "text-white", stadium: "De Kuip", rep: 8900, country: "Países Bajos" },
    { name: "AZ Alkmaar", short: "AZ", pCol: "bg-red-800", sCol: "text-white", stadium: "AFAS Stadion", rep: 7800, country: "Países Bajos" },
    { name: "FC Twente", short: "TWE", pCol: "bg-red-800", sCol: "text-white", stadium: "De Grolsch Veste", rep: 7400, country: "Países Bajos" },
    { name: "FC Utrecht", short: "UTR", pCol: "bg-red-800", sCol: "text-white", stadium: "Stadion Galgenwaard", rep: 7000, country: "Países Bajos" },
    { name: "Vitesse", short: "VIT", pCol: "bg-yellow-400", sCol: "text-black", stadium: "GelreDome", rep: 6900, country: "Países Bajos" },
    { name: "NEC Nijmegen", short: "NEC", pCol: "bg-red-800", sCol: "text-white", stadium: "Goffertstadion", rep: 6800, country: "Países Bajos" },
    { name: "Heerenveen", short: "HEE", pCol: "bg-blue-900", sCol: "text-white", stadium: "Abe Lenstra Stadion", rep: 6700, country: "Países Bajos" },
    { name: "Sparta Rotterdam", short: "SPA", pCol: "bg-red-800", sCol: "text-white", stadium: "Het Kasteel", rep: 6600, country: "Países Bajos" },
    { name: "PEC Zwolle", short: "PEC", pCol: "bg-blue-900", sCol: "text-white", stadium: "MAC³PARK Stadion", rep: 6200, country: "Países Bajos" },
    { name: "Fortuna Sittard", short: "FOR", pCol: "bg-red-800", sCol: "text-white", stadium: "Fortuna Sittard Stadion", rep: 5600, country: "Países Bajos" },
    { name: "Go Ahead Eagles", short: "GAE", pCol: "bg-blue-900", sCol: "text-white", stadium: "De Adelaarshorst", rep: 5900, country: "Países Bajos" },
    { name: "Almere City", short: "ALM", pCol: "bg-blue-900", sCol: "text-white", stadium: "Yanmar Stadion", rep: 5200, country: "Países Bajos" },
    { name: "NAC Breda", short: "NAC", pCol: "bg-yellow-400", sCol: "text-black", stadium: "Rat Verlegh Stadion", rep: 5300, country: "Países Bajos" },
    { name: "Willem II", short: "WIL", pCol: "bg-red-800", sCol: "text-white", stadium: "Koning Willem II Stadion", rep: 5300, country: "Países Bajos" },
    { name: "Heracles Almelo", short: "HER", pCol: "bg-black", sCol: "text-white", stadium: "Erve Asito", rep: 5400, country: "Países Bajos" }
];

export const MEX_LIGA_MX: RealClubDef[] = [
    { name: "América", short: "AME", pCol: "bg-yellow-400", sCol: "text-blue-900", stadium: "Azteca", rep: 9400, country: "México" },
    { name: "Chivas", short: "CHI", pCol: "bg-red-800", sCol: "text-white", stadium: "Akron", rep: 9000, country: "México" },
    { name: "Pumas", short: "PUM", pCol: "bg-blue-900", sCol: "text-white", stadium: "Olímpico Universitario", rep: 8400, country: "México" },
    { name: "Monterrey", short: "MTY", pCol: "bg-blue-900", sCol: "text-white", stadium: "BBVA", rep: 8700, country: "México" },
    { name: "Tigres", short: "TIG", pCol: "bg-yellow-400", sCol: "text-red-800", stadium: "Universitario", rep: 8600, country: "México" },
    { name: "Cruz Azul", short: "CAZ", pCol: "bg-sky-400", sCol: "text-blue-900", stadium: "Azul", rep: 8500, country: "México" },
    { name: "Santos", short: "SAN", pCol: "bg-red-800", sCol: "text-white", stadium: "Corona TSM", rep: 7800, country: "México" },
    { name: "Toluca", short: "TOL", pCol: "bg-red-800", sCol: "text-white", stadium: "Nemesio Díez", rep: 7700, country: "México" },
    { name: "León", short: "LEO", pCol: "bg-green-800", sCol: "text-yellow-400", stadium: "Nou Camp", rep: 7600, country: "México" },
    { name: "Tijuana", short: "TIJ", pCol: "bg-red-800", sCol: "text-white", stadium: "Caliente", rep: 7200, country: "México" },
    { name: "Pachuca", short: "PAC", pCol: "bg-white", sCol: "text-black", stadium: "Hidalgo", rep: 7500, country: "México" },
    { name: "Necaxa", short: "NEC", pCol: "bg-red-800", sCol: "text-white", stadium: "Victoria", rep: 6800, country: "México" },
    { name: "Atlas", short: "ATL", pCol: "bg-red-800", sCol: "text-white", stadium: "Jalisco", rep: 7400, country: "México" },
    { name: "Querétaro", short: "QUE", pCol: "bg-blue-900", sCol: "text-white", stadium: "Corregidora", rep: 6200, country: "México" },
    { name: "Juárez", short: "JUA", pCol: "bg-black", sCol: "text-white", stadium: "Olimpico Benito Juárez", rep: 6100, country: "México" },
    { name: "Mazatlán", short: "MAZ", pCol: "bg-purple-800", sCol: "text-white", stadium: "El Encanto", rep: 5600, country: "México" },
    { name: "San Luis", short: "ASL", pCol: "bg-yellow-400", sCol: "text-green-900", stadium: "Alfonso Lastras", rep: 5700, country: "México" },
    { name: "Puebla", short: "PUE", pCol: "bg-blue-900", sCol: "text-white", stadium: "Cuauhtémoc", rep: 6500, country: "México" }
];

export const USA_MLS: RealClubDef[] = [
    { name: "Inter Miami", short: "MIA", pCol: "bg-pink-600", sCol: "text-white", stadium: "DRV PNK Stadium", rep: 9200, country: "USA" },
    { name: "LA Galaxy", short: "LAG", pCol: "bg-white", sCol: "text-blue-900", stadium: "Dignity Health Sports Park", rep: 8800, country: "USA" },
    { name: "NY Red Bulls", short: "NYRB", pCol: "bg-red-800", sCol: "text-white", stadium: "Red Bull Arena", rep: 8200, country: "USA" },
    { name: "Seattle Sounders", short: "SEA", pCol: "bg-green-800", sCol: "text-white", stadium: "Lumen Field", rep: 8300, country: "USA" },
    { name: "Atanta United", short: "ATL", pCol: "bg-red-800", sCol: "text-white", stadium: "Mercedes-Benz Stadium", rep: 8400, country: "USA" },
    { name: "LAFC", short: "LAFC", pCol: "bg-black", sCol: "text-white", stadium: "BMO Stadium", rep: 8500, country: "USA" },
    { name: "DC United", short: "DCU", pCol: "bg-red-800", sCol: "text-white", stadium: "Audi Field", rep: 7600, country: "USA" },
    { name: "Orlando City", short: "ORL", pCol: "bg-purple-800", sCol: "text-white", stadium: "Exploria Stadium", rep: 7400, country: "USA" },
    { name: "FC Cincinnati", short: "CIN", pCol: "bg-blue-900", sCol: "text-white", stadium: "TQL Stadium", rep: 7200, country: "USA" },
    { name: "Houston Dynamo", short: "HOU", pCol: "bg-orange-600", sCol: "text-white", stadium: "Shell Energy Stadium", rep: 7300, country: "USA" },
    { name: "Colorado Rapids", short: "COL", pCol: "bg-red-800", sCol: "text-white", stadium: "Dick's Sporting Goods", rep: 6800, country: "USA" },
    { name: "Portland Timbers", short: "POR", pCol: "bg-green-800", sCol: "text-white", stadium: "Providence Park", rep: 7800, country: "USA" },
    { name: "Real Salt Lake", short: "RSL", pCol: "bg-red-800", sCol: "text-white", stadium: "America First Field", rep: 7100, country: "USA" },
    { name: "New England Revolution", short: "NER", pCol: "bg-red-800", sCol: "text-white", stadium: "Gillette Stadium", rep: 7000, country: "USA" },
    { name: "Philadelphia Union", short: "PHI", pCol: "bg-yellow-400", sCol: "text-blue-900", stadium: "Subaru Park", rep: 7400, country: "USA" },
    { name: "Charlotte FC", short: "CLT", pCol: "bg-blue-900", sCol: "text-white", stadium: "Bank of America Stadium", rep: 7200, country: "USA" },
    { name: "Nashville SC", short: "NSH", pCol: "bg-yellow-400", sCol: "text-blue-900", stadium: "Geodis Park", rep: 7600, country: "USA" },
    { name: "CF Montréal", short: "MTL", pCol: "bg-blue-900", sCol: "text-white", stadium: "Saputo Stadium", rep: 6900, country: "USA" },
    { name: "Vancouver Whitecaps", short: "VAN", pCol: "bg-blue-900", sCol: "text-white", stadium: "BC Place", rep: 7100, country: "USA" },
    { name: "Sporting Kansas City", short: "SKC", pCol: "bg-sky-400", sCol: "text-white", stadium: "Children's Mercy Park", rep: 7000, country: "USA" }
];

export const JPN_J1: RealClubDef[] = [
    { name: "Yokohama F.Marinos", short: "YFM", pCol: "bg-blue-900", sCol: "text-white", stadium: "Nissan Stadium", rep: 8600, country: "Japón" },
    { name: "Kawasaki Frontale", short: "KWF", pCol: "bg-red-800", sCol: "text-white", stadium: "Kawasaki Todoroki", rep: 8400, country: "Japón" },
    { name: "Vissel Kobe", short: "VIS", pCol: "bg-red-800", sCol: "text-white", stadium: "Noevir Stadium", rep: 8100, country: "Japón" },
    { name: "Cerezo Osaka", short: "CER", pCol: "bg-pink-600", sCol: "text-white", stadium: "Yodoko Sakura", rep: 7800, country: "Japón" },
    { name: "Kashima Antlers", short: "KAS", pCol: "bg-red-800", sCol: "text-white", stadium: "Kashima Soccer Stadium", rep: 8200, country: "Japón" },
    { name: "FC Tokyo", short: "FCT", pCol: "bg-red-800", sCol: "text-white", stadium: "Ajinomoto Stadium", rep: 8000, country: "Japón" },
    { name: "Urawa Reds", short: "URA", pCol: "bg-red-800", sCol: "text-white", stadium: "Saitama Stadium", rep: 8300, country: "Japón" },
    { name: "Sanfrecce Hiroshima", short: "SAN", pCol: "bg-purple-800", sCol: "text-white", stadium: "Edion Stadium", rep: 7700, country: "Japón" },
    { name: "Shonan Bellmare", short: "SHO", pCol: "bg-green-800", sCol: "text-white", stadium: "Hiratsuka", rep: 6900, country: "Japón" },
    { name: "Kofu", short: "VKO", pCol: "bg-blue-900", sCol: "text-white", stadium: "Yamanashi Chuo Bank", rep: 6400, country: "Japón" },
    { name: "Kyoto Sanga", short: "KYO", pCol: "bg-purple-800", sCol: "text-white", stadium: "Sanga Stadium", rep: 6700, country: "Japón" },
    { name: "Gamba Osaka", short: "GAM", pCol: "bg-blue-900", sCol: "text-white", stadium: "Panasonic Stadium", rep: 7500, country: "Japón" },
    { name: "Nagoya Grampus", short: "NAG", pCol: "bg-red-800", sCol: "text-white", stadium: "Toyota Stadium", rep: 7600, country: "Japón" },
    { name: "Sagan Tosu", short: "SAG", pCol: "bg-red-800", sCol: "text-white", stadium: "Ekimae Real Estate", rep: 6800, country: "Japón" },
    { name: "Avispa Fukuoka", short: "AVI", pCol: "bg-black", sCol: "text-white", stadium: "Best Denki Stadium", rep: 6600, country: "Japón" },
    { name: "Hokkaido Consadole", short: "CON", pCol: "bg-red-800", sCol: "text-white", stadium: "Diamond Hokkaido", rep: 7000, country: "Japón" },
    { name: "Albirex Niigata", short: "ALB", pCol: "bg-orange-600", sCol: "text-white", stadium: "Denka Big Swan", rep: 7200, country: "Japón" },
    { name: "Machida Zelvia", short: "MAC", pCol: "bg-green-900", sCol: "text-white", stadium: "Machida GION Stadium", rep: 6200, country: "Japón" }
];

export const ENG_PREMIER: RealClubDef[] = [
    { name: "Man City", short: "MCI", pCol: "bg-sky-400", sCol: "text-white", stadium: "Etihad", rep: 9900, country: "Inglaterra" },
    { name: "Arsenal", short: "ARS", pCol: "bg-red-800", sCol: "text-white", stadium: "Emirates", rep: 9400, country: "Inglaterra" },
    { name: "Liverpool", short: "LIV", pCol: "bg-red-800", sCol: "text-white", stadium: "Anfield", rep: 9500, country: "Inglaterra" },
    { name: "Man United", short: "MUN", pCol: "bg-red-800", sCol: "text-white", stadium: "Old Trafford", rep: 9300, country: "Inglaterra" },
    { name: "Chelsea", short: "CHE", pCol: "bg-blue-900", sCol: "text-white", stadium: "Stamford Bridge", rep: 9200, country: "Inglaterra" },
    { name: "Tottenham", short: "TOT", pCol: "bg-white", sCol: "text-blue-900", stadium: "Tottenham Hotspur Stadium", rep: 8800, country: "Inglaterra" },
    { name: "Newcastle", short: "NEW", pCol: "bg-black", sCol: "text-white", stadium: "St James' Park", rep: 8700, country: "Inglaterra" },
    { name: "Aston Villa", short: "AVL", pCol: "bg-purple-900", sCol: "text-white", stadium: "Villa Park", rep: 8300, country: "Inglaterra" },
    { name: "Brighton", short: "BHA", pCol: "bg-sky-400", sCol: "text-blue-900", stadium: "Amex Stadium", rep: 8100, country: "Inglaterra" },
    { name: "West Ham", short: "WHU", pCol: "bg-purple-900", sCol: "text-white", stadium: "London Stadium", rep: 7900, country: "Inglaterra" },
    { name: "Brentford", short: "BRE", pCol: "bg-red-800", sCol: "text-white", stadium: "Gtech Community Stadium", rep: 7800, country: "Inglaterra" },
    { name: "Crystal Palace", short: "CRY", pCol: "bg-red-800", sCol: "text-blue-900", stadium: "Selhurst Park", rep: 7500, country: "Inglaterra" },
    { name: "Everton", short: "EVE", pCol: "bg-blue-900", sCol: "text-white", stadium: "Goodison Park", rep: 8000, country: "Inglaterra" },
    { name: "Wolves", short: "WOL", pCol: "bg-orange-600", sCol: "text-black", stadium: "Molineux", rep: 7300, country: "Inglaterra" },
    { name: "Bournemouth", short: "BOU", pCol: "bg-red-800", sCol: "text-white", stadium: "Vitality Stadium", rep: 7200, country: "Inglaterra" },
    { name: "Nottingham Forest", short: "NFO", pCol: "bg-red-800", sCol: "text-white", stadium: "City Ground", rep: 7400, country: "Inglaterra" },
    { name: "Fulham", short: "FUL", pCol: "bg-black", sCol: "text-white", stadium: "Craven Cottage", rep: 7600, country: "Inglaterra" },
    { name: "Ipswich Town", short: "IPS", pCol: "bg-blue-900", sCol: "text-white", stadium: "Portman Road", rep: 6700, country: "Inglaterra" },
    { name: "Southampton", short: "SOU", pCol: "bg-red-800", sCol: "text-white", stadium: "St Mary's Stadium", rep: 7100, country: "Inglaterra" },
    { name: "Leicester City", short: "LEI", pCol: "bg-blue-900", sCol: "text-white", stadium: "King Power Stadium", rep: 7600, country: "Inglaterra" }
];

export const CHI_PRIMERA: RealClubDef[] = [
    { name: "Colo-Colo", short: "COL", pCol: "bg-white", sCol: "text-black", stadium: "Monumental David Arellano", rep: 7800, country: "Chile" },
    { name: "U. de Chile", short: "UCH", pCol: "bg-blue-800", sCol: "text-white", stadium: "Nacional de Chile", rep: 7600, country: "Chile" },
    { name: "U. Católica", short: "UCA", pCol: "bg-white", sCol: "text-blue-800", stadium: "San Carlos", rep: 7400, country: "Chile" },
    { name: "Audax Italiano", short: "AUD", pCol: "bg-green-800", sCol: "text-white", stadium: "Bicentenario", rep: 6600, country: "Chile" },
    { name: "Palestino", short: "PAL", pCol: "bg-red-600", sCol: "text-green-700", stadium: "La Cisterna", rep: 6400, country: "Chile" },
    { name: "Huachipato", short: "HUA", pCol: "bg-blue-900", sCol: "text-black", stadium: "CAP", rep: 6500, country: "Chile" },
    { name: "Cobreloa", short: "COB", pCol: "bg-orange-500", sCol: "text-white", stadium: "Zorros del Desierto", rep: 6800, country: "Chile" },
    { name: "Ñublense", short: "ÑUB", pCol: "bg-red-800", sCol: "text-white", stadium: "Nelson Oyarzún", rep: 6200, country: "Chile" },
    { name: "Magallanes", short: "MAG", pCol: "bg-blue-900", sCol: "text-white", stadium: "Municipal", rep: 5900, country: "Chile" },
    { name: "Copiapó", short: "CDC", pCol: "bg-red-800", sCol: "text-white", stadium: "Luis Valenzuela Hermosilla", rep: 5800, country: "Chile" },
    { name: "Everton Viña", short: "EVE", pCol: "bg-blue-900", sCol: "text-white", stadium: "Sausalito", rep: 6100, country: "Chile" },
    { name: "Unión Española", short: "UES", pCol: "bg-red-800", sCol: "text-white", stadium: "Santa Laura", rep: 6700, country: "Chile" },
    { name: "O'Higgins", short: "OHI", pCol: "bg-white", sCol: "text-red-800", stadium: "El Teniente", rep: 6300, country: "Chile" },
    { name: "Coquimbo Unido", short: "COQ", pCol: "bg-yellow-400", sCol: "text-black", stadium: "Francisco Sánchez Rumoroso", rep: 6000, country: "Chile" },
    { name: "Cobresal", short: "COB", pCol: "bg-orange-600", sCol: "text-black", stadium: "El Cobre", rep: 5700, country: "Chile" },
    { name: "Antofagasta", short: "ANT", pCol: "bg-bg-white", sCol: "text-white", stadium: "Regional de Antofagasta", rep: 5600, country: "Chile" }
];

export const COL_LIGA: RealClubDef[] = [
    { name: "Millonarios", short: "MIL", pCol: "bg-blue-700", sCol: "text-white", stadium: "El Campín", rep: 7500, country: "Colombia" },
    { name: "Atl. Nacional", short: "ATN", pCol: "bg-green-600", sCol: "text-white", stadium: "Atanasio Girardot", rep: 7900, country: "Colombia" },
    { name: "Junior", short: "JUN", pCol: "bg-red-600", sCol: "text-white", stadium: "Metropolitano", rep: 7400, country: "Colombia" },
    { name: "América Cali", short: "AME", pCol: "bg-red-600", sCol: "text-white", stadium: "Pascual Guerrero", rep: 7300, country: "Colombia" },
    { name: "Ind. Medellín", short: "DIM", pCol: "bg-red-600", sCol: "text-blue-800", stadium: "Atanasio Girardot", rep: 7200, country: "Colombia" },
    { name: "Santa Fe", short: "SFE", pCol: "bg-red-600", sCol: "text-white", stadium: "El Campín", rep: 7000, country: "Colombia" },
    { name: "Dep. Cali", short: "CAL", pCol: "bg-green-700", sCol: "text-white", stadium: "Palmaseca", rep: 7100, country: "Colombia" },
    { name: "La Equidad", short: "EQU", pCol: "bg-green-800", sCol: "text-white", stadium: "Metropolitano de Techo", rep: 6400, country: "Colombia" },
    { name: "Once Caldas", short: "ONC", pCol: "bg-white", sCol: "text-black", stadium: "Palogrande", rep: 6500, country: "Colombia" },
    { name: "Deportes Tolima", short: "TOL", pCol: "bg-red-800", sCol: "text-white", stadium: "Manuel Murillo Toro", rep: 6700, country: "Colombia" },
    { name: "Envigado", short: "ENV", pCol: "bg-orange-600", sCol: "text-white", stadium: "Polideportivo Sur", rep: 5600, country: "Colombia" },
    { name: "Boyacá Chicó", short: "BOY", pCol: "bg-green-900", sCol: "text-white", stadium: "La Independencia", rep: 5400, country: "Colombia" },
    { name: "Alianza Petrolera", short: "ALI", pCol: "bg-yellow-400", sCol: "text-green-900", stadium: "Daniel Villa Zapata", rep: 5200, country: "Colombia" },
    { name: "Jaguares", short: "JAG", pCol: "bg-red-800", sCol: "text-white", stadium: "Jaraguay", rep: 5100, country: "Colombia" },
    { name: "Patriotas", short: "PAT", pCol: "bg-red-800", sCol: "text-white", stadium: "La Independencia", rep: 5000, country: "Colombia" },
    { name: "Deportivo Pereira", short: "PER", pCol: "bg-red-900", sCol: "text-white", stadium: "Hernán Ramírez Villegas", rep: 6000, country: "Colombia" },
    { name: "Rionegro Águilas", short: "AGU", pCol: "bg-yellow-400", sCol: "text-red-800", stadium: "Alberto Grisales", rep: 5300, country: "Colombia" },
    { name: "Atlético Bucaramanga", short: "BUC", pCol: "bg-green-900", sCol: "text-white", stadium: "Américo Montanini", rep: 5800, country: "Colombia" }
];

export const URY_PRIMERA: RealClubDef[] = [
    { name: "Peñarol", short: "PEN", pCol: "bg-yellow-400", sCol: "text-black", stadium: "Campeón del Siglo", rep: 8200, country: "Uruguay" },
    { name: "Nacional", short: "NAC", pCol: "bg-white", sCol: "text-blue-800", stadium: "Gran Parque Central", rep: 8100, country: "Uruguay" },
    { name: "Defensor Sp.", short: "DEF", pCol: "bg-purple-700", sCol: "text-white", stadium: "Luis Franzini", rep: 6900, country: "Uruguay" },
    { name: "Danubio", short: "DAN", pCol: "bg-white", sCol: "text-black", stadium: "Jardines del Hipódromo", rep: 6800, country: "Uruguay" },
    { name: "Liverpool (U)", short: "LIV", pCol: "bg-blue-900", sCol: "text-black", stadium: "Belvedere", rep: 6600, country: "Uruguay" },
    { name: "Peñarol", short: "PEN", pCol: "bg-yellow-400", sCol: "text-black", stadium: "Campeón del Siglo", rep: 8200, country: "Uruguay" },
    { name: "Fénix", short: "FEN", pCol: "bg-white", sCol: "text-purple-900", stadium: "Parque Capurro", rep: 5700, country: "Uruguay" },
    { name: "Cerro", short: "CER", pCol: "bg-blue-900", sCol: "text-white", stadium: "Luis Tróccoli", rep: 6000, country: "Uruguay" },
    { name: "Wanderers", short: "WAN", pCol: "bg-blue-900", sCol: "text-white", stadium: "Parque Viera", rep: 6200, country: "Uruguay" },
    { name: "River Plate (U)", short: "RIV", pCol: "bg-red-800", sCol: "text-white", stadium: "Parque Federico Saroldi", rep: 6100, country: "Uruguay" },
    { name: "Plaza Colonia", short: "PCO", pCol: "bg-white", sCol: "text-red-800", stadium: "Juan Gaspar Prandi", rep: 5400, country: "Uruguay" },
    { name: "Racing Montevideo", short: "RCM", pCol: "bg-green-800", sCol: "text-white", stadium: "Parque Roberto", rep: 5300, country: "Uruguay" },
    { name: "Miramar Misiones", short: "MIR", pCol: "bg-red-800", sCol: "text-white", stadium: "Parque Artigas", rep: 5200, country: "Uruguay" },
    { name: "Boston River", short: "BOS", pCol: "bg-red-800", sCol: "text-yellow-400", stadium: "Parque Artigas", rep: 5100, country: "Uruguay" }
];

export const ECU_LIGA_PRO: RealClubDef[] = [
    { name: "LDU Quito", short: "LDU", pCol: "bg-white", sCol: "text-red-700", stadium: "Rodrigo Paz Delgado", rep: 7800, country: "Ecuador" },
    { name: "Ind. del Valle", short: "IDV", pCol: "bg-black", sCol: "text-blue-600", stadium: "Banco Guayaquil", rep: 8000, country: "Ecuador" },
    { name: "Barcelona SC", short: "BSC", pCol: "bg-yellow-400", sCol: "text-red-600", stadium: "Monumental Banco Pichincha", rep: 7700, country: "Ecuador" },
    { name: "Emelec", short: "EME", pCol: "bg-blue-700", sCol: "text-slate-400", stadium: "George Capwell", rep: 7400, country: "Ecuador" },
    { name: "El Nacional", short: "ELN", pCol: "bg-red-600", sCol: "text-blue-500", stadium: "Atahualpa", rep: 6700, country: "Ecuador" },
    { name: "Aucas", short: "AUC", pCol: "bg-red-800", sCol: "text-white", stadium: "Gonzalo Pozo Ripalda", rep: 7000, country: "Ecuador" },
    { name: "Dep. Cuenca", short: "CUE", pCol: "bg-red-800", sCol: "text-white", stadium: "Alejandro Serrano Aguilar", rep: 6600, country: "Ecuador" },
    { name: "U. Católica (E)", short: "UCE", pCol: "bg-yellow-400", sCol: "text-red-800", stadium: "Olímpico Atahualpa", rep: 6900, country: "Ecuador" },
    { name: "Mushuc Runa", short: "MUS", pCol: "bg-red-800", sCol: "text-white", stadium: "Cooperativa Mushuc Runa", rep: 5900, country: "Ecuador" },
    { name: "Delfín", short: "DEL", pCol: "bg-blue-900", sCol: "text-white", stadium: "Jocay", rep: 6200, country: "Ecuador" },
    { name: "Guayaquil City", short: "GCY", pCol: "bg-blue-900", sCol: "text-white", stadium: "Christian Benítez", rep: 5800, country: "Ecuador" },
    { name: "Macará", short: "MAC", pCol: "bg-red-800", sCol: "text-white", stadium: "Bellavista", rep: 5700, country: "Ecuador" },
    { name: "Técnico Universitario", short: "TEC", pCol: "bg-red-800", sCol: "text-white", stadium: "Bellavista", rep: 5400, country: "Ecuador" },
    { name: "Orense", short: "ORE", pCol: "bg-yellow-400", sCol: "text-red-800", stadium: "9 de Mayo", rep: 5300, country: "Ecuador" },
    { name: "Cumbayá", short: "CUM", pCol: "bg-blue-900", sCol: "text-white", stadium: "Olímpico Atahualpa", rep: 5100, country: "Ecuador" },
    { name: "Libertad (E)", short: "LIB", pCol: "bg-black", sCol: "text-white", stadium: "Luis Salazar", rep: 5200, country: "Ecuador" }
];

export const PRY_DIVISION: RealClubDef[] = [
    { name: "Olimpia", short: "OLI", pCol: "bg-white", sCol: "text-black", stadium: "Manuel Ferreira", rep: 7700, country: "Paraguay" },
    { name: "Cerro Porteño", short: "CER", pCol: "bg-red-700", sCol: "text-blue-800", stadium: "La Nueva Olla", rep: 7600, country: "Paraguay" },
    { name: "Libertad", short: "LIB", pCol: "bg-black", sCol: "text-white", stadium: "Dr. Nicolás Leoz", rep: 7400, country: "Paraguay" },
    { name: "Guaraní", short: "GUA", pCol: "bg-yellow-400", sCol: "text-black", stadium: "Rogelio Livieres", rep: 6800, country: "Paraguay" },
    { name: "Nacional (P)", short: "NAC", pCol: "bg-white", sCol: "text-blue-800", stadium: "Arsenio Erico", rep: 6500, country: "Paraguay" },
    { name: "Sportivo Luqueño", short: "SPO", pCol: "bg-blue-900", sCol: "text-white", stadium: "Feliciano Cáceres", rep: 6200, country: "Paraguay" },
    { name: "Sol de América", short: "SOL", pCol: "bg-yellow-400", sCol: "text-blue-900", stadium: "Luis Alfonso Giagni", rep: 6100, country: "Paraguay" },
    { name: "Tacuary", short: "TAC", pCol: "bg-red-800", sCol: "text-white", stadium: "Toribio Vargas", rep: 5900, country: "Paraguay" },
    { name: "2 de Mayo", short: "MAY", pCol: "bg-blue-900", sCol: "text-white", stadium: "Rio Parapití", rep: 5100, country: "Paraguay" },
    { name: "General Caballero", short: "GCA", pCol: "bg-black", sCol: "text-white", stadium: "Ka'arendy", rep: 5200, country: "Paraguay" },
    { name: "Sportivo Ameliano", short: "AME", pCol: "bg-red-800", sCol: "text-white", stadium: "Rudyt Bernal", rep: 5300, country: "Paraguay" },
    { name: "Deportivo Recoleta", short: "REC", pCol: "bg-blue-900", sCol: "text-white", stadium: "Miguel Ángel Salinas", rep: 4800, country: "Paraguay" }
];

export const BOL_DIVISION: RealClubDef[] = [
    { name: "Bolívar", short: "BOL", pCol: "bg-sky-400", sCol: "text-white", stadium: "Hernando Siles", rep: 6800, country: "Bolivia" },
    { name: "The Strongest", short: "STR", pCol: "bg-yellow-400", sCol: "text-black", stadium: "Hernando Siles", rep: 6700, country: "Bolivia" },
    { name: "Blooming", short: "BLO", pCol: "bg-blue-900", sCol: "text-white", stadium: "Ramón Tahuichi Aguilera", rep: 6100, country: "Bolivia" },
    { name: "Jorge Wilstermann", short: "WIL", pCol: "bg-red-600", sCol: "text-blue-800", stadium: "Félix Capriles", rep: 6400, country: "Bolivia" },
    { name: "Oriente Petrolero", short: "ORI", pCol: "bg-green-600", sCol: "text-white", stadium: "Tahuichi Aguilera", rep: 6300, country: "Bolivia" },
    { name: "Always Ready", short: "CAR", pCol: "bg-red-800", sCol: "text-white", stadium: "Municipal de El Alto", rep: 6200, country: "Bolivia" },
    { name: "Aurora", short: "AUR", pCol: "bg-red-800", sCol: "text-white", stadium: "Félix Capriles", rep: 5900, country: "Bolivia" },
    { name: "Real Tomayapo", short: "TOM", pCol: "bg-yellow-400", sCol: "text-red-800", stadium: "IV Centenario", rep: 5100, country: "Bolivia" },
    { name: "Nacional Potosí", short: "NPO", pCol: "bg-red-800", sCol: "text-white", stadium: "Víctor Agustín Ugarte", rep: 5400, country: "Bolivia" },
    { name: "GV San José", short: "GVS", pCol: "bg-green-800", sCol: "text-white", stadium: "Jesús Bermúdez", rep: 4900, country: "Bolivia" },
    { name: "Real Santa Cruz", short: "RSC", pCol: "bg-white", sCol: "text-red-800", stadium: "Real Santa Cruz", rep: 4700, country: "Bolivia" },
    { name: "Atl. Palmaflor", short: "PAL", pCol: "bg-red-800", sCol: "text-white", stadium: "Félix Capriles", rep: 5000, country: "Bolivia" },
    { name: "Universitario (B)", short: "UNI", pCol: "bg-blue-900", sCol: "text-white", stadium: "Olímpico Patria", rep: 5100, country: "Bolivia" },
    { name: "Real Potosí", short: "RPO", pCol: "bg-yellow-400", sCol: "text-blue-900", stadium: "Víctor Agustín Ugarte", rep: 5200, country: "Bolivia" },
    { name: "Destroyers", short: "DES", pCol: "bg-white", sCol: "text-black", stadium: "Ramón Tahuichi Aguilera", rep: 4800, country: "Bolivia" },
    { name: "Guabirá", short: "GUA", pCol: "bg-red-800", sCol: "text-white", stadium: "Gilberto Parada", rep: 5300, country: "Bolivia" }
];

export const VEN_LIGA: RealClubDef[] = [
    { name: "Caracas FC", short: "CAR", pCol: "bg-red-700", sCol: "text-white", stadium: "Olímpico de la UCV", rep: 6000, country: "Venezuela" },
    { name: "Dep. Táchira", short: "TAC", pCol: "bg-yellow-400", sCol: "text-black", stadium: "Pueblo Nuevo", rep: 6000, country: "Venezuela" },
    { name: "Deportivo La Guaira", short: "DLG", pCol: "bg-purple-900", sCol: "text-white", stadium: "Olímpico de la UCV", rep: 5500, country: "Venezuela" },
    { name: "Estudiantes Mérida", short: "EST", pCol: "bg-red-800", sCol: "text-white", stadium: "Metropolitano", rep: 5300, country: "Venezuela" },
    { name: "Zamora", short: "ZAM", pCol: "bg-white", sCol: "text-red-800", stadium: "Rafael Calles Pinto", rep: 5400, country: "Venezuela" },
    { name: "Monagas", short: "MON", pCol: "bg-red-800", sCol: "text-white", stadium: "Monumental", rep: 5600, country: "Venezuela" },
    { name: "Mineros", short: "MIN", pCol: "bg-yellow-400", sCol: "text-black", stadium: "Cachamay", rep: 5700, country: "Venezuela" },
    { name: "Academia Puerto Cabello", short: "APC", pCol: "bg-blue-900", sCol: "text-white", stadium: "La Bombonerita", rep: 5000, country: "Venezuela" },
    { name: "Carabobo", short: "CBO", pCol: "bg-red-800", sCol: "text-white", stadium: "Misael Delgado", rep: 5100, country: "Venezuela" },
    { name: "Angostura", short: "ANG", pCol: "bg-green-900", sCol: "text-white", stadium: "Ricardo Tulio Maya", rep: 4900, country: "Venezuela" },
    { name: "Hermanos Colmenarez", short: "HCO", pCol: "bg-yellow-400", sCol: "text-red-800", stadium: "Reinaldo Melo", rep: 4800, country: "Venezuela" },
    { name: "Metropolitanos", short: "MET", pCol: "bg-red-800", sCol: "text-white", stadium: "Olímpico de la UCV", rep: 5200, country: "Venezuela" },
    { name: "Portuguesa", short: "POR", pCol: "bg-red-800", sCol: "text-white", stadium: "General José Antonio Páez", rep: 5000, country: "Venezuela" },
    { name: "Deportivo Pereira", short: "PER", pCol: "bg-red-800", sCol: "text-white", stadium: "Polideportivo", rep: 4700, country: "Venezuela" },
    { name: "Ureña", short: "URE", pCol: "bg-blue-900", sCol: "text-white", stadium: "Gimnacio", rep: 4600, country: "Venezuela" },
    { name: "Titanes", short: "TIT", pCol: "bg-black", sCol: "text-white", stadium: "Guillermo Soto Rosa", rep: 4500, country: "Venezuela" }
];

export const PER_LIGA1: RealClubDef[] = [
    { name: "Universitario", short: "UNI", pCol: "bg-red-100", sCol: "text-red-800", stadium: "Monumental U", rep: 7200, country: "Perú" },
    { name: "Alianza Lima", short: "ALI", pCol: "bg-blue-900", sCol: "text-white", stadium: "Alejandro Villanueva", rep: 7200, country: "Perú" },
    { name: "Sporting Cristal", short: "CRI", pCol: "bg-sky-400", sCol: "text-white", stadium: "Alberto Gallardo", rep: 7100, country: "Perú" },
    { name: "Melgar", short: "MEL", pCol: "bg-red-700", sCol: "text-black", stadium: "UNSA", rep: 6900, country: "Perú" },
    { name: "Cienciano", short: "CIE", pCol: "bg-red-600", sCol: "text-white", stadium: "Garcilaso", rep: 6600, country: "Perú" },
    { name: "Cusco FC", short: "CUS", pCol: "bg-yellow-400", sCol: "text-red-800", stadium: "Garcilaso", rep: 6000, country: "Perú" },
    { name: "ADT", short: "ADT", pCol: "bg-red-800", sCol: "text-white", stadium: "Unión Tarma", rep: 5600, country: "Perú" },
    { name: "Cajamarca", short: "CAJ", pCol: "bg-red-800", sCol: "text-white", stadium: "Héroes de San Ramón", rep: 5500, country: "Perú" },
    { name: "UTC", short: "UTC", pCol: "bg-red-800", sCol: "text-white", stadium: "Héroes de San Ramón", rep: 5600, country: "Perú" },
    { name: "Sport Boys", short: "SBA", pCol: "bg-red-800", sCol: "text-white", stadium: "Miguel Grau", rep: 6200, country: "Perú" },
    { name: "Carlos Mannucci", short: "CAM", pCol: "bg-red-800", sCol: "text-white", stadium: "Mansiche", rep: 5900, country: "Perú" },
    { name: "Atlético Grau", short: "GRA", pCol: "bg-red-800", sCol: "text-white", stadium: "Miguel Grau", rep: 5700, country: "Perú" },
    { name: "Alianza Atlético", short: "AAS", pCol: "bg-red-800", sCol: "text-white", stadium: "Campeones del 36", rep: 5400, country: "Perú" },
    { name: "Los Chankas", short: "CHA", pCol: "bg-yellow-400", sCol: "text-red-800", stadium: "Los Chankas", rep: 5000, country: "Perú" },
    { name: "Comerciantes Unidos", short: "COM", pCol: "bg-red-800", sCol: "text-white", stadium: "Juan Maldonado Gamarra", rep: 4800, country: "Perú" },
    { name: "Sport Huancayo", short: "SHU", pCol: "bg-red-800", sCol: "text-white", stadium: "Huancayo", rep: 5800, country: "Perú" },
    { name: "César Vallejo", short: "CV", pCol: "bg-red-800", sCol: "text-white", stadium: "Mansiche", rep: 5700, country: "Perú" },
    { name: "Alianza Universidad", short: "AUH", pCol: "bg-red-800", sCol: "text-white", stadium: "Heraclio Tapia", rep: 4900, country: "Perú" }
];

export const PRY_DIVISION_B: RealClubDef[] = [
    { name: "Sportivo Luqueño", short: "SPO", pCol: "bg-blue-900", sCol: "text-white", stadium: "Feliciano Cáceres", rep: 6200, country: "Paraguay" },
    { name: "3 de Noviembre", short: "3NO", pCol: "bg-red-800", sCol: "text-white", stadium: "Riverside", rep: 5100, country: "Paraguay" },
    { name: "Pastoreo", short: "PAS", pCol: "bg-green-900", sCol: "text-white", stadium: "Paí Coronel", rep: 4800, country: "Paraguay" },
    { name: "Fernando de la Mora", short: "FDM", pCol: "bg-blue-900", sCol: "text-white", stadium: "Emiliano Ghezzi", rep: 4900, country: "Paraguay" },
    { name: "Rubio Ñu", short: "RUB", pCol: "bg-yellow-400", sCol: "text-black", stadium: "La Arboleda", rep: 5000, country: "Paraguay" },
    { name: "San Lorenzo", short: "SLO", pCol: "bg-red-800", sCol: "text-white", stadium: "Gunther Vogel", rep: 5200, country: "Paraguay" },
    { name: "Atlético Colegiales", short: "COL", pCol: "bg-green-800", sCol: "text-white", stadium: "Emiliano Ghezzi", rep: 4700, country: "Paraguay" },
    { name: "Independiente (P)", short: "IND", pCol: "bg-red-800", sCol: "text-white", stadium: "Ricardo Gregor", rep: 5100, country: "Paraguay" },
    { name: "12 de Octubre", short: "12O", pCol: "bg-blue-900", sCol: "text-white", stadium: "12 de Octubre", rep: 5000, country: "Paraguay" },
    { name: "Resistencia", short: "RES", pCol: "bg-red-800", sCol: "text-white", stadium: "Tomás Beggan Correa", rep: 4600, country: "Paraguay" }
];

export const DEU_2_BUNDESLIGA: RealClubDef[] = [
    { name: "Köln", short: "KOE", pCol: "bg-red-800", sCol: "text-white", stadium: "RheinEnergieStadion", rep: 7800, country: "Alemania" },
    { name: "Schalke 04", short: "S04", pCol: "bg-blue-900", sCol: "text-white", stadium: "Veltins-Arena", rep: 7600, country: "Alemania" },
    { name: "Hamburger SV", short: "HSV", pCol: "bg-blue-900", sCol: "text-white", stadium: "Volksparkstadion", rep: 8000, country: "Alemania" },
    { name: "Hertha BSC", short: "BSC", pCol: "bg-blue-900", sCol: "text-white", stadium: "Olympiastadion", rep: 7500, country: "Alemania" },
    { name: "Karlsruher SC", short: "KSC", pCol: "bg-blue-900", sCol: "text-white", stadium: "BBank Wildpark", rep: 6700, country: "Alemania" },
    { name: "Hannover 96", short: "H96", pCol: "bg-red-800", sCol: "text-black", stadium: "HDI-Arena", rep: 7000, country: "Alemania" },
    { name: "Nürnberg", short: "FCN", pCol: "bg-red-800", sCol: "text-white", stadium: "Max-Morlock-Stadion", rep: 6800, country: "Alemania" },
    { name: "Paderborn", short: "SCP", pCol: "bg-blue-900", sCol: "text-white", stadium: "Home Deluxe Arena", rep: 6400, country: "Alemania" },
    { name: "Elversberg", short: "SVE", pCol: "bg-red-800", sCol: "text-white", stadium: "Waldstadion", rep: 5800, country: "Alemania" },
    { name: "Düsseldorf", short: "F95", pCol: "bg-red-800", sCol: "text-white", stadium: "Merkur Spiel-Arena", rep: 7200, country: "Alemania" },
    { name: "Osnabrück", short: "VFO", pCol: "bg-purple-800", sCol: "text-white", stadium: "Stadion an der Bremer Brücke", rep: 5300, country: "Alemania" },
    { name: "Münster", short: "SCP", pCol: "bg-red-800", sCol: "text-white", stadium: "Preußenstadion", rep: 5100, country: "Alemania" },
    { name: "Darmstadt", short: "SVD", pCol: "bg-blue-900", sCol: "text-white", stadium: "Böllenfalltor", rep: 6200, country: "Alemania" },
    { name: "Fürth", short: "SGF", pCol: "bg-white", sCol: "text-red-800", stadium: "Sportpark Ronhof", rep: 6300, country: "Alemania" },
    { name: "Magdeburg", short: "FCM", pCol: "bg-blue-900", sCol: "text-white", stadium: "MDCC-Arena", rep: 5800, country: "Alemania" },
    { name: "Kaiserslautern", short: "FCK", pCol: "bg-red-800", sCol: "text-white", stadium: "Fritz-Walter-Stadion", rep: 6900, country: "Alemania" },
    { name: "Ulm", short: "SSV", pCol: "bg-white", sCol: "text-black", stadium: "Donaustadion", rep: 5000, country: "Alemania" },
    { name: "Regensburg", short: "JRE", pCol: "bg-white", sCol: "text-red-800", stadium: "Jahnstadion", rep: 5200, country: "Alemania" }
];

export const FRA_LIGUE_2: RealClubDef[] = [
    { name: "Angers", short: "ANG", pCol: "bg-red-800", sCol: "text-white", stadium: "Raymond Kopa", rep: 6200, country: "Francia" },
    { name: "Paris FC", short: "PFC", pCol: "bg-blue-900", sCol: "text-white", stadium: "Charléty", rep: 6600, country: "Francia" },
    { name: "Saint-Étienne", short: "ASSE", pCol: "bg-green-800", sCol: "text-white", stadium: "Geoffroy-Guichard", rep: 7300, country: "Francia" },
    { name: "Rodez", short: "ROD", pCol: "bg-blue-900", sCol: "text-white", stadium: "Paul Lignon", rep: 5200, country: "Francia" },
    { name: "Grenoble", short: "GF38", pCol: "bg-blue-900", sCol: "text-white", stadium: "Stade des Alpes", rep: 5600, country: "Francia" },
    { name: "Bastia", short: "BAS", pCol: "bg-blue-900", sCol: "text-white", stadium: "Armand Cesari", rep: 5900, country: "Francia" },
    { name: "Caen", short: "SMC", pCol: "bg-blue-900", sCol: "text-white", stadium: "Michel d'Ornano", rep: 6100, country: "Francia" },
    { name: "Pau FC", short: "PAU", pCol: "bg-red-800", sCol: "text-white", stadium: "Nouste Cam", rep: 5400, country: "Francia" },
    { name: "Dunkerque", short: "USD", pCol: "bg-red-800", sCol: "text-white", stadium: "Stade Marcel Tribut", rep: 5600, country: "Francia" },
    { name: "Laval", short: "LAV", pCol: "bg-red-800", sCol: "text-white", stadium: "Stade Francis Le Basser", rep: 5500, country: "Francia" },
    { name: "Troyes", short: "ESTAC", pCol: "bg-blue-900", sCol: "text-white", stadium: "Stade de l'Aube", rep: 5800, country: "Francia" },
    { name: "Amiens", short: "ASC", pCol: "bg-red-800", sCol: "text-white", stadium: "Coliséum", rep: 6000, country: "Francia" },
    { name: "Annecy", short: "ANN", pCol: "bg-red-800", sCol: "text-white", stadium: "Parc des Sports", rep: 5000, country: "Francia" },
    { name: "Concarneau", short: "USC", pCol: "bg-red-800", sCol: "text-white", stadium: "Stade Guy Piriou", rep: 4900, country: "Francia" },
    { name: "Quevilly Rouen", short: "QRM", pCol: "bg-red-800", sCol: "text-white", stadium: "Dian Villegas", rep: 4800, country: "Francia" },
    { name: "Valenciennes", short: "VAFC", pCol: "bg-red-800", sCol: "text-white", stadium: "Nungesser", rep: 5300, country: "Francia" },
    { name: "Bordeaux", short: "FCGB", pCol: "bg-blue-900", sCol: "text-white", stadium: "Matmut Atlantique", rep: 7200, country: "Francia" },
    { name: "Ajaccio", short: "ACA", pCol: "bg-red-800", sCol: "text-white", stadium: "François Coty", rep: 5400, country: "Francia" }
];

export const ITA_SERIE_B: RealClubDef[] = [
    { name: "Sassuolo", short: "SAS", pCol: "bg-green-800", sCol: "text-white", stadium: "MAPEI Stadium", rep: 7800, country: "Italia" },
    { name: "Palermo", short: "PAL", pCol: "bg-pink-700", sCol: "text-white", stadium: "Renzo Barbera", rep: 7600, country: "Italia" },
    { name: "Pisa", short: "PIS", pCol: "bg-black", sCol: "text-white", stadium: "Arena Garibaldi", rep: 6200, country: "Italia" },
    { name: "Cremonese", short: "CRE", pCol: "bg-red-800", sCol: "text-white", stadium: "Giovanni Zini", rep: 6200, country: "Italia" },
    { name: "Catanzaro", short: "CAT", pCol: "bg-red-800", sCol: "text-white", stadium: "Nicola Ceravolo", rep: 5600, country: "Italia" },
    { name: "Cittadella", short: "CIT", pCol: "bg-red-800", sCol: "text-white", stadium: "Pier Cesare Tombolato", rep: 5400, country: "Italia" },
    { name: "Como", short: "COM", pCol: "bg-sky-400", sCol: "text-blue-900", stadium: "Sinigaglia", rep: 6900, country: "Italia" },
    { name: "Brescia", short: "BRE", pCol: "bg-blue-900", sCol: "text-white", stadium: "Mario Rigamonti", rep: 6500, country: "Italia" },
    { name: "Modena", short: "MOD", pCol: "bg-yellow-400", sCol: "text-blue-900", stadium: "Alberto Braglia", rep: 6300, country: "Italia" },
    { name: "Reggiana", short: "REG", pCol: "bg-blue-900", sCol: "text-white", stadium: "Giglio", rep: 5500, country: "Italia" },
    { name: "Spezia", short: "SPE", pCol: "bg-white", sCol: "text-black", stadium: "Alberto Picco", rep: 5900, country: "Italia" },
    { name: "Sampdoria", short: "SAM", pCol: "bg-blue-900", sCol: "text-white", stadium: "Luigi Ferraris", rep: 7000, country: "Italia" },
    { name: "Bari", short: "BAR", pCol: "bg-white", sCol: "text-red-800", stadium: "San Nicola", rep: 6700, country: "Italia" },
    { name: "Frosinone", short: "FRO", pCol: "bg-yellow-400", sCol: "text-green-900", stadium: "Benito Stirpe", rep: 6000, country: "Italia" },
    { name: "Cosenza", short: "COS", pCol: "bg-red-800", sCol: "text-white", stadium: "San Vito-Gigi Marulla", rep: 5200, country: "Italia" },
    { name: "Sucedovo", short: "SUD", pCol: "bg-green-800", sCol: "text-white", stadium: "Stadio Vito Simone", rep: 5000, country: "Italia" },
    { name: "Pontedera", short: "PON", pCol: "bg-red-800", sCol: "text-white", stadium: "Ettore Mannucci", rep: 5100, country: "Italia" },
    { name: "Lecco", short: "LEC", pCol: "bg-blue-900", sCol: "text-white", stadium: "Rigamonti-Ceppi", rep: 4900, country: "Italia" },
    { name: "Ternana", short: "TER", pCol: "bg-red-800", sCol: "text-white", stadium: "Libero Liberati", rep: 5800, country: "Italia" },
    { name: "Juve Stabia", short: "STA", pCol: "bg-yellow-400", sCol: "text-red-800", stadium: "Romeo Menti", rep: 5400, country: "Italia" }
];

export const ENG_CHAMPIONSHIP: RealClubDef[] = [
    { name: "Leeds United", short: "LEE", pCol: "bg-white", sCol: "text-blue-900", stadium: "Elland Road", rep: 8300, country: "Inglaterra" },
    { name: "Norwich City", short: "NOR", pCol: "bg-yellow-400", sCol: "text-green-900", stadium: "Carrow Road", rep: 7600, country: "Inglaterra" },
    { name: "Sunderland", short: "SUN", pCol: "bg-red-800", sCol: "text-white", stadium: "Stadium of Light", rep: 7700, country: "Inglaterra" },
    { name: "Watford", short: "WAT", pCol: "bg-yellow-400", sCol: "text-black", stadium: "Vicarage Road", rep: 7400, country: "Inglaterra" },
    { name: "Middlesbrough", short: "MID", pCol: "bg-red-800", sCol: "text-white", stadium: "Riverside", rep: 7300, country: "Inglaterra" },
    { name: "Bristol City", short: "BRC", pCol: "bg-red-800", sCol: "text-white", stadium: "Ashton Gate", rep: 7000, country: "Inglaterra" },
    { name: "Swansea", short: "SWA", pCol: "bg-white", sCol: "text-black", stadium: "Liberty Stadium", rep: 7100, country: "Inglaterra" },
    { name: "Blackburn", short: "BLA", pCol: "bg-blue-900", sCol: "text-white", stadium: "Ewood Park", rep: 6800, country: "Inglaterra" },
    { name: "Millwall", short: "MIL", pCol: "bg-blue-900", sCol: "text-white", stadium: "The Den", rep: 6700, country: "Inglaterra" },
    { name: "Preston", short: "PNE", pCol: "bg-white", sCol: "text-blue-900", stadium: "Deepdale", rep: 6400, country: "Inglaterra" },
    { name: "Oxford United", short: "OXF", pCol: "bg-yellow-400", sCol: "text-blue-900", stadium: "Kassam Stadium", rep: 6000, country: "Inglaterra" },
    { name: "Derby County", short: "DER", pCol: "bg-white", sCol: "text-black", stadium: "Pride Park", rep: 7100, country: "Inglaterra" },
    { name: "Cardiff City", short: "CAR", pCol: "bg-blue-900", sCol: "text-white", stadium: "Cardiff City Stadium", rep: 6900, country: "Inglaterra" },
    { name: "QPR", short: "QPR", pCol: "bg-blue-900", sCol: "text-white", stadium: "Loftus Road", rep: 6800, country: "Inglaterra" },
    { name: "Stoke City", short: "STO", pCol: "bg-red-800", sCol: "text-white", stadium: "Bet365 Stadium", rep: 6600, country: "Inglaterra" },
    { name: "Reading", short: "REA", pCol: "bg-blue-900", sCol: "text-white", stadium: "Madejski Stadium", rep: 6400, country: "Inglaterra" },
    { name: "Coventry", short: "COV", pCol: "bg-sky-400", sCol: "text-blue-900", stadium: "Coventry Building Society Arena", rep: 6500, country: "Inglaterra" },
    { name: "Plymouth", short: "PLY", pCol: "bg-green-900", sCol: "text-white", stadium: "Home Park", rep: 6200, country: "Inglaterra" },
    { name: "Sheffield Wednesday", short: "SHW", pCol: "bg-blue-900", sCol: "text-white", stadium: "Hillsborough", rep: 7000, country: "Inglaterra" },
    { name: "Hull City", short: "HUL", pCol: "bg-black", sCol: "text-white", stadium: "MKM Stadium", rep: 6400, country: "Inglaterra" },
    { name: "Porterville Town", short: "POR", pCol: "bg-yellow-400", sCol: "text-black", stadium: "Fratton Park", rep: 6100, country: "Inglaterra" },
    { name: "Burnley", short: "BUR", pCol: "bg-claret-800", sCol: "text-white", stadium: "Turf Moor", rep: 7800, country: "Inglaterra" },
    { name: "Luton Town", short: "LUT", pCol: "bg-orange-600", sCol: "text-white", stadium: "Kenilworth Road", rep: 6900, country: "Inglaterra" },
    { name: "Sheffield United", short: "SHU", pCol: "bg-red-800", sCol: "text-white", stadium: "Bramall Lane", rep: 7500, country: "Inglaterra" }
];

export const JPN_J2: RealClubDef[] = [
    { name: "Shimizu S-Pulse", short: "SSP", pCol: "bg-orange-600", sCol: "text-white", stadium: "IA Stadium", rep: 6200, country: "Japón" },
    { name: "Hokkaido Consadole", short: "CON", pCol: "bg-red-800", sCol: "text-white", stadium: "Diamond Hokkaido", rep: 7000, country: "Japón" },
    { name: "V-Varen Nagasaki", short: "VVN", pCol: "bg-blue-900", sCol: "text-white", stadium: "Nagasaki Stadium", rep: 5800, country: "Japón" },
    { name: "Vegalta Sendai", short: "VEG", pCol: "bg-blue-900", sCol: "text-white", stadium: "Yurtec Stadium", rep: 6000, country: "Japón" },
    { name: "Montedio Yamagata", short: "MON", pCol: "bg-blue-900", sCol: "text-white", stadium: "ND Soft Stadium", rep: 5700, country: "Japón" },
    { name: "Blaublitz Akita", short: "BLA", pCol: "bg-blue-900", sCol: "text-white", stadium: "Soyu Stadium", rep: 5100, country: "Japón" },
    { name: "Iwaki FC", short: "IWA", pCol: "bg-blue-900", sCol: "text-white", stadium: "Hawaiians Stadium", rep: 5200, country: "Japón" },
    { name: "Oita Trinita", short: "OIT", pCol: "bg-red-800", sCol: "text-white", stadium: "Showa Denko Dome", rep: 5900, country: "Japón" },
    { name: "Roasso Kumamoto", short: "ROA", pCol: "bg-red-800", sCol: "text-white", stadium: "Egao Kenko Stadium", rep: 5300, country: "Japón" },
    { name: "Renofa Yamaguchi", short: "REN", pCol: "bg-yellow-400", sCol: "text-red-800", stadium: "Ishin Me-life Stadium", rep: 5200, country: "Japón" },
    { name: "Kagoshima United", short: "KAG", pCol: "bg-red-800", sCol: "text-white", stadium: "Shiranami Stadium", rep: 5100, country: "Japón" },
    { name: "Ventforet Kofu", short: "VEN", pCol: "bg-blue-900", sCol: "text-white", stadium: "Yamanashi Chuo Bank", rep: 5400, country: "Japón" },
    { name: "Fagiano Okayama", short: "FAG", pCol: "bg-green-900", sCol: "text-white", stadium: "City Light Stadium", rep: 5700, country: "Japón" },
    { name: "JEF United", short: "JEF", pCol: "bg-yellow-400", sCol: "text-green-900", stadium: "Fukuda Denshi Arena", rep: 6300, country: "Japón" },
    { name: "Tokushima Vortis", short: "TOK", pCol: "bg-blue-900", sCol: "text-white", stadium: "Pocarisweat Stadium", rep: 5600, country: "Japón" },
    { name: "Thespakusatsu Gunma", short: "THE", pCol: "bg-red-800", sCol: "text-white", stadium: "Shoda Shoyu Stadium", rep: 5000, country: "Japón" },
    { name: "Omiya Ardija", short: "OMI", pCol: "bg-red-800", sCol: "text-white", stadium: "NACK5 Stadium Omiya", rep: 5500, country: "Japón" },
    { name: "FC Gifu", short: "FCG", pCol: "bg-blue-900", sCol: "text-white", stadium: "Gifu Nagaragawa", rep: 4900, country: "Japón" }
];

const DEFAULT_TACTIC_SETTINGS: TacticSettings = {
  mentality: 10,
  creativeFreedom: 10,
  passingStyle: 10,
  tempo: 10,
  width: 10,
  closingDown: 10,
  timeWasting: 10,
  defensiveLine: 10,
  tackling: 10,
  focusPassing: 'MIXED',
  marking: 'ZONAL',
  targetManSupply: 'MIXED',
  tightMarking: false,
  useTargetMan: false,
  usePlaymaker: false,
  playOffside: false,
  counterAttack: false,
  setPieces: {
    cornersLeft: 'Punto de Penalti',
    cornersRight: 'Punto de Penalti',
    freeKicksLeft: 'Combinado',
    freeKicksRight: 'Combinado',
    throwInsLeft: 'Largo',
    throwInsRight: 'Largo'
  }
};

const DEFAULT_INDIVIDUAL_SETTINGS: PlayerTacticSettings = {
  mentality: 10,
  creativeFreedom: 10,
  passingStyle: 10,
  closingDown: 10,
  tackling: 10,
  forwardRuns: 'MIXED',
  runWithBall: 'MIXED',
  longShots: 'MIXED',
  throughBalls: 'MIXED',
  crossBall: 'MIXED',
  marking: 'ZONAL',
  tightMarking: false,
  holdUpBall: false
};

const generateIndividualDefaults = (positions: number[]) => {
  const settings: Record<number, PlayerTacticSettings> = {};
  positions.forEach(p => { settings[p] = { ...DEFAULT_INDIVIDUAL_SETTINGS }; });
  return settings;
};

// Fix missing settings errors
export const TACTIC_PRESETS: Tactic[] = [
   { id: '4-4-2', name: '4-4-2 Clásica', positions: [0, 1, 2, 4, 5, 11, 12, 14, 15, 29, 30], arrows: {}, settings: DEFAULT_TACTIC_SETTINGS, individualSettings: generateIndividualDefaults([0, 1, 2, 4, 5, 11, 12, 14, 15, 29, 30]) },
   { id: '4-3-3', name: '4-3-3 Ofensiva', positions: [0, 1, 2, 4, 5, 8, 12, 14, 19, 20, 26], arrows: {}, settings: DEFAULT_TACTIC_SETTINGS, individualSettings: generateIndividualDefaults([0, 1, 2, 4, 5, 8, 12, 14, 19, 20, 26]) },
   { id: '4-2-3-1', name: '4-2-3-1 Doble Pivote', positions: [0, 1, 2, 4, 5, 8, 10, 17, 19, 20, 26], arrows: {}, settings: DEFAULT_TACTIC_SETTINGS, individualSettings: generateIndividualDefaults([0, 1, 2, 4, 5, 8, 10, 17, 19, 20, 26]) },
   { id: '3-5-2', name: '3-5-2 Carrileros', positions: [0, 2, 3, 4, 11, 15, 8, 12, 14, 27, 29], arrows: {}, settings: DEFAULT_TACTIC_SETTINGS, individualSettings: generateIndividualDefaults([0, 2, 3, 4, 11, 15, 8, 12, 14, 27, 29]) },
   { id: '5-4-1', name: '5-4-1 Muro Defensivo', positions: [0, 1, 2, 3, 4, 5, 12, 14, 11, 15, 26], arrows: {}, settings: DEFAULT_TACTIC_SETTINGS, individualSettings: generateIndividualDefaults([0, 1, 2, 3, 4, 5, 12, 14, 11, 15, 26]) }
];

export const TRAINING_PRESETS: { id: string; name: string; schedule: TrainingSchedule }[] = [
  { 
    id: 'GENERAL', 
    name: 'General', 
    schedule: { STRENGTH: 8, AEROBIC: 8, TACTICAL: 8, BALL_CONTROL: 8, DEFENDING: 8, ATTACKING: 8, SHOOTING: 8, SET_PIECES: 4 } 
  },
  { 
    id: 'PHYSICAL', 
    name: 'Físico Pesado', 
    schedule: { STRENGTH: 16, AEROBIC: 16, TACTICAL: 4, BALL_CONTROL: 4, DEFENDING: 4, ATTACKING: 4, SHOOTING: 4, SET_PIECES: 2 } 
  },
  { 
    id: 'TECHNICAL', 
    name: 'Técnico / Control', 
    schedule: { STRENGTH: 4, AEROBIC: 4, TACTICAL: 8, BALL_CONTROL: 16, DEFENDING: 6, ATTACKING: 10, SHOOTING: 8, SET_PIECES: 4 } 
  },
  { 
    id: 'DEFENSIVE', 
    name: 'Defensivo', 
    schedule: { STRENGTH: 10, AEROBIC: 6, TACTICAL: 12, BALL_CONTROL: 4, DEFENDING: 18, ATTACKING: 2, SHOOTING: 2, SET_PIECES: 6 } 
  },
  { 
    id: 'OFFENSIVE', 
    name: 'Ofensivo / Remate', 
    schedule: { STRENGTH: 6, AEROBIC: 8, TACTICAL: 8, BALL_CONTROL: 10, DEFENDING: 2, ATTACKING: 14, SHOOTING: 16, SET_PIECES: 4 } 
  },
];

export const NAMES_DB = {
    firstNames: ["Juan", "Carlos", "Diego", "Luis", "Sergio", "Pablo", "Matías", "Lucas", "Enzo", "Lautaro", "Julián", "Franco", "Nicolás", "Facundo", "Federico", "Santiago", "Tomás", "Ignacio", "Agustín", "Ezequiel", "Gabriel", "Maxi", "Rodrigo", "Leandro", "Cristian", "Martín", "Gonzalo", "Alan", "Brian", "Kevin"],
    lastNames: ["García", "Rodríguez", "González", "Fernández", "López", "Díaz", "Martínez", "Pérez", "Romero", "Sánchez", "Gómez", "Torres", "Ruiz", "Alvarez", "Moyano", "Rojas", "Gutiérrez", "Giménez", "Castro", "Ortiz", "Silva", "Nuñez", "Cabrera", "Morales", "Ríos", "Godoy", "Acosta", "Medina", "Herrera", "Sosa"]
};

const rmAttr = (coaching: number, tactical: number, manMgmt: number, motivation: number, judging: number, adapt: number): StaffAttributes => ({
  coaching, tacticalKnowledge: tactical, manManagement: manMgmt, motivation,
  judgingAbility: judging, judgingPotential: judging, adaptability: adapt, medical: 3, physiotherapy: 3
});

export const REAL_MANAGERS: RealManager[] = [
  // INGLATERRA - L_ENG_1
  {
    id: 'RM_PEP', name: 'Pep', surname: 'Guardiola', nationality: 'España', age: 54, birthDate: new Date(1971, 1, 18), currentClubId: '679', leagueId: 'L_ENG_1',
    attributes: rmAttr(18, 19, 14, 13, 16, 15), personality: 'VISIONARY', reputation: 95, internationalReputation: 98,
    biography: 'Uno de los entrenadores más influyentes y exitosos de la historia moderna del fútbol, conocido por su estilo de juego de posesión (Tiki-taka) y alta presión.',
    preferredFormation: '4-3-3 Ofensiva', tacticalStyle: 'CONTROL', pressIntensity: 'HIGH', possessionVsCounter: 'POSSESSION', playingStyle: 'Tiki-taka (posesión corta, presión alta tras pérdida)',
    careerHonours: ['La Liga x3', 'Champions League x2', 'Premier League x6', 'Bundesliga x3'],
    previousClubs: [{ clubId: '1708', clubName: 'Barcelona', years: '2008-2012', titles: ['La Liga x3', 'Champions League x2'] }, { clubId: '915', clubName: 'Bayern Munich', years: '2013-2016', titles: ['Bundesliga x3'] }], history: []
  },
  {
    id: 'RM_ARTETA', name: 'Mikel', surname: 'Arteta', nationality: 'España', age: 42, birthDate: new Date(1982, 2, 26), currentClubId: '602', leagueId: 'L_ENG_1',
    attributes: rmAttr(16, 17, 13, 12, 14, 14), personality: 'CALM', reputation: 88, internationalReputation: 85,
    biography: 'Ex-jugador y discípulo de Pep Guardiola, ha transformado al Arsenal en un contendiente al título, enfatizando el fútbol de ataque y la disciplina táctica.',
    preferredFormation: '4-3-3 Ofensiva', tacticalStyle: 'ATTACK', pressIntensity: 'HIGH', possessionVsCounter: 'POSSESSION', playingStyle: 'Posesión con transiciones rápidas y ataque por bandas',
    careerHonours: ['FA Cup x1'],
    previousClubs: [], history: []
  },
  {
    id: 'RM_SLOT', name: 'Arne', surname: 'Slot', nationality: 'Países Bajos', age: 46, birthDate: new Date(1978, 8, 23), currentClubId: '676', leagueId: 'L_ENG_1',
    attributes: rmAttr(15, 16, 12, 11, 13, 13), personality: 'CALM', reputation: 82, internationalReputation: 80,
    biography: 'Reconocido por su trabajo en el Feyenoord, donde implementó un estilo de juego ofensivo y energético. Recientemente asumió el mando del Liverpool.',
    preferredFormation: '4-3-3 Ofensiva', tacticalStyle: 'ATTACK', pressIntensity: 'MEDIUM', possessionVsCounter: 'BALANCED', playingStyle: 'Fútbol total, ataque por bandas y presión alta',
    careerHonours: ['Eredivisie x1'],
    previousClubs: [{ clubId: '1013', clubName: 'Feyenoord', years: '2021-2024', titles: ['Eredivisie x1'] }], history: []
  },
  {
    id: 'RM_POSTECOGLOU', name: 'Ange', surname: 'Postecoglou', nationality: 'Australia', age: 59, birthDate: new Date(1965, 7, 27), currentClubId: '728', leagueId: 'L_ENG_1',
    attributes: rmAttr(15, 14, 13, 15, 12, 11), personality: 'PASSIONATE', reputation: 78, internationalReputation: 75,
    biography: 'Conocido por su enfoque ofensivo y la transformación de equipos en escuadras emocionantes. Ha logrado éxitos en Escocia y ahora en la Premier League.',
    preferredFormation: '4-3-3 Ofensiva', tacticalStyle: 'ATTACK', pressIntensity: 'HIGH', possessionVsCounter: 'POSSESSION', playingStyle: 'Fútbol rápido, ofensivo y de alta energía',
    careerHonours: ['Scottish Premiership x2', 'Scottish Cup x1'],
    previousClubs: [{ clubId: 'CEL', clubName: 'Celtic', years: '2021-2023', titles: ['Scottish Premiership x2', 'Scottish Cup x1'] }], history: []
  },
  {
    id: 'RM_EMERY', name: 'Unai', surname: 'Emery', nationality: 'España', age: 53, birthDate: new Date(1971, 10, 3), currentClubId: '603', leagueId: 'L_ENG_1',
    attributes: rmAttr(16, 17, 13, 12, 15, 14), personality: 'DISCIPLINARIAN', reputation: 85, internationalReputation: 87,
    biography: 'Especialista en competiciones de copa, particularmente la Europa League. Famoso por su meticulosa preparación táctica y su capacidad para mejorar jugadores.',
    preferredFormation: '4-2-3-1 Doble Pivote', tacticalStyle: 'BALANCED', pressIntensity: 'MEDIUM', possessionVsCounter: 'BALANCED', playingStyle: 'Orden táctico, solidez defensiva y transiciones rápidas',
    careerHonours: ['Europa League x4', 'Coupe de France x1'],
    previousClubs: [{ clubId: 'PSG', clubName: 'Paris Saint-Germain', years: '2016-2018', titles: ['Coupe de France x1'] }, { clubId: 'VIL', clubName: 'Villarreal', years: '2020-2022', titles: ['Europa League x1'] }], history: []
  },

  // ESPAÑA - L_ESP_1
  {
    id: 'RM_ANCELOTTI', name: 'Carlo', surname: 'Ancelotti', nationality: 'Italia', age: 66, birthDate: new Date(1959, 5, 10), currentClubId: '1736', leagueId: 'L_ESP_1',
    attributes: rmAttr(17, 16, 19, 14, 16, 16), personality: 'CALM', reputation: 94, internationalReputation: 97,
    biography: 'Entrenador legendario conocido por su adaptabilidad y su habilidad para manejar vestuarios llenos de estrellas, logrando múltiples títulos de Champions League.',
    preferredFormation: '4-3-3 Ofensiva', tacticalStyle: 'CONTROL', pressIntensity: 'LOW', possessionVsCounter: 'BALANCED', playingStyle: 'Fútbol pragmático, gestión de talentos y solidez defensiva',
    careerHonours: ['Champions League x5', 'La Liga x2', 'Serie A x1', 'Premier League x1', 'Ligue 1 x1', 'Bundesliga x1'],
    previousClubs: [{ clubId: 'ACM', clubName: 'AC Milan', years: '2001-2009', titles: ['Champions League x2'] }, { clubId: 'CHE', clubName: 'Chelsea', years: '2009-2011', titles: ['Premier League x1'] }], history: []
  },
  {
    id: 'RM_SIMEONE', name: 'Diego', surname: 'Simeone', nationality: 'Argentina', age: 55, birthDate: new Date(1970, 3, 28), currentClubId: null, leagueId: 'L_ESP_1',
    attributes: rmAttr(16, 15, 17, 18, 14, 13), personality: 'PASSIONATE', reputation: 90, internationalReputation: 92,
    biography: 'El "Cholo" es sinónimo de Atlético de Madrid, donde ha construido un equipo con una identidad defensiva férrea y una capacidad de contraataque letal. Desempleado, buscando un nuevo desafío.',
    preferredFormation: '4-4-2 Clásica', tacticalStyle: 'DEFENSE', pressIntensity: 'MEDIUM', possessionVsCounter: 'COUNTER', playingStyle: 'Bloque bajo, agresividad defensiva y transiciones rápidas',
    careerHonours: ['La Liga x2', 'Europa League x2'],
    previousClubs: [{ clubId: 'ATL', clubName: 'Atlético de Madrid', years: '2011-2024', titles: ['La Liga x2', 'Europa League x2'] }], history: []
  },
  {
    id: 'RM_FLICK', name: 'Hans-Dieter', surname: 'Flick', nationality: 'Alemania', age: 60, birthDate: new Date(1965, 1, 24), currentClubId: '1708', leagueId: 'L_ESP_1',
    attributes: rmAttr(16, 17, 13, 14, 14, 12), personality: 'LEADER', reputation: 84, internationalReputation: 88,
    biography: 'Artífice del sextete con el Bayern de Múnich, destaca por su enfoque táctico moderno y su capacidad para motivar a los jugadores. Recientemente asumió en Barcelona.',
    preferredFormation: '4-2-3-1 Doble Pivote', tacticalStyle: 'ATTACK', pressIntensity: 'HIGH', possessionVsCounter: 'POSSESSION', playingStyle: 'Fútbol vertical, presión tras pérdida y ataque combinativo',
    careerHonours: ['Champions League x1', 'Bundesliga x2', 'Copa de Alemania x1'],
    previousClubs: [{ clubId: 'FCB', clubName: 'Bayern Munich', years: '2019-2021', titles: ['Champions League x1', 'Bundesliga x2'] }], history: []
  },

  // ITALIA - L_ITA_1
  {
    id: 'RM_INZAGHI', name: 'Simone', surname: 'Inzaghi', nationality: 'Italia', age: 49, birthDate: new Date(1975, 3, 9), currentClubId: '1135', leagueId: 'L_ITA_1',
    attributes: rmAttr(15, 15, 14, 13, 13, 12), personality: 'PASSIONATE', reputation: 84, internationalReputation: 82,
    biography: 'Conocido por su trabajo en el Inter, donde ha ganado títulos y desarrollado un estilo de juego ofensivo y atractivo, manteniendo la solidez defensiva italiana.',
    preferredFormation: '3-5-2 Carrileros', tacticalStyle: 'ATTACK', pressIntensity: 'MEDIUM', possessionVsCounter: 'BALANCED', playingStyle: 'Fútbol directo, ataques por los costados y transiciones rápidas',
    careerHonours: ['Serie A x1', 'Copa Italia x2'],
    previousClubs: [{ clubId: 'LAZ', clubName: 'Lazio', years: '2016-2021', titles: ['Copa Italia x1'] }], history: []
  },
  {
    id: 'RM_MOTTA', name: 'Thiago', surname: 'Motta', nationality: 'Italia', age: 42, birthDate: new Date(1982, 7, 28), currentClubId: '1139', leagueId: 'L_ITA_1',
    attributes: rmAttr(14, 16, 12, 11, 13, 14), personality: 'VISIONARY', reputation: 78, internationalReputation: 75,
    biography: 'Un joven entrenador con ideas tácticas innovadoras, ha sorprendido en la Serie A con su fútbol propositivo. Recientemente asumió la dirección técnica de la Juventus.',
    preferredFormation: '4-3-3 Ofensiva', tacticalStyle: 'CONTROL', pressIntensity: 'HIGH', possessionVsCounter: 'POSSESSION', playingStyle: 'Fútbol de posesión con defensa zonal y ataque posicional',
    careerHonours: [],
    previousClubs: [{ clubId: 'BOL', clubName: 'Bologna', years: '2022-2024', titles: [] }], history: []
  },
  {
    id: 'RM_CONTE', name: 'Antonio', surname: 'Conte', nationality: 'Italia', age: 55, birthDate: new Date(1969, 6, 31), currentClubId: '1150', leagueId: 'L_ITA_1',
    attributes: rmAttr(17, 16, 15, 16, 14, 11), personality: 'DISCIPLINARIAN', reputation: 87, internationalReputation: 89,
    biography: 'Famoso por su intensa disciplina táctica y su sistema 3-5-2. Ha ganado títulos en Italia e Inglaterra, exigiendo siempre el máximo de sus jugadores.',
    preferredFormation: '3-5-2 Carrileros', tacticalStyle: 'DEFENSE', pressIntensity: 'HIGH', possessionVsCounter: 'COUNTER', playingStyle: 'Defensa sólida, carrileros profundos y transiciones rápidas',
    careerHonours: ['Serie A x4', 'Premier League x1', 'FA Cup x1'],
    previousClubs: [{ clubId: 'JUV', clubName: 'Juventus', years: '2011-2014', titles: ['Serie A x3'] }, { clubId: 'CHE', clubName: 'Chelsea', years: '2016-2018', titles: ['Premier League x1'] }], history: []
  },
  {
    id: 'RM_PIOLI', name: 'Stefano', surname: 'Pioli', nationality: 'Italia', age: 59, birthDate: new Date(1965, 9, 19), currentClubId: '1099', leagueId: 'L_ITA_1',
    attributes: rmAttr(15, 14, 14, 13, 13, 13), personality: 'CALM', reputation: 80, internationalReputation: 78,
    biography: 'Entrenador con una larga trayectoria en Italia, logró el Scudetto con el AC Milan, destacando por su capacidad para construir equipos cohesionados.',
    preferredFormation: '4-2-3-1 Doble Pivote', tacticalStyle: 'BALANCED', pressIntensity: 'MEDIUM', possessionVsCounter: 'BALANCED', playingStyle: 'Fútbol equilibrado, solidez defensiva y aprovechamiento de individualidades',
    careerHonours: ['Serie A x1'],
    previousClubs: [{ clubId: 'ACM', clubName: 'AC Milan', years: '2019-2024', titles: ['Serie A x1'] }], history: []
  },

  // ALEMANIA - L_DEU_1
  {
    id: 'RM_KOMPANY', name: 'Vincent', surname: 'Kompany', nationality: 'Bélgica', age: 39, birthDate: new Date(1986, 3, 10), currentClubId: '915', leagueId: 'L_DEU_1',
    attributes: rmAttr(14, 15, 13, 14, 12, 13), personality: 'LEADER', reputation: 79, internationalReputation: 75,
    biography: 'Ex-defensor central de élite, conocido por su liderazgo y su estilo de juego basado en la posesión y la construcción desde atrás. Recientemente asumió en Bayern Munich.',
    preferredFormation: '4-3-3 Ofensiva', tacticalStyle: 'CONTROL', pressIntensity: 'HIGH', possessionVsCounter: 'POSSESSION', playingStyle: 'Fútbol de posesión, salida limpia y presión tras pérdida',
    careerHonours: ['Championship x1'],
    previousClubs: [{ clubId: 'BUR', clubName: 'Burnley', years: '2022-2024', titles: ['Championship x1'] }], history: []
  },
  {
    id: 'RM_ALONSO', name: 'Xabi', surname: 'Alonso', nationality: 'España', age: 43, birthDate: new Date(1981, 10, 25), currentClubId: '901', leagueId: 'L_DEU_1',
    attributes: rmAttr(16, 18, 13, 12, 15, 14), personality: 'VISIONARY', reputation: 86, internationalReputation: 88,
    biography: 'Joven entrenador con una meteórica carrera, transformó al Bayer Leverkusen en un equipo dominante con un fútbol atractivo y efectivo, basado en la versatilidad táctica.',
    preferredFormation: '3-4-3', tacticalStyle: 'CONTROL', pressIntensity: 'HIGH', possessionVsCounter: 'POSSESSION', playingStyle: 'Fútbol posicional, ataques por los costados y mucha fluidez',
    careerHonours: ['Bundesliga x1', 'Copa de Alemania x1'],
    previousClubs: [], history: []
  },

  // FRANCIA - L_FRA_1
  {
    id: 'RM_ENRIQUE', name: 'Luis', surname: 'Enrique', nationality: 'España', age: 55, birthDate: new Date(1970, 4, 8), currentClubId: '868', leagueId: 'L_FRA_1',
    attributes: rmAttr(17, 17, 14, 15, 15, 14), personality: 'PASSIONATE', reputation: 89, internationalReputation: 90,
    biography: 'Un entrenador de fuerte carácter y estilo de juego ofensivo, ha dirigido a grandes clubes y a la selección española, siempre buscando la iniciativa en el campo.',
    preferredFormation: '4-3-3 Ofensiva', tacticalStyle: 'ATTACK', pressIntensity: 'HIGH', possessionVsCounter: 'POSSESSION', playingStyle: 'Fútbol vertical, presión constante y juego combinativo',
    careerHonours: ['La Liga x2', 'Champions League x1', 'Copa del Rey x2'],
    previousClubs: [{ clubId: 'ROM', clubName: 'AS Roma', years: '2011-2012', titles: [] }, { clubId: 'FCB', clubName: 'Barcelona', years: '2014-2017', titles: ['La Liga x2', 'Champions League x1'] }], history: []
  },

  // PAÍSES BAJOS - L_NLD_1
  {
    id: 'RM_FARIOLI', name: 'Francesco', surname: 'Farioli', nationality: 'Italia', age: 36, birthDate: new Date(1988, 3, 25), currentClubId: '992', leagueId: 'L_NLD_1',
    attributes: rmAttr(13, 15, 11, 10, 12, 14), personality: 'VISIONARY', reputation: 72, internationalReputation: 68,
    biography: 'Joven técnico italiano con ideas modernas, conocido por su enfoque en el fútbol de posesión y una defensa organizada. Actualmente en el Ajax.',
    preferredFormation: '4-3-3 Ofensiva', tacticalStyle: 'CONTROL', pressIntensity: 'MEDIUM', possessionVsCounter: 'POSSESSION', playingStyle: 'Fútbol de posesión, control del balón y salida limpia desde atrás',
    careerHonours: [],
    previousClubs: [{ clubId: 'NICE', clubName: 'OGC Nice', years: '2023-2024', titles: [] }], history: []
  },

  // PORTUGAL - L_PRT_1
  {
    id: 'RM_RUI_PEDRO', name: 'Rui', surname: 'Pedro', nationality: 'Portugal', age: 49, birthDate: new Date(1976, 5, 15), currentClubId: '1489', leagueId: 'L_PRT_1',
    attributes: rmAttr(14, 15, 12, 12, 13, 12), personality: 'CALM', reputation: 74, internationalReputation: 70,
    biography: 'Entrenador portugués con experiencia en el fútbol local, busca consolidar su carrera en la élite. Su estilo prioriza la organización táctica.',
    preferredFormation: '4-2-3-1 Doble Pivote', tacticalStyle: 'BALANCED', pressIntensity: 'MEDIUM', possessionVsCounter: 'BALANCED', playingStyle: 'Fútbol organizado, solidez defensiva y transiciones rápidas',
    careerHonours: [],
    previousClubs: [], history: []
  },

  // TURQUÍA - L_TUR_1
  {
    id: 'RM_JOSE', name: 'José', surname: 'Mourinho', nationality: 'Portugal', age: 62, birthDate: new Date(1963, 0, 26), currentClubId: '1870', leagueId: 'L_TUR_1',
    attributes: rmAttr(17, 18, 16, 15, 16, 14), personality: 'DISCIPLINARIAN', reputation: 90, internationalReputation: 95,
    biography: 'El "Special One" es uno de los entrenadores más ganadores, conocido por su mentalidad defensiva, el pragmatismo y la habilidad para ganar títulos en diversas ligas.',
    preferredFormation: '4-2-3-1 Doble Pivote', tacticalStyle: 'DEFENSE', pressIntensity: 'LOW', possessionVsCounter: 'COUNTER', playingStyle: 'Fútbol pragmático, defensa sólida y contraataques letales',
    careerHonours: ['Champions League x2', 'Europa League x2', 'Premier League x3', 'Serie A x2', 'La Liga x1', 'Primeira Liga x2'],
    previousClubs: [{ clubId: 'POR', clubName: 'Porto', years: '2002-2004', titles: ['Champions League x1'] }, { clubId: 'CHE', clubName: 'Chelsea', years: '2004-2007', titles: ['Premier League x2'] }], history: []
  },

  // ARGENTINA - L_ARG_1
  {
    id: 'RM_GALLARDO', name: 'Marcelo', surname: 'Gallardo', nationality: 'Argentina', age: 49, birthDate: new Date(1976, 1, 18), currentClubId: null, leagueId: 'L_ARG_1',
    attributes: rmAttr(16, 16, 14, 15, 14, 13), personality: 'VISIONARY', reputation: 82, internationalReputation: 85,
    biography: 'Uno de los entrenadores más exitosos en la historia de River Plate, reconocido por su estilo de juego ofensivo y la constante reinvención de sus equipos. Desempleado, en busca de un nuevo desafío.',
    preferredFormation: '4-3-3 Ofensiva', tacticalStyle: 'ATTACK', pressIntensity: 'HIGH', possessionVsCounter: 'POSSESSION', playingStyle: 'Fútbol ofensivo, presión constante y juego combinativo',
    careerHonours: ['Copa Libertadores x2', 'Copa Sudamericana x1'],
    previousClubs: [{ clubId: 'MON', clubName: 'Nacional (Uru)', years: '2011-2012', titles: [] }, { clubId: 'RIV', clubName: 'River Plate', years: '2014-2022', titles: ['Copa Libertadores x2'] }], history: []
  },
  {
    id: 'RM_BOCHE', name: 'Rodolfo', surname: 'Arruabarrena', nationality: 'Argentina', age: 49, birthDate: new Date(1975, 6, 20), currentClubId: '82', leagueId: 'L_ARG_1',
    attributes: rmAttr(13, 12, 12, 13, 11, 10), personality: 'PASSIONATE', reputation: 68, internationalReputation: 65,
    biography: 'Ex-lateral izquierdo con una destacada carrera en Boca Juniors, ha dirigido en Argentina y en el extranjero, buscando inculcar un estilo de juego intenso y ofensivo.',
    preferredFormation: '4-3-3 Ofensiva', tacticalStyle: 'ATTACK', pressIntensity: 'MEDIUM', possessionVsCounter: 'BALANCED', playingStyle: 'Fútbol dinámico, ataque por bandas y presión en campo rival',
    careerHonours: ['Primera División Argentina x1'],
    previousClubs: [{ clubId: 'BOC', clubName: 'Boca Juniors', years: '2014-2016', titles: ['Primera División Argentina x1'] }], history: []
  },
  {
    id: 'RM_GUEDE', name: 'Pedro', surname: 'Guede', nationality: 'Argentina', age: 54, birthDate: new Date(1970, 9, 17), currentClubId: '96', leagueId: 'L_ARG_1',
    attributes: rmAttr(13, 12, 13, 14, 11, 10), personality: 'LEADER', reputation: 65, internationalReputation: 60,
    biography: 'Entrenador argentino con experiencia en Chile y México, conocido por su estilo ofensivo y su predilección por esquemas de tres defensores. Actualmente en San Lorenzo.',
    preferredFormation: '3-5-2 Carrileros', tacticalStyle: 'ATTACK', pressIntensity: 'HIGH', possessionVsCounter: 'BALANCED', playingStyle: 'Juego vertical, presión alta y ataque con muchos jugadores',
    careerHonours: ['Copa Chile x1'],
    previousClubs: [{ clubId: 'COLO', clubName: 'Colo-Colo', years: '2016-2018', titles: ['Copa Chile x1'] }], history: []
  },

  // BRASIL - L_BRA_1
  {
    id: 'RM_ABEL', name: 'Abel', surname: 'Ferreira', nationality: 'Portugal', age: 45, birthDate: new Date(1979, 11, 22), currentClubId: '329', leagueId: 'L_BRA_1',
    attributes: rmAttr(16, 15, 14, 15, 14, 12), personality: 'DISCIPLINARIAN', reputation: 83, internationalReputation: 85,
    biography: 'El exitoso entrenador portugués que ha dominado el fútbol sudamericano con Palmeiras, destacando por su pragmatismo y la versatilidad táctica.',
    preferredFormation: '4-2-3-1 Doble Pivote', tacticalStyle: 'BALANCED', pressIntensity: 'MEDIUM', possessionVsCounter: 'COUNTER', playingStyle: 'Fútbol competitivo, defensa sólida y transiciones rápidas',
    careerHonours: ['Copa Libertadores x2', 'Brasileirão x2'],
    previousClubs: [{ clubId: 'PAL', clubName: 'Palmeiras', years: '2020-2024', titles: ['Copa Libertadores x2'] }], history: []
  },
  {
    id: 'RM_DORIVAL', name: 'Dorival', surname: 'Júnior', nationality: 'Brasil', age: 63, birthDate: new Date(1962, 3, 25), currentClubId: '322', leagueId: 'L_BRA_1',
    attributes: rmAttr(14, 13, 13, 14, 12, 11), personality: 'CALM', reputation: 72, internationalReputation: 70,
    biography: 'Entrenador con amplia experiencia en el fútbol brasileño, conocido por su gestión de grupo y su capacidad para hacer jugar bien a sus equipos. Actualmente en Flamengo.',
    preferredFormation: '4-3-3 Ofensiva', tacticalStyle: 'ATTACK', pressIntensity: 'LOW', possessionVsCounter: 'POSSESSION', playingStyle: 'Fútbol ofensivo, con posesión y creación de juego',
    careerHonours: ['Copa Libertadores x1', 'Copa de Brasil x1'],
    previousClubs: [{ clubId: 'FLA', clubName: 'Flamengo', years: '2022-2023', titles: ['Copa Libertadores x1'] }], history: []
  },
];


export const STAFF_NAMES = {
    names: ["Marcelo", "Ramón", "Carlos", "Miguel", "Gustavo", "Eduardo", "Ricardo", "Gabriel", "Sebastián", "Diego", "Lionel", "Gerardo", "Jorge"],
    surnames: ["Gallardo", "Bianchi", "Bilardo", "Menotti", "Bielsa", "Russo", "Alfaro", "Domínguez", "Milito", "Simeone", "Scaloni", "Martino", "Almirón"]
};

export const POS_DEFINITIONS = {
    GK: [Position.GK],
    DEF: [Position.SW, Position.DC, Position.DR, Position.DL],
    DM: [Position.DM, Position.DMR, Position.DML],
    MID: [Position.MC, Position.ML, Position.MR],
    ATT: [Position.AM, Position.AMR, Position.AML, Position.ST, Position.STR, Position.STL]
};
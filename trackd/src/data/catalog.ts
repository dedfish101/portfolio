export type MediaType = 'movie' | 'series' | 'anime'

export interface Title {
  id: string
  name: string
  type: MediaType
  year: number
  genres: string[]
  tags: string[]
  synopsis: string
  score: number // community score 0-10
  members: number // popularity
  status: 'released' | 'upcoming'
  releaseDate?: string // ISO, for upcoming
  episodes?: number
  runtime?: number // minutes, for movies
  creator: string
  palette: number
  /** Override query for external APIs (Jikan/TVMaze) when the display name is stylized */
  search?: string
  /** Wikipedia article title for movies */
  wiki?: string
}

export const GENRES = [
  'Action', 'Adventure', 'Animation', 'Comedy', 'Crime', 'Drama', 'Fantasy',
  'Horror', 'Mystery', 'Romance', 'Sci-Fi', 'Slice of Life', 'Thriller', 'Psychological',
]

export const CATALOG: Title[] = [
  // ---------- MOVIES ----------
  {
    id: 'inception', wiki: 'Inception', name: 'Inception', type: 'movie', year: 2010,
    genres: ['Sci-Fi', 'Thriller', 'Action'], tags: ['dreams', 'heist', 'mind-bending', 'nolan'],
    synopsis: 'A skilled thief who steals secrets from within dreams is offered a chance to have his past crimes forgiven — if he can plant an idea instead of stealing one.',
    score: 8.8, members: 2400000, status: 'released', runtime: 148, creator: 'Christopher Nolan', palette: 0,
  },
  {
    id: 'interstellar', wiki: 'Interstellar (film)', name: 'Interstellar', type: 'movie', year: 2014,
    genres: ['Sci-Fi', 'Drama', 'Adventure'], tags: ['space', 'time', 'family', 'nolan'],
    synopsis: 'With Earth dying, a team of explorers travels through a wormhole in search of a new home for humanity.',
    score: 8.7, members: 2100000, status: 'released', runtime: 169, creator: 'Christopher Nolan', palette: 1,
  },
  {
    id: 'parasite', wiki: 'Parasite (2019 film)', name: 'Parasite', type: 'movie', year: 2019,
    genres: ['Thriller', 'Drama', 'Comedy'], tags: ['class', 'dark-comedy', 'korean', 'oscar-winner'],
    synopsis: 'A poor family schemes their way into the household of a wealthy family, until an unexpected discovery threatens everything.',
    score: 8.5, members: 1600000, status: 'released', runtime: 132, creator: 'Bong Joon-ho', palette: 2,
  },
  {
    id: 'the-dark-knight', wiki: 'The Dark Knight', name: 'The Dark Knight', type: 'movie', year: 2008,
    genres: ['Action', 'Crime', 'Drama'], tags: ['superhero', 'joker', 'nolan', 'gotham'],
    synopsis: 'Batman faces the Joker, a criminal mastermind who wants to plunge Gotham into anarchy and force its hero to cross the line.',
    score: 9.0, members: 2700000, status: 'released', runtime: 152, creator: 'Christopher Nolan', palette: 3,
  },
  {
    id: 'spirited-away', wiki: 'Spirited Away', name: 'Spirited Away', type: 'movie', year: 2001,
    genres: ['Animation', 'Fantasy', 'Adventure'], tags: ['ghibli', 'spirits', 'coming-of-age', 'miyazaki'],
    synopsis: 'A ten-year-old girl wanders into a world of spirits and must work in a bathhouse to free herself and her parents.',
    score: 8.6, members: 1500000, status: 'released', runtime: 125, creator: 'Hayao Miyazaki', palette: 4,
  },
  {
    id: 'dune-part-two', wiki: 'Dune: Part Two', name: 'Dune: Part Two', type: 'movie', year: 2024,
    genres: ['Sci-Fi', 'Adventure', 'Drama'], tags: ['desert', 'epic', 'prophecy', 'villeneuve'],
    synopsis: 'Paul Atreides unites with the Fremen to wage war against House Harkonnen while confronting a terrible prophecy.',
    score: 8.5, members: 1100000, status: 'released', runtime: 166, creator: 'Denis Villeneuve', palette: 5,
  },
  {
    id: 'everything-everywhere', wiki: 'Everything Everywhere All at Once', name: 'Everything Everywhere All at Once', type: 'movie', year: 2022,
    genres: ['Sci-Fi', 'Comedy', 'Drama'], tags: ['multiverse', 'family', 'absurdist', 'oscar-winner'],
    synopsis: 'A laundromat owner is swept into a multiversal war where she alone can save existence — by connecting with the lives she could have led.',
    score: 7.8, members: 900000, status: 'released', runtime: 139, creator: 'Daniels', palette: 6,
  },
  {
    id: 'whiplash', wiki: 'Whiplash (2014 film)', name: 'Whiplash', type: 'movie', year: 2014,
    genres: ['Drama', 'Psychological'], tags: ['music', 'obsession', 'mentor', 'jazz'],
    synopsis: 'A young drummer enrolls at a cutthroat conservatory where an abusive instructor will push him to greatness — or destruction.',
    score: 8.5, members: 1000000, status: 'released', runtime: 106, creator: 'Damien Chazelle', palette: 7,
  },
  {
    id: 'get-out', wiki: 'Get Out', name: 'Get Out', type: 'movie', year: 2017,
    genres: ['Horror', 'Thriller', 'Mystery'], tags: ['social-horror', 'twist', 'peele'],
    synopsis: 'A young Black man visits his white girlfriend\'s family estate, where simmering unease curdles into a nightmare.',
    score: 7.8, members: 800000, status: 'released', runtime: 104, creator: 'Jordan Peele', palette: 8,
  },
  {
    id: 'spider-verse', wiki: 'Spider-Man: Across the Spider-Verse', name: 'Spider-Man: Across the Spider-Verse', type: 'movie', year: 2023,
    genres: ['Animation', 'Action', 'Adventure'], tags: ['multiverse', 'superhero', 'stylized'],
    synopsis: 'Miles Morales is catapulted across the multiverse, where a society of Spider-People clashes over how to handle a new threat.',
    score: 8.6, members: 950000, status: 'released', runtime: 140, creator: 'Sony Animation', palette: 9,
  },
  {
    id: 'oldboy', wiki: 'Oldboy (2003 film)', name: 'Oldboy', type: 'movie', year: 2003,
    genres: ['Thriller', 'Mystery', 'Action'], tags: ['revenge', 'twist', 'korean'],
    synopsis: 'Imprisoned for 15 years without explanation, a man is released and given five days to discover why.',
    score: 8.4, members: 650000, status: 'released', runtime: 120, creator: 'Park Chan-wook', palette: 10,
  },
  {
    id: 'la-la-land', wiki: 'La La Land', name: 'La La Land', type: 'movie', year: 2016,
    genres: ['Romance', 'Drama', 'Comedy'], tags: ['music', 'dreams', 'bittersweet', 'jazz'],
    synopsis: 'An aspiring actress and a jazz pianist fall in love in Los Angeles while chasing dreams that may pull them apart.',
    score: 8.0, members: 1200000, status: 'released', runtime: 128, creator: 'Damien Chazelle', palette: 11,
  },
  // ---------- SERIES ----------
  {
    id: 'breaking-bad', name: 'Breaking Bad', type: 'series', year: 2008,
    genres: ['Crime', 'Drama', 'Thriller'], tags: ['transformation', 'antihero', 'desert'],
    synopsis: 'A terminally ill chemistry teacher partners with a former student to cook meth, descending from desperation into empire.',
    score: 9.5, members: 2000000, status: 'released', episodes: 62, creator: 'Vince Gilligan', palette: 12,
  },
  {
    id: 'the-wire', name: 'The Wire', type: 'series', year: 2002,
    genres: ['Crime', 'Drama'], tags: ['baltimore', 'institutions', 'realism'],
    synopsis: 'Baltimore through the eyes of police, dealers, dockworkers, politicians, teachers and journalists — a city as a living system.',
    score: 9.3, members: 700000, status: 'released', episodes: 60, creator: 'David Simon', palette: 13,
  },
  {
    id: 'severance', name: 'Severance', type: 'series', year: 2022,
    genres: ['Sci-Fi', 'Thriller', 'Mystery'], tags: ['corporate', 'identity', 'dystopia'],
    synopsis: 'Employees at Lumon Industries undergo a procedure splitting their memories between work and personal lives — until the two worlds begin to leak.',
    score: 8.7, members: 600000, status: 'released', episodes: 19, creator: 'Dan Erickson', palette: 14,
  },
  {
    id: 'succession', name: 'Succession', type: 'series', year: 2018,
    genres: ['Drama', 'Comedy'], tags: ['family', 'power', 'media-empire'],
    synopsis: 'The Roy family battles for control of a global media empire as their aging father refuses to let go.',
    score: 8.9, members: 550000, status: 'released', episodes: 39, creator: 'Jesse Armstrong', palette: 15,
  },
  {
    id: 'dark', name: 'Dark', type: 'series', year: 2017,
    genres: ['Sci-Fi', 'Mystery', 'Thriller'], tags: ['time-travel', 'german', 'paradox', 'mind-bending'],
    synopsis: 'A child\'s disappearance exposes four families\' secrets and a time-travel conspiracy spanning generations in a small German town.',
    score: 8.7, members: 480000, status: 'released', episodes: 26, creator: 'Baran bo Odar', palette: 16,
  },
  {
    id: 'true-detective-s1', search: 'True Detective', name: 'True Detective (S1)', type: 'series', year: 2014,
    genres: ['Crime', 'Mystery', 'Drama'], tags: ['detectives', 'philosophy', 'louisiana'],
    synopsis: 'Two detectives revisit a ritualistic murder case that has haunted them across seventeen years.',
    score: 9.0, members: 620000, status: 'released', episodes: 8, creator: 'Nic Pizzolatto', palette: 17,
  },
  {
    id: 'stranger-things', name: 'Stranger Things', type: 'series', year: 2016,
    genres: ['Sci-Fi', 'Horror', 'Adventure'], tags: ['80s', 'kids', 'upside-down', 'nostalgia'],
    synopsis: 'When a boy vanishes in 1980s Indiana, his friends uncover a secret lab, a strange girl, and a monstrous parallel dimension.',
    score: 8.6, members: 1300000, status: 'released', episodes: 42, creator: 'Duffer Brothers', palette: 18,
  },
  {
    id: 'the-bear', name: 'The Bear', type: 'series', year: 2022,
    genres: ['Drama', 'Comedy'], tags: ['kitchen', 'grief', 'chicago', 'stress'],
    synopsis: 'A fine-dining chef returns to Chicago to run his late brother\'s chaotic sandwich shop and rebuild it — and himself.',
    score: 8.5, members: 400000, status: 'released', episodes: 28, creator: 'Christopher Storer', palette: 19,
  },
  {
    id: 'chernobyl', name: 'Chernobyl', type: 'series', year: 2019,
    genres: ['Drama', 'Thriller'], tags: ['disaster', 'history', 'miniseries'],
    synopsis: 'The story of the 1986 nuclear disaster and the sacrifices made to contain the truth as much as the radiation.',
    score: 9.3, members: 800000, status: 'released', episodes: 5, creator: 'Craig Mazin', palette: 20,
  },
  {
    id: 'andor', name: 'Andor', type: 'series', year: 2022,
    genres: ['Sci-Fi', 'Thriller', 'Drama'], tags: ['star-wars', 'rebellion', 'spy'],
    synopsis: 'In the shadow of the Empire, an ordinary thief becomes the spark of a rebellion in this grounded Star Wars spy thriller.',
    score: 8.4, members: 350000, status: 'released', episodes: 24, creator: 'Tony Gilroy', palette: 21,
  },
  // ---------- ANIME ----------
  {
    id: 'fullmetal-brotherhood', search: 'Fullmetal Alchemist Brotherhood', name: 'Fullmetal Alchemist: Brotherhood', type: 'anime', year: 2009,
    genres: ['Action', 'Adventure', 'Fantasy'], tags: ['alchemy', 'brothers', 'shonen', 'sacrifice'],
    synopsis: 'Two brothers pay a terrible price for forbidden alchemy and journey to restore what they lost, uncovering a nationwide conspiracy.',
    score: 9.1, members: 3300000, status: 'released', episodes: 64, creator: 'Bones', palette: 22,
  },
  {
    id: 'attack-on-titan', search: 'Shingeki no Kyojin', name: 'Attack on Titan', type: 'anime', year: 2013,
    genres: ['Action', 'Drama', 'Fantasy'], tags: ['titans', 'war', 'twist', 'dark'],
    synopsis: 'Humanity survives behind walls that keep out man-eating titans — until the walls fall and every truth they know unravels.',
    score: 9.0, members: 3900000, status: 'released', episodes: 94, creator: 'Wit / MAPPA', palette: 23,
  },
  {
    id: 'steins-gate', name: 'Steins;Gate', type: 'anime', year: 2011,
    genres: ['Sci-Fi', 'Thriller', 'Drama'], tags: ['time-travel', 'lab', 'mind-bending', 'romance-subplot'],
    synopsis: 'A self-proclaimed mad scientist accidentally invents a way to send messages to the past, and every change costs more than the last.',
    score: 9.1, members: 2600000, status: 'released', episodes: 24, creator: 'White Fox', palette: 24,
  },
  {
    id: 'frieren', search: 'Sousou no Frieren', name: 'Frieren: Beyond Journey\'s End', type: 'anime', year: 2023,
    genres: ['Fantasy', 'Adventure', 'Drama'], tags: ['elf', 'mortality', 'gentle', 'journey'],
    synopsis: 'An elven mage outlives her hero companions and retraces their journey, learning too late — and just in time — what humans meant to her.',
    score: 9.3, members: 900000, status: 'released', episodes: 28, creator: 'Madhouse', palette: 25,
  },
  {
    id: 'one-piece', name: 'One Piece', type: 'anime', year: 1999,
    genres: ['Action', 'Adventure', 'Comedy'], tags: ['pirates', 'shonen', 'long-running', 'friendship'],
    synopsis: 'Monkey D. Luffy and his crew sail the Grand Line in search of the ultimate treasure, the One Piece, to crown him Pirate King.',
    score: 8.7, members: 2300000, status: 'released', episodes: 1100, creator: 'Toei Animation', palette: 26,
  },
  {
    id: 'jujutsu-kaisen', name: 'Jujutsu Kaisen', type: 'anime', year: 2020,
    genres: ['Action', 'Fantasy', 'Horror'], tags: ['curses', 'shonen', 'sorcery'],
    synopsis: 'A teenager swallows a cursed relic and enrolls in a school of sorcerers who exorcise curses born from human negativity.',
    score: 8.6, members: 2200000, status: 'released', episodes: 47, creator: 'MAPPA', palette: 27,
  },
  {
    id: 'vinland-saga', name: 'Vinland Saga', type: 'anime', year: 2019,
    genres: ['Action', 'Adventure', 'Drama'], tags: ['vikings', 'revenge', 'redemption', 'historical'],
    synopsis: 'A boy raised on revenge among Viking mercenaries slowly discovers what it might mean to live without enemies.',
    score: 8.8, members: 1100000, status: 'released', episodes: 48, creator: 'Wit / MAPPA', palette: 28,
  },
  {
    id: 'mob-psycho', name: 'Mob Psycho 100', type: 'anime', year: 2016,
    genres: ['Action', 'Comedy', 'Slice of Life'], tags: ['psychic', 'coming-of-age', 'one-punch-creator'],
    synopsis: 'An overwhelmingly powerful psychic middle-schooler just wants to be normal, guided by a con-man mentor with surprisingly good advice.',
    score: 8.7, members: 1600000, status: 'released', episodes: 37, creator: 'Bones', palette: 29,
  },
  {
    id: 'your-name', search: 'Kimi no Na wa', name: 'Your Name', type: 'anime', year: 2016,
    genres: ['Romance', 'Fantasy', 'Drama'], tags: ['body-swap', 'comet', 'shinkai', 'film'],
    synopsis: 'A Tokyo boy and a rural girl begin swapping bodies, and their tangled connection races against a disaster neither understands.',
    score: 8.4, members: 2900000, status: 'released', runtime: 106, creator: 'Makoto Shinkai', palette: 30,
  },
  {
    id: 'cowboy-bebop', name: 'Cowboy Bebop', type: 'anime', year: 1998,
    genres: ['Sci-Fi', 'Action', 'Drama'], tags: ['bounty-hunters', 'jazz', 'space', 'episodic'],
    synopsis: 'A ragtag crew of bounty hunters drifts through space in 2071, outrunning their pasts to a jazz soundtrack.',
    score: 8.9, members: 1900000, status: 'released', episodes: 26, creator: 'Sunrise', palette: 31,
  },
  {
    id: 'death-note', name: 'Death Note', type: 'anime', year: 2006,
    genres: ['Thriller', 'Mystery', 'Psychological'], tags: ['cat-and-mouse', 'notebook', 'genius'],
    synopsis: 'A brilliant student finds a notebook that kills anyone whose name is written in it, and a legendary detective hunts him.',
    score: 8.6, members: 4000000, status: 'released', episodes: 37, creator: 'Madhouse', palette: 32,
  },
  {
    id: 'demon-slayer', search: 'Kimetsu no Yaiba', name: 'Demon Slayer', type: 'anime', year: 2019,
    genres: ['Action', 'Fantasy', 'Adventure'], tags: ['demons', 'shonen', 'breathing-styles', 'family'],
    synopsis: 'After demons slaughter his family and turn his sister, Tanjiro joins the Demon Slayer Corps to find a cure.',
    score: 8.5, members: 3100000, status: 'released', episodes: 55, creator: 'ufotable', palette: 33,
  },
  // ---------- UPCOMING ----------
  {
    id: 'dune-part-three', wiki: 'Dune: Part Three', name: 'Dune: Part Three', type: 'movie', year: 2026,
    genres: ['Sci-Fi', 'Adventure', 'Drama'], tags: ['desert', 'epic', 'villeneuve', 'finale'],
    synopsis: 'The conclusion of Denis Villeneuve\'s Dune trilogy, adapting Dune Messiah as Paul\'s empire and prophecy collide.',
    score: 0, members: 400000, status: 'upcoming', releaseDate: '2026-12-18', runtime: 165, creator: 'Denis Villeneuve', palette: 5,
  },
  {
    id: 'stranger-things-5', search: 'Stranger Things', name: 'Stranger Things 5', type: 'series', year: 2026,
    genres: ['Sci-Fi', 'Horror', 'Adventure'], tags: ['80s', 'finale', 'upside-down'],
    synopsis: 'The final season: Hawkins stands cracked open, and the party reunites for a last stand against Vecna.',
    score: 0, members: 900000, status: 'upcoming', releaseDate: '2026-11-26', episodes: 8, creator: 'Duffer Brothers', palette: 18,
  },
  {
    id: 'chainsaw-man-reze', search: 'Chainsaw Man Reze', name: 'Chainsaw Man: Reze Arc', type: 'anime', year: 2026,
    genres: ['Action', 'Horror', 'Romance'], tags: ['devils', 'mappa', 'movie-arc'],
    synopsis: 'Denji meets a girl in the rain. The Reze arc adapts the manga\'s most explosive — and most heartbreaking — chapter.',
    score: 0, members: 700000, status: 'upcoming', releaseDate: '2026-09-19', runtime: 110, creator: 'MAPPA', palette: 34,
  },
  {
    id: 'frieren-s2', search: 'Sousou no Frieren 2nd Season', name: 'Frieren Season 2', type: 'anime', year: 2026,
    genres: ['Fantasy', 'Adventure', 'Drama'], tags: ['elf', 'journey', 'sequel'],
    synopsis: 'Frieren\'s journey north continues toward Aureole, the land where souls rest, as the first-class mage exam\'s fallout lingers.',
    score: 0, members: 500000, status: 'upcoming', releaseDate: '2026-08-28', episodes: 24, creator: 'Madhouse', palette: 25,
  },
  {
    id: 'avatar-fire-and-ash', wiki: 'Avatar: Fire and Ash', name: 'Avatar: Fire and Ash', type: 'movie', year: 2026,
    genres: ['Sci-Fi', 'Adventure', 'Action'], tags: ['pandora', 'cameron', '3d'],
    synopsis: 'The Sully family faces the Ash People, a fire Na\'vi clan, as Pandora\'s conflict spreads to new biomes.',
    score: 0, members: 300000, status: 'upcoming', releaseDate: '2026-08-14', runtime: 190, creator: 'James Cameron', palette: 35,
  },
  {
    id: 'one-punch-man-s3', search: 'One Punch Man 3', name: 'One-Punch Man Season 3', type: 'anime', year: 2026,
    genres: ['Action', 'Comedy'], tags: ['hero', 'monster-association', 'parody'],
    synopsis: 'Saitama returns as the Monster Association arc erupts — S-Class heroes descend into the monsters\' lair.',
    score: 0, members: 800000, status: 'upcoming', releaseDate: '2026-10-05', episodes: 12, creator: 'J.C.Staff', palette: 36,
  },
  {
    id: 'the-batman-2', wiki: 'The Batman Part II', name: 'The Batman Part II', type: 'movie', year: 2027,
    genres: ['Action', 'Crime', 'Thriller'], tags: ['gotham', 'noir', 'reeves'],
    synopsis: 'Matt Reeves\' noir Gotham saga continues as a changed Batman faces a city rebuilding after the flood.',
    score: 0, members: 350000, status: 'upcoming', releaseDate: '2027-10-01', runtime: 155, creator: 'Matt Reeves', palette: 3,
  },
  {
    id: 'spider-verse-3', wiki: 'Spider-Man: Beyond the Spider-Verse', name: 'Spider-Man: Beyond the Spider-Verse', type: 'movie', year: 2027,
    genres: ['Animation', 'Action', 'Adventure'], tags: ['multiverse', 'finale', 'miles'],
    synopsis: 'Miles Morales runs out of universes to hide in as the Spider-Verse trilogy reaches its finale.',
    score: 0, members: 450000, status: 'upcoming', releaseDate: '2027-06-04', runtime: 140, creator: 'Sony Animation', palette: 9,
  },
]

export const byId = new Map(CATALOG.map(t => [t.id, t]))

export function typeLabel(t: MediaType): string {
  return t === 'movie' ? 'Movie' : t === 'series' ? 'Series' : 'Anime'
}

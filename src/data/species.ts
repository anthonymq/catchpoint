/**
 * Common fishing species data for autocomplete suggestions
 * Organized by category for easy filtering
 */

export type SpeciesCategory = 'freshwater' | 'saltwater' | 'both';

export interface SpeciesData {
  id: string;
  name: string;
  commonNames: string[];
  category: SpeciesCategory;
}

export const FISHING_SPECIES: SpeciesData[] = [
  // Freshwater - Bass & Panfish
  {
    id: 'largemouth_bass',
    name: 'Largemouth Bass',
    commonNames: ['bigmouth bass', 'bucketmouth', 'green trout', 'linesides'],
    category: 'freshwater',
  },
  {
    id: 'smallmouth_bass',
    name: 'Smallmouth Bass',
    commonNames: ['smallie', 'brown bass', 'bronzeback', 'bare'],
    category: 'freshwater',
  },
  {
    id: 'spotted_bass',
    name: 'Spotted Bass',
    commonNames: ['spot', 'Kentucky bass', 'ouachita bass'],
    category: 'freshwater',
  },
  {
    id: 'rock_bass',
    name: 'Rock Bass',
    commonNames: ['rockie', 'goggle-eye', 'red eye'],
    category: 'freshwater',
  },
  {
    id: 'bluegill',
    name: 'Bluegill',
    commonNames: ['bream', 'brim', 'sunfish', 'copper nose', 'blue sunfish'],
    category: 'freshwater',
  },
  {
    id: 'redear_sunfish',
    name: 'Redear Sunfish',
    commonNames: ['redear', 'shellcracker', 'chinquapin'],
    category: 'freshwater',
  },
  {
    id: 'crappie',
    name: 'Crappie',
    commonNames: ['croppie', 'crop', 'speck', 'speckled perch', 'white perch'],
    category: 'freshwater',
  },
  {
    id: 'black_crappie',
    name: 'Black Crappie',
    commonNames: ['croppie', 'speck', 'calico bass'],
    category: 'freshwater',
  },
  {
    id: 'white_crappie',
    name: 'White Crappie',
    commonNames: ['croppie', 'speck', 'white perch'],
    category: 'freshwater',
  },
  {
    id: 'pumpkinseed',
    name: 'Pumpkinseed',
    commonNames: ['punky', 'sun perch', 'dollar sunfish'],
    category: 'freshwater',
  },
  {
    id: 'green_sunfish',
    name: 'Green Sunfish',
    commonNames: ['greenie', 'sand bass'],
    category: 'freshwater',
  },

  // Freshwater - Trout & Salmon
  {
    id: 'rainbow_trout',
    name: 'Rainbow Trout',
    commonNames: ['rainbow', 'bow', 'steelhead (lake)'],
    category: 'freshwater',
  },
  {
    id: 'brown_trout',
    name: 'Brown Trout',
    commonNames: ['brownie', 'German brown', 'sea trout (lake)'],
    category: 'freshwater',
  },
  {
    id: 'brook_trout',
    name: 'Brook Trout',
    commonNames: ['brookie', 'speckled trout', 'squaretail'],
    category: 'freshwater',
  },
  {
    id: 'lake_trout',
    name: 'Lake Trout',
    commonNames: ['laker', 'togue', 'grey trout', 'mackinaw'],
    category: 'freshwater',
  },
  {
    id: 'cutthroat_trout',
    name: 'Cutthroat Trout',
    commonNames: ['cutthroat', 'cutt', 'yellowfin trout'],
    category: 'freshwater',
  },
  {
    id: 'golden_trout',
    name: 'Golden Trout',
    commonNames: ['golden'],
    category: 'freshwater',
  },
  {
    id: 'chinook_salmon',
    name: 'Chinook Salmon',
    commonNames: ['king salmon', 'king', 'spring salmon', 'blackmouth'],
    category: 'both',
  },
  {
    id: 'coho_salmon',
    name: 'Coho Salmon',
    commonNames: ['silver salmon', 'silvers', 'hooknose'],
    category: 'both',
  },
  {
    id: 'sockeye_salmon',
    name: 'Sockeye Salmon',
    commonNames: ['red salmon', 'red', 'blueback'],
    category: 'both',
  },
  {
    id: 'pink_salmon',
    name: 'Pink Salmon',
    commonNames: ['humpback', 'humpy'],
    category: 'both',
  },
  {
    id: 'chum_salmon',
    name: 'Chum Salmon',
    commonNames: ['dog salmon', 'keta', 'fall salmon'],
    category: 'both',
  },

  // Freshwater - Pike & Muskie
  {
    id: 'northern_pike',
    name: 'Northern Pike',
    commonNames: ['pike', 'northern', 'jackfish', 'snake'],
    category: 'freshwater',
  },
  {
    id: 'muskellunge',
    name: 'Muskellunge',
    commonNames: ['muskie', 'musky', 'jumbo', ' Esox'],
    category: 'freshwater',
  },
  {
    id: 'tiger_muskie',
    name: 'Tiger Muskie',
    commonNames: ['tiger musky'],
    category: 'freshwater',
  },
  {
    id: 'chain_pickerel',
    name: 'Chain Pickerel',
    commonNames: ['pickerel', 'chain', 'jacks'],
    category: 'freshwater',
  },
  {
    id: 'grass_pickerel',
    name: 'Grass Pickerel',
    commonNames: ['grass pickerel', 'little pickerel'],
    category: 'freshwater',
  },

  // Freshwater - Catfish & Bullhead
  {
    id: 'channel_catfish',
    name: 'Channel Catfish',
    commonNames: ['channel cat', 'blue channel'],
    category: 'freshwater',
  },
  {
    id: 'blue_catfish',
    name: 'Blue Catfish',
    commonNames: ['blue cat', 'humpback blue'],
    category: 'freshwater',
  },
  {
    id: 'flathead_catfish',
    name: 'Flathead Catfish',
    commonNames: ['flathead', 'yellow cat', 'shovelhead'],
    category: 'freshwater',
  },
  {
    id: 'white_catfish',
    name: 'White Catfish',
    commonNames: ['white cat', 'fiddler'],
    category: 'freshwater',
  },
  {
    id: 'black_bullhead',
    name: 'Black Bullhead',
    commonNames: ['black bullhead', 'bullhead'],
    category: 'freshwater',
  },
  {
    id: 'brown_bullhead',
    name: 'Brown Bullhead',
    commonNames: ['brown bullhead', 'bullhead'],
    category: 'freshwater',
  },
  {
    id: 'yellow_bullhead',
    name: 'Yellow Bullhead',
    commonNames: ['yellow bullhead', 'bullhead'],
    category: 'freshwater',
  },

  // Freshwater - Carp & Suckers
  {
    id: 'common_carp',
    name: 'Common Carp',
    commonNames: ['carp', 'European carp'],
    category: 'freshwater',
  },
  {
    id: 'grass_carp',
    name: 'Grass Carp',
    commonNames: ['grasser', 'white amur'],
    category: 'freshwater',
  },
  {
    id: 'silver_carp',
    name: 'Silver Carp',
    commonNames: ['silver carp', 'flying carp'],
    category: 'freshwater',
  },
  {
    id: 'bighead_carp',
    name: 'Bighead Carp',
    commonNames: ['bighead'],
    category: 'freshwater',
  },
  {
    id: 'white_sucker',
    name: 'White Sucker',
    commonNames: ['sucker', 'common sucker'],
    category: 'freshwater',
  },
  {
    id: 'northern_hogsucker',
    name: 'Northern Hogsucker',
    commonNames: ['hogsucker', 'stoneroller'],
    category: 'freshwater',
  },
  {
    id: 'smallmouth_buffalo',
    name: 'Smallmouth Buffalo',
    commonNames: ['buffalo', 'smallmouth buffalo'],
    category: 'freshwater',
  },

  // Freshwater - Walleye, Sauger & Perch
  {
    id: 'walleye',
    name: 'Walleye',
    commonNames: ['walleyed pike', 'walleye pike', 'pike'],
    category: 'freshwater',
  },
  {
    id: 'sauger',
    name: 'Sauger',
    commonNames: ['sand pike'],
    category: 'freshwater',
  },
  {
    id: 'sauger_x_walleye',
    name: 'Saugeye',
    commonNames: ['sauger-ey'],
    category: 'freshwater',
  },
  {
    id: 'yellow_perch',
    name: 'Yellow Perch',
    commonNames: ['perch', 'lake perch'],
    category: 'freshwater',
  },
  {
    id: 'white_perch',
    name: 'White Perch',
    commonNames: ['perch'],
    category: 'freshwater',
  },
  {
    id: 'drum',
    name: 'Drum',
    commonNames: ['freshwater drum', 'sheepshead'],
    category: 'freshwater',
  },

  // Freshwater - Other
  {
    id: 'burbot',
    name: 'Burbot',
    commonNames: ['eelpout', 'maria', 'lawyer'],
    category: 'freshwater',
  },
  {
    id: 'bowfin',
    name: 'Bowfin',
    commonNames: ['bowfin', 'dogfish', 'mudfish', 'grinnel'],
    category: 'freshwater',
  },
  {
    id: 'longnose_gar',
    name: 'Longnose Gar',
    commonNames: ['gar', 'garpike'],
    category: 'freshwater',
  },
  {
    id: 'alligator_gar',
    name: 'Alligator Gar',
    commonNames: ['alligator gar'],
    category: 'freshwater',
  },
  {
    id: 'sturgeon',
    name: 'Sturgeon',
    commonNames: ['lake sturgeon', 'rock sturgeon'],
    category: 'freshwater',
  },
  {
    id: 'paddlefish',
    name: 'Paddlefish',
    commonNames: ['spoonbill', 'paddle fish'],
    category: 'freshwater',
  },

  // Saltwater - Tuna & Mackerel
  {
    id: 'bluefin_tuna',
    name: 'Bluefin Tuna',
    commonNames: ['bluefin', 'giant bluefin', 'horsemackerel'],
    category: 'saltwater',
  },
  {
    id: 'yellowfin_tuna',
    name: 'Yellowfin Tuna',
    commonNames: ['yellowfin', 'ahi'],
    category: 'saltwater',
  },
  {
    id: 'bigeye_tuna',
    name: 'Bigeye Tuna',
    commonNames: ['bigeye'],
    category: 'saltwater',
  },
  {
    id: 'albacore',
    name: 'Albacore',
    commonNames: ['albacore tuna', 'longfin tuna'],
    category: 'saltwater',
  },
  {
    id: 'bonito',
    name: 'Bonito',
    commonNames: ['Atlantic bonito'],
    category: 'saltwater',
  },
  {
    id: 'little_tunny',
    name: 'Little Tunny',
    commonNames: ['little tunny', 'false albacore'],
    category: 'saltwater',
  },

  // Saltwater - Billfish
  {
    id: 'blue_marlin',
    name: 'Blue Marlin',
    commonNames: ['blue marlin', 'marlin'],
    category: 'saltwater',
  },
  {
    id: 'white_marlin',
    name: 'White Marlin',
    commonNames: ['white marlin', ' Atlantic white marlin'],
    category: 'saltwater',
  },
  {
    id: 'sailfish',
    name: 'Sailfish',
    commonNames: ['sail fish', 'Atlantic sailfish'],
    category: 'saltwater',
  },
  {
    id: 'swordfish',
    name: 'Swordfish',
    commonNames: ['sword fish', 'broadbill'],
    category: 'saltwater',
  },

  // Saltwater - Inshore
  {
    id: 'striped_bass',
    name: 'Striped Bass',
    commonNames: ['striper', 'rockfish', 'linesider'],
    category: 'both',
  },
  {
    id: 'white_bass',
    name: 'White Bass',
    commonNames: ['white bass', 'sand bass'],
    category: 'freshwater',
  },
  {
    id: 'hybrid_striped_bass',
    name: 'Hybrid Striped Bass',
    commonNames: ['wiper', 'palmetto bass', 'hybrid'],
    category: 'freshwater',
  },
  {
    id: 'red_drum',
    name: 'Red Drum',
    commonNames: ['redfish', 'channel bass', 'spot tail'],
    category: 'saltwater',
  },
  {
    id: 'black_drum',
    name: 'Black Drum',
    commonNames: ['black drum', 'drum'],
    category: 'saltwater',
  },
  {
    id: 'spotted_seatrou',
    name: 'Spotted Seatrout',
    commonNames: ['seatrou', 'speckled trout', 'trout'],
    category: 'saltwater',
  },
  {
    id: 'weakfish',
    name: 'Weakfish',
    commonNames: ['sea trout', 'grey trout'],
    category: 'saltwater',
  },
  {
    id: 'southern_flounder',
    name: 'Southern Flounder',
    commonNames: ['flounder', 'flatfish'],
    category: 'saltwater',
  },
  {
    id: 'summer_flounder',
    name: 'Summer Flounder',
    commonNames: ['flounder', 'fluke'],
    category: 'saltwater',
  },

  // Saltwater - Snapper & Grouper
  {
    id: 'red_snapper',
    name: 'Red Snapper',
    commonNames: ['red snapper'],
    category: 'saltwater',
  },
  {
    id: 'mutton_snapper',
    name: 'Mutton Snapper',
    commonNames: ['mutton snapper'],
    category: 'saltwater',
  },
  {
    id: 'lane_snapper',
    name: 'Lane Snapper',
    commonNames: ['lane snapper'],
    category: 'saltwater',
  },
  {
    id: 'vermilion_snapper',
    name: 'Vermilion Snapper',
    commonNames: ['vermilion snapper', 'red snapper'],
    category: 'saltwater',
  },
  {
    id: 'gag_grouper',
    name: 'Gag Grouper',
    commonNames: ['gag', 'grouper'],
    category: 'saltwater',
  },
  {
    id: 'red_grouper',
    name: 'Red Grouper',
    commonNames: ['red grouper', 'grouper'],
    category: 'saltwater',
  },
  {
    id: 'scamp_grouper',
    name: 'Scamp Grouper',
    commonNames: ['scamp', 'grouper'],
    category: 'saltwater',
  },
  {
    id: 'black_grouper',
    name: 'Black Grouper',
    commonNames: ['black grouper', 'grouper'],
    category: 'saltwater',
  },

  // Saltwater - Reef Fish
  {
    id: 'mangrove_snapper',
    name: 'Mangrove Snapper',
    commonNames: ['mangrove snapper', 'gray snapper'],
    category: 'saltwater',
  },
  {
    id: 'cobia',
    name: 'Cobia',
    commonNames: ['cobia', 'ling', 'crab eater'],
    category: 'saltwater',
  },
  {
    id: 'amberjack',
    name: 'Amberjack',
    commonNames: ['amberjack', 'greater amberjack'],
    category: 'saltwater',
  },
  {
    id: 'greater_amberjack',
    name: 'Greater Amberjack',
    commonNames: ['amberjack'],
    category: 'saltwater',
  },
  {
    id: 'tripletail',
    name: 'Tripletail',
    commonNames: ['tripletail', 'black drum'],
    category: 'saltwater',
  },
  {
    id: 'permit',
    name: 'Permit',
    commonNames: ['permit'],
    category: 'saltwater',
  },
  {
    id: 'pompano',
    name: 'Pompano',
    commonNames: ['Florida pompano'],
    category: 'saltwater',
  },

  // Saltwater - Pelagic
  {
    id: 'mahi_mahi',
    name: 'Mahi Mahi',
    commonNames: ['dolphinfish', 'dolphin', ' dorado'],
    category: 'saltwater',
  },
  {
    id: 'wahoo',
    name: 'Wahoo',
    commonNames: ['wahoo', 'ono'],
    category: 'saltwater',
  },
  {
    id: 'king_mackerel',
    name: 'King Mackerel',
    commonNames: ['kingfish', 'king mack', 'cero'],
    category: 'saltwater',
  },
  {
    id: 'spanish_mackerel',
    name: 'Spanish Mackerel',
    commonNames: ['Spanish mackerel', 'spot'],
    category: 'saltwater',
  },
  {
    id: 'cero_mackerel',
    name: 'Cero Mackerel',
    commonNames: ['cero', 'painted mackerel'],
    category: 'saltwater',
  },

  // Saltwater - Shark
  {
    id: 'blacktip_shark',
    name: 'Blacktip Shark',
    commonNames: ['blacktip'],
    category: 'saltwater',
  },
  {
    id: 'bull_shark',
    name: 'Bull Shark',
    commonNames: ['bull shark'],
    category: 'both',
  },
  {
    id: 'hammerhead_shark',
    name: 'Hammerhead Shark',
    commonNames: ['hammerhead', 'scalloped hammerhead'],
    category: 'saltwater',
  },
  {
    id: 'sandbar_shark',
    name: 'Sandbar Shark',
    commonNames: ['sandbar'],
    category: 'saltwater',
  },
  {
    id: 'spinner_shark',
    name: 'Spinner Shark',
    commonNames: ['spinner'],
    category: 'saltwater',
  },
  {
    id: 'lemon_shark',
    name: 'Lemon Shark',
    commonNames: ['lemon'],
    category: 'saltwater',
  },

  // Saltwater - Other
  {
    id: 'tarpon',
    name: 'Tarpon',
    commonNames: ['tarpon', 'silver king'],
    category: 'saltwater',
  },
  {
    id: 'bonefish',
    name: 'Bonefish',
    commonNames: ['bonefish', 'grey ghost'],
    category: 'saltwater',
  },
  {
    id: 'permit',
    name: 'Permit',
    commonNames: ['permit'],
    category: 'saltwater',
  },
  {
    id: 'barracuda',
    name: 'Barracuda',
    commonNames: ['barracuda', 'great barracuda'],
    category: 'saltwater',
  },
  {
    id: 'triggerfish',
    name: 'Triggerfish',
    commonNames: ['triggerfish', 'gray triggerfish'],
    category: 'saltwater',
  },
  {
    id: 'filefish',
    name: 'Filefish',
    commonNames: ['filefish', 'orange filefish'],
    category: 'saltwater',
  },
  {
    id: 'puffer',
    name: 'Puffer',
    commonNames: ['puffer', 'blowfish', 'porcupine fish'],
    category: 'saltwater',
  },
  {
    id: 'flounder',
    name: 'Flounder',
    commonNames: ['flounder', 'Southern flounder'],
    category: 'saltwater',
  },
  {
    id: 'halibut',
    name: 'Halibut',
    commonNames: ['halibut', 'Pacific halibut'],
    category: 'both',
  },
  {
    id: 'flounder',
    name: 'Winter Flounder',
    commonNames: ['winter flounder', 'blackback'],
    category: 'saltwater',
  },
];

/**
 * Search species by name or common names
 */
export function searchSpecies(query: string, category?: SpeciesCategory): SpeciesData[] {
  const normalizedQuery = query.toLowerCase().trim();
  
  if (!normalizedQuery) {
    return category 
      ? FISHING_SPECIES.filter(s => s.category === category)
      : FISHING_SPECIES;
  }

  return FISHING_SPECIES.filter((species) => {
    // Filter by category if provided
    if (category && species.category !== category) {
      return false;
    }

    // Check main name
    if (species.name.toLowerCase().includes(normalizedQuery)) {
      return true;
    }

    // Check common names
    return species.commonNames.some((name) =>
      name.toLowerCase().includes(normalizedQuery)
    );
  });
}

/**
 * Get all species grouped by category
 */
export function getSpeciesByCategory(): Record<SpeciesCategory, SpeciesData[]> {
  const grouped: Record<SpeciesCategory, SpeciesData[]> = {
    freshwater: [],
    saltwater: [],
    both: [],
  };

  for (const species of FISHING_SPECIES) {
    grouped[species.category].push(species);
  }

  return grouped;
}

/**
 * Get popular/commonly targeted species for quick access
 */
export function getPopularSpecies(): SpeciesData[] {
  const popularIds = [
    'largemouth_bass',
    'smallmouth_bass',
    'rainbow_trout',
    'brown_trout',
    'walleye',
    'crappie',
    'bluegill',
    'channel_catfish',
    'striped_bass',
    'red_drum',
    'red_snapper',
    'mahi_mahi',
    'yellowfin_tuna',
  ];

  return FISHING_SPECIES.filter((species) => popularIds.includes(species.id));
}

/**
 * Get all species sorted alphabetically
 */
export function getAllSpecies(): SpeciesData[] {
  return [...FISHING_SPECIES].sort((a, b) => a.name.localeCompare(b.name));
}

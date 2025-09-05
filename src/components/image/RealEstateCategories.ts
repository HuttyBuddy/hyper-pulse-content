export const REAL_ESTATE_CATEGORIES = {
  interior: {
    label: "Interior",
    subcategories: ["living-room", "kitchen", "bedroom", "bathroom", "dining-room", "office", "basement", "other-interior"]
  },
  exterior: {
    label: "Exterior", 
    subcategories: ["front-facade", "backyard", "landscaping", "pool", "deck-patio", "garage", "other-exterior"]
  },
  aerial: {
    label: "Aerial/Drone",
    subcategories: ["property-overview", "neighborhood-context", "lot-boundaries", "aerial-landscape"]
  },
  twilight: {
    label: "Twilight",
    subcategories: ["evening-exterior", "lighting-showcase", "ambiance-shots"]
  },
  detail: {
    label: "Detail Shots",
    subcategories: ["architectural-features", "finishes", "fixtures", "amenities", "appliances"]
  },
  commercial: {
    label: "Commercial",
    subcategories: ["office-space", "retail", "restaurant", "warehouse", "mixed-use"]
  },
  "virtual-tour": {
    label: "Virtual Tour Prep",
    subcategories: ["360-ready", "staging-prep", "wide-angle"]
  }
} as const;

export const REAL_ESTATE_PRESETS = {
  // Interior Presets
  "HDR Interior": { 
    brightness: 15, 
    contrast: 20, 
    saturation: 10, 
    temperature: 5,
    category: "interior",
    description: "Balanced lighting for indoor spaces with natural window light"
  },
  "Bright & Airy": { 
    brightness: 25, 
    contrast: 15, 
    saturation: 5, 
    temperature: 10,
    category: "interior",
    description: "Modern real estate style with lifted shadows and crisp whites"
  },
  "Luxury Interior": { 
    brightness: 10, 
    contrast: 25, 
    saturation: 15, 
    temperature: 8,
    category: "interior",
    description: "Rich, sophisticated enhancement for high-end properties"
  },
  "Kitchen Spotlight": { 
    brightness: 20, 
    contrast: 18, 
    saturation: 12, 
    temperature: 12,
    category: "interior",
    description: "Optimized for kitchen photography with warm tones"
  },
  "Bathroom Clarity": { 
    brightness: 22, 
    contrast: 20, 
    saturation: 8, 
    temperature: 3,
    category: "interior", 
    description: "Clean, bright enhancement for bathroom spaces"
  },
  "Vacation Rental": { 
    brightness: 18, 
    contrast: 12, 
    saturation: 20, 
    temperature: 15,
    category: "interior",
    description: "Inviting, lifestyle-oriented enhancement"
  },

  // Exterior Presets
  "Warm Twilight": { 
    brightness: 5, 
    contrast: 30, 
    saturation: 25, 
    temperature: 20,
    category: "exterior",
    description: "Evening exterior shots with enhanced warm lighting"
  },
  "Curb Appeal": { 
    brightness: 12, 
    contrast: 22, 
    saturation: 30, 
    temperature: 8,
    category: "exterior",
    description: "Exterior enhancement with vivid landscaping and sky"
  },
  "New Construction": { 
    brightness: 15, 
    contrast: 25, 
    saturation: 8, 
    temperature: 2,
    category: "exterior",
    description: "Clean, modern enhancement highlighting fresh finishes"
  },

  // Aerial Presets
  "Aerial Showcase": { 
    brightness: 8, 
    contrast: 35, 
    saturation: 20, 
    temperature: 5,
    category: "aerial",
    description: "Enhanced contrast and clarity for drone photography"
  },

  // Detail Presets  
  "Detail Shots": { 
    brightness: 12, 
    contrast: 28, 
    saturation: 15, 
    temperature: 3,
    category: "detail",
    description: "Sharp, focused enhancement for architectural features"
  },

  // Commercial Presets
  "Commercial Property": { 
    brightness: 18, 
    contrast: 20, 
    saturation: 5, 
    temperature: 0,
    category: "commercial",
    description: "Clean, professional look for business spaces"
  },
} as const;

export type RealEstateCategoryKey = keyof typeof REAL_ESTATE_CATEGORIES;
export type RealEstatePresetKey = keyof typeof REAL_ESTATE_PRESETS;
// config.js — All CONFIG data for Neural Flow

export const GAMES = [
    { id: 'memory', name: 'Working Memory', icon: '\u{1F9E9}', description: 'Remember sequences' },
    { id: 'attention', name: 'Sustained Attention', icon: '\u{1F3AF}', description: 'Focus on targets' },
    { id: 'flexibility', name: 'Cognitive Flexibility', icon: '\u{1F52C}', description: 'Science classifications' },
    { id: 'speed', name: 'Processing Speed', icon: '\u26A1', description: 'Match chemical formulas' }
];

export const GAME_INSTRUCTIONS = {
    memory: {
        instruction: "Watch the sequence of numbers carefully. After all numbers are shown, enter them in the exact same order.",
        tips: [
            "Use 'chunking': Group numbers into smaller sets (e.g., 4-7-2 becomes 'forty-seven, two')",
            "Create a story: Link numbers to meaningful dates or familiar patterns",
            "Use the Method of Loci: Visualize placing each number in a familiar location"
        ]
    },
    attention: {
        instruction: "Click only the BLUE circles as quickly as possible. Avoid clicking RED circles.",
        tips: [
            "Keep your eyes centered on the screen rather than chasing targets",
            "Use peripheral vision to detect new targets appearing",
            "Maintain steady breathing to improve reaction time and reduce false clicks"
        ]
    },
    flexibility: {
        instruction: "Classify each item using the current science rule. The rule changes between rounds \u2014 stay sharp!",
        tips: [
            "Read the classification rule carefully before looking at the item",
            "Think about the key property that defines each category",
            "Reset your thinking when the rule changes \u2014 don't carry over previous categories"
        ]
    },
    speed: {
        instruction: "Match the chemical formula shown as quickly and accurately as possible.",
        tips: [
            "Focus on distinctive features: subscript numbers, element symbols",
            "Use pattern recognition rather than reading each character",
            "Keep your hand positioned over the likely answer area to reduce movement time"
        ]
    }
};

export const GRADE_CONTENT = {
    // --- K-2: Observable properties and basic classification ---
    K: { band: 'K-2', rules: [
        { key: 'living/nonliving', question: 'Is this living or nonliving?', options: ['Living', 'Nonliving'], items: [
            { stimulus: 'Dog', answer: 'living' }, { stimulus: 'Rock', answer: 'nonliving' },
            { stimulus: 'Tree', answer: 'living' }, { stimulus: 'Chair', answer: 'nonliving' },
            { stimulus: 'Fish', answer: 'living' }, { stimulus: 'Pencil', answer: 'nonliving' },
            { stimulus: 'Flower', answer: 'living' }, { stimulus: 'Water', answer: 'nonliving' },
            { stimulus: 'Butterfly', answer: 'living' }, { stimulus: 'Shoe', answer: 'nonliving' }
        ]},
        { key: 'solid/liquid', question: 'Is this a solid or a liquid?', options: ['Solid', 'Liquid'], items: [
            { stimulus: 'Ice cube', answer: 'solid' }, { stimulus: 'Juice', answer: 'liquid' },
            { stimulus: 'Book', answer: 'solid' }, { stimulus: 'Milk', answer: 'liquid' },
            { stimulus: 'Crayon', answer: 'solid' }, { stimulus: 'Soup', answer: 'liquid' },
            { stimulus: 'Ball', answer: 'solid' }, { stimulus: 'Rain', answer: 'liquid' },
            { stimulus: 'Coin', answer: 'solid' }, { stimulus: 'Honey', answer: 'liquid' }
        ]},
        { key: 'hot/cold', question: 'Is this usually hot or cold?', options: ['Hot', 'Cold'], items: [
            { stimulus: 'Fire', answer: 'hot' }, { stimulus: 'Snow', answer: 'cold' },
            { stimulus: 'Oven', answer: 'hot' }, { stimulus: 'Ice cream', answer: 'cold' },
            { stimulus: 'Sun', answer: 'hot' }, { stimulus: 'Freezer', answer: 'cold' },
            { stimulus: 'Stove', answer: 'hot' }, { stimulus: 'Iceberg', answer: 'cold' },
            { stimulus: 'Campfire', answer: 'hot' }, { stimulus: 'Popsicle', answer: 'cold' }
        ]}
    ], formulas: ['H\u2082O', 'O\u2082', 'CO\u2082', 'NaCl'] },
    1: { band: 'K-2', inherit: 'K' },
    2: { band: 'K-2', inherit: 'K' },

    // --- 3-5: Life science, earth science, basic physical science ---
    3: { band: '3-5', rules: [
        { key: 'plant/animal', question: 'Is this a plant or an animal?', options: ['Plant', 'Animal'], items: [
            { stimulus: 'Oak tree', answer: 'plant' }, { stimulus: 'Eagle', answer: 'animal' },
            { stimulus: 'Cactus', answer: 'plant' }, { stimulus: 'Whale', answer: 'animal' },
            { stimulus: 'Fern', answer: 'plant' }, { stimulus: 'Spider', answer: 'animal' },
            { stimulus: 'Moss', answer: 'plant' }, { stimulus: 'Frog', answer: 'animal' },
            { stimulus: 'Sunflower', answer: 'plant' }, { stimulus: 'Shark', answer: 'animal' },
            { stimulus: 'Kelp', answer: 'plant' }, { stimulus: 'Ant', answer: 'animal' }
        ]},
        { key: 'weathering/erosion', question: 'Is this an example of weathering or erosion?', options: ['Weathering', 'Erosion'], items: [
            { stimulus: 'Cracking rock from ice', answer: 'weathering' },
            { stimulus: 'River carrying sand', answer: 'erosion' },
            { stimulus: 'Roots splitting rock', answer: 'weathering' },
            { stimulus: 'Wind blowing soil', answer: 'erosion' },
            { stimulus: 'Acid rain dissolving stone', answer: 'weathering' },
            { stimulus: 'Glacier carving valley', answer: 'erosion' },
            { stimulus: 'Tree root cracking sidewalk', answer: 'weathering' },
            { stimulus: 'Ocean waves wearing cliff', answer: 'erosion' },
            { stimulus: 'Frost wedging', answer: 'weathering' },
            { stimulus: 'Mudslide', answer: 'erosion' }
        ]},
        { key: 'renewable/nonrenewable', question: 'Is this energy source renewable or nonrenewable?', options: ['Renewable', 'Nonrenewable'], items: [
            { stimulus: 'Solar', answer: 'renewable' }, { stimulus: 'Coal', answer: 'nonrenewable' },
            { stimulus: 'Wind', answer: 'renewable' }, { stimulus: 'Natural Gas', answer: 'nonrenewable' },
            { stimulus: 'Hydroelectric', answer: 'renewable' }, { stimulus: 'Petroleum', answer: 'nonrenewable' },
            { stimulus: 'Geothermal', answer: 'renewable' }, { stimulus: 'Diesel Fuel', answer: 'nonrenewable' },
            { stimulus: 'Biomass', answer: 'renewable' }, { stimulus: 'Propane', answer: 'nonrenewable' }
        ]}
    ], formulas: ['H\u2082O', 'CO\u2082', 'O\u2082', 'NaCl', 'N\u2082', 'CH\u2084'] },
    4: { band: '3-5', inherit: '3' },
    5: { band: '3-5', inherit: '3' },

    // --- 6-8: Physical/chemical science ---
    6: { band: '6-8', rules: [
        { key: 'metal/nonmetal', question: 'Is this element a metal or nonmetal?', options: ['Metal', 'Nonmetal'], items: [
            { stimulus: 'Iron (Fe)', answer: 'metal' }, { stimulus: 'Oxygen (O)', answer: 'nonmetal' },
            { stimulus: 'Gold (Au)', answer: 'metal' }, { stimulus: 'Carbon (C)', answer: 'nonmetal' },
            { stimulus: 'Copper (Cu)', answer: 'metal' }, { stimulus: 'Nitrogen (N)', answer: 'nonmetal' },
            { stimulus: 'Silver (Ag)', answer: 'metal' }, { stimulus: 'Sulfur (S)', answer: 'nonmetal' },
            { stimulus: 'Aluminum (Al)', answer: 'metal' }, { stimulus: 'Helium (He)', answer: 'nonmetal' },
            { stimulus: 'Zinc (Zn)', answer: 'metal' }, { stimulus: 'Chlorine (Cl)', answer: 'nonmetal' }
        ]},
        { key: 'physical/chemical', question: 'Is this a physical or chemical change?', options: ['Physical', 'Chemical'], items: [
            { stimulus: 'Ice melting', answer: 'physical' }, { stimulus: 'Wood burning', answer: 'chemical' },
            { stimulus: 'Paper tearing', answer: 'physical' }, { stimulus: 'Rust forming', answer: 'chemical' },
            { stimulus: 'Water boiling', answer: 'physical' }, { stimulus: 'Baking a cake', answer: 'chemical' },
            { stimulus: 'Dissolving sugar', answer: 'physical' }, { stimulus: 'Digesting food', answer: 'chemical' },
            { stimulus: 'Crushing a can', answer: 'physical' }, { stimulus: 'Milk souring', answer: 'chemical' },
            { stimulus: 'Cutting hair', answer: 'physical' }, { stimulus: 'Fireworks exploding', answer: 'chemical' }
        ]},
        { key: 'conductor/insulator', question: 'Is this material a conductor or insulator of electricity?', options: ['Conductor', 'Insulator'], items: [
            { stimulus: 'Copper wire', answer: 'conductor' }, { stimulus: 'Rubber gloves', answer: 'insulator' },
            { stimulus: 'Aluminum foil', answer: 'conductor' }, { stimulus: 'Glass rod', answer: 'insulator' },
            { stimulus: 'Salt water', answer: 'conductor' }, { stimulus: 'Plastic wrap', answer: 'insulator' },
            { stimulus: 'Steel nail', answer: 'conductor' }, { stimulus: 'Dry wood', answer: 'insulator' },
            { stimulus: 'Gold ring', answer: 'conductor' }, { stimulus: 'Ceramic tile', answer: 'insulator' }
        ]},
        { key: 'element/compound', question: 'Is this substance an element or a compound?', options: ['Element', 'Compound'], items: [
            { stimulus: 'Oxygen (O\u2082)', answer: 'element' }, { stimulus: 'Water (H\u2082O)', answer: 'compound' },
            { stimulus: 'Iron (Fe)', answer: 'element' }, { stimulus: 'Carbon dioxide (CO\u2082)', answer: 'compound' },
            { stimulus: 'Gold (Au)', answer: 'element' }, { stimulus: 'Table salt (NaCl)', answer: 'compound' },
            { stimulus: 'Nitrogen (N\u2082)', answer: 'element' }, { stimulus: 'Methane (CH\u2084)', answer: 'compound' },
            { stimulus: 'Helium (He)', answer: 'element' }, { stimulus: 'Rust (Fe\u2082O\u2083)', answer: 'compound' }
        ]},
        { key: 'renewable/nonrenewable', question: 'Is this energy source renewable or nonrenewable?', options: ['Renewable', 'Nonrenewable'], items: [
            { stimulus: 'Solar', answer: 'renewable' }, { stimulus: 'Coal', answer: 'nonrenewable' },
            { stimulus: 'Wind', answer: 'renewable' }, { stimulus: 'Natural Gas', answer: 'nonrenewable' },
            { stimulus: 'Hydroelectric', answer: 'renewable' }, { stimulus: 'Petroleum', answer: 'nonrenewable' },
            { stimulus: 'Geothermal', answer: 'renewable' }, { stimulus: 'Diesel Fuel', answer: 'nonrenewable' },
            { stimulus: 'Biomass', answer: 'renewable' }, { stimulus: 'Propane', answer: 'nonrenewable' }
        ]}
    ], formulas: [
        'H\u2082O', 'CO\u2082', 'NaCl', 'O\u2082', 'N\u2082', 'CH\u2084', 'Fe\u2082O\u2083', 'CaCO\u2083',
        'H\u2082SO\u2084', 'NaOH', 'HCl', 'NH\u2083', 'C\u2086H\u2081\u2082O\u2086', 'KMnO\u2084'
    ] },
    7: { band: '6-8', inherit: '6' },
    8: { band: '6-8', inherit: '6' },

    // --- 9-12: Advanced chemistry/physics ---
    9: { band: '9-12', rules: [
        { key: 'ionic/covalent', question: 'Is this bond ionic or covalent?', options: ['Ionic', 'Covalent'], items: [
            { stimulus: 'NaCl (table salt)', answer: 'ionic' }, { stimulus: 'H\u2082O (water)', answer: 'covalent' },
            { stimulus: 'MgO (magnesium oxide)', answer: 'ionic' }, { stimulus: 'CO\u2082 (carbon dioxide)', answer: 'covalent' },
            { stimulus: 'KBr (potassium bromide)', answer: 'ionic' }, { stimulus: 'CH\u2084 (methane)', answer: 'covalent' },
            { stimulus: 'CaF\u2082 (calcium fluoride)', answer: 'ionic' }, { stimulus: 'NH\u2083 (ammonia)', answer: 'covalent' },
            { stimulus: 'LiCl (lithium chloride)', answer: 'ionic' }, { stimulus: 'O\u2082 (oxygen gas)', answer: 'covalent' },
            { stimulus: 'BaSO\u2084 (barium sulfate)', answer: 'ionic' }, { stimulus: 'C\u2082H\u2086 (ethane)', answer: 'covalent' }
        ]},
        { key: 'acid/base', question: 'Is this substance an acid or a base?', options: ['Acid', 'Base'], items: [
            { stimulus: 'HCl (hydrochloric acid)', answer: 'acid' }, { stimulus: 'NaOH (sodium hydroxide)', answer: 'base' },
            { stimulus: 'H\u2082SO\u2084 (sulfuric acid)', answer: 'acid' }, { stimulus: 'KOH (potassium hydroxide)', answer: 'base' },
            { stimulus: 'HNO\u2083 (nitric acid)', answer: 'acid' }, { stimulus: 'Ca(OH)\u2082 (calcium hydroxide)', answer: 'base' },
            { stimulus: 'CH\u2083COOH (acetic acid)', answer: 'acid' }, { stimulus: 'NH\u2083 (ammonia)', answer: 'base' },
            { stimulus: 'H\u2083PO\u2084 (phosphoric acid)', answer: 'acid' }, { stimulus: 'Mg(OH)\u2082 (magnesium hydroxide)', answer: 'base' },
            { stimulus: 'HF (hydrofluoric acid)', answer: 'acid' }, { stimulus: 'Al(OH)\u2083 (aluminum hydroxide)', answer: 'base' }
        ]},
        { key: 'exothermic/endothermic', question: 'Is this reaction exothermic or endothermic?', options: ['Exothermic', 'Endothermic'], items: [
            { stimulus: 'Combustion of methane', answer: 'exothermic' },
            { stimulus: 'Photosynthesis', answer: 'endothermic' },
            { stimulus: 'Neutralization (acid + base)', answer: 'exothermic' },
            { stimulus: 'Melting ice', answer: 'endothermic' },
            { stimulus: 'Rusting of iron', answer: 'exothermic' },
            { stimulus: 'Cooking an egg', answer: 'endothermic' },
            { stimulus: 'Burning wood', answer: 'exothermic' },
            { stimulus: 'Evaporating water', answer: 'endothermic' },
            { stimulus: 'Cellular respiration', answer: 'exothermic' },
            { stimulus: 'Dissolving NH\u2084NO\u2083 in water', answer: 'endothermic' }
        ]},
        { key: 'element/compound', question: 'Is this substance an element or a compound?', options: ['Element', 'Compound'], items: [
            { stimulus: 'Oxygen (O\u2082)', answer: 'element' }, { stimulus: 'Water (H\u2082O)', answer: 'compound' },
            { stimulus: 'Iron (Fe)', answer: 'element' }, { stimulus: 'Glucose (C\u2086H\u2081\u2082O\u2086)', answer: 'compound' },
            { stimulus: 'Gold (Au)', answer: 'element' }, { stimulus: 'Ethanol (C\u2082H\u2085OH)', answer: 'compound' },
            { stimulus: 'Neon (Ne)', answer: 'element' }, { stimulus: 'Sulfuric acid (H\u2082SO\u2084)', answer: 'compound' },
            { stimulus: 'Silicon (Si)', answer: 'element' }, { stimulus: 'Sodium bicarbonate (NaHCO\u2083)', answer: 'compound' }
        ]},
        { key: 'metal/nonmetal', question: 'Is this element a metal or nonmetal?', options: ['Metal', 'Nonmetal'], items: [
            { stimulus: 'Iron (Fe)', answer: 'metal' }, { stimulus: 'Oxygen (O)', answer: 'nonmetal' },
            { stimulus: 'Gold (Au)', answer: 'metal' }, { stimulus: 'Carbon (C)', answer: 'nonmetal' },
            { stimulus: 'Copper (Cu)', answer: 'metal' }, { stimulus: 'Nitrogen (N)', answer: 'nonmetal' },
            { stimulus: 'Silver (Ag)', answer: 'metal' }, { stimulus: 'Sulfur (S)', answer: 'nonmetal' },
            { stimulus: 'Aluminum (Al)', answer: 'metal' }, { stimulus: 'Helium (He)', answer: 'nonmetal' },
            { stimulus: 'Zinc (Zn)', answer: 'metal' }, { stimulus: 'Chlorine (Cl)', answer: 'nonmetal' }
        ]}
    ], formulas: [
        'H\u2082O', 'CO\u2082', 'NaCl', 'O\u2082', 'N\u2082', 'CH\u2084', 'Fe\u2082O\u2083', 'CaCO\u2083',
        'H\u2082SO\u2084', 'NaOH', 'HCl', 'NH\u2083', 'C\u2086H\u2081\u2082O\u2086', 'KMnO\u2084',
        'C\u2082H\u2085OH', 'NaHCO\u2083', 'H\u2083PO\u2084', 'Ca(OH)\u2082', 'BaSO\u2084', 'KBr'
    ] },
    10: { band: '9-12', inherit: '9' },
    11: { band: '9-12', inherit: '9' },
    12: { band: '9-12', inherit: '9' }
};

export const RECOMMENDATIONS = {
    memory: {
        scienceConnection: 'Working memory is linked to following multi-step lab procedures, holding variables in mind during experiments, and connecting observations to hypotheses.',
        tiers: {
            strong: 'Your working memory is solid \u2014 you can handle complex lab procedures and multi-step problem solving. Keep challenging yourself with longer sequences.',
            developing: "You're building working memory capacity. When studying science, try breaking procedures into smaller chunks and reviewing each step before moving on.",
            needsFocus: 'Working memory is a growth area. In science class, write down each step of a procedure before starting, and use diagrams to reduce what you need to hold in your head.'
        },
        tips: [
            'Before a lab, read through ALL steps first, then summarize each in your own words',
            'Use chunking when memorizing element groups or classification systems',
            'Draw concept maps to offload working memory during complex topics'
        ]
    },
    attention: {
        scienceConnection: 'Sustained attention is associated with careful observation \u2014 a key part of scientific inquiry. It may help you notice patterns in data and stay focused during long experiments.',
        tiers: {
            strong: "Your sustained attention is excellent \u2014 you're well-equipped for detailed observation and data collection during experiments.",
            developing: 'Your attention skills are growing. During science activities, try removing distractions and give yourself a specific thing to watch for.',
            needsFocus: 'Building sustained attention will strengthen your science observations. Start by focusing on one variable at a time, and take brief notes to anchor your focus.'
        },
        tips: [
            'During observations, write down what you notice every 30 seconds to stay engaged',
            'When reading science texts, pause after each paragraph and summarize the key idea',
            'During experiments, assign yourself a specific observation role to maintain focus'
        ]
    },
    flexibility: {
        scienceConnection: 'Cognitive flexibility is linked to switching between classification systems, seeing problems from multiple angles, and updating your thinking when new evidence arrives.',
        tiers: {
            strong: 'Strong cognitive flexibility \u2014 you can switch between classification systems and adapt your thinking when evidence changes. This is a key scientific reasoning skill.',
            developing: "You're building flexibility in your thinking. Practice looking at science problems from different angles \u2014 try explaining a concept using two different models.",
            needsFocus: "Cognitive flexibility takes practice. In science, start by explicitly naming the 'rule' you're using before switching to a new one \u2014 this makes the mental shift easier."
        },
        tips: [
            'Practice classifying the same set of objects using different criteria (by color, then size, then material)',
            "When learning a new concept, ask: 'How is this similar to something I already know? How is it different?'",
            'After each round, pause and think about which classifications felt tricky \u2014 noticing your hesitation patterns builds flexibility'
        ]
    },
    speed: {
        scienceConnection: 'Processing speed is associated with quickly recognizing patterns in data, identifying chemical formulas and symbols, and keeping up with the pace of lab work and class discussions.',
        tiers: {
            strong: 'Fast and accurate processing \u2014 you can quickly identify patterns and symbols, which helps during data analysis and fast-paced lab activities.',
            developing: 'Your processing speed is building. Practice recognizing common science symbols and formulas by sight rather than reading them character by character.',
            needsFocus: 'Processing speed improves with familiarity. Make flashcards for chemical formulas, element symbols, and common abbreviations so recognition becomes automatic.'
        },
        tips: [
            'Create flashcards for chemical formulas you see in class and practice quick recognition',
            'When reviewing data tables, practice scanning for patterns before doing detailed analysis',
            'Quiz yourself on element symbols and their properties to build automatic recognition'
        ]
    }
};

// Timing and scoring constants
export const STORAGE_KEY = 'neural_flow_data';
export const MAX_TASKS = 3;
export const MAX_DIFFICULTY = 5;
export const ADAPTIVE_UP = 80;
export const ADAPTIVE_DOWN = 50;
export const CHECKSUM_SALT = 'NF2024';
export const MEMORY_DISPLAY_MS = 1000;
export const ATTENTION_TARGET_BASE_MS = 2000;
export const ATTENTION_TARGET_DIFF_MS = 100;
export const ATTENTION_SPAWN_BASE_MS = 800;
export const ATTENTION_SPAWN_DIFF_MS = 50;
export const FLEX_RT_NORM_MS = 3000;
export const SPEED_RT_NORM_MS = 2000;
export const FEEDBACK_DISPLAY_MS = 1500;
export const DEBOUNCE_MS = 300;

// Bundle all config as a single object too, for convenience
export const CONFIG = {
    GAMES,
    GAME_INSTRUCTIONS,
    GRADE_CONTENT,
    RECOMMENDATIONS,
    STORAGE_KEY,
    MAX_TASKS,
    MAX_DIFFICULTY,
    ADAPTIVE_UP,
    ADAPTIVE_DOWN,
    CHECKSUM_SALT,
    MEMORY_DISPLAY_MS,
    ATTENTION_TARGET_BASE_MS,
    ATTENTION_TARGET_DIFF_MS,
    ATTENTION_SPAWN_BASE_MS,
    ATTENTION_SPAWN_DIFF_MS,
    FLEX_RT_NORM_MS,
    SPEED_RT_NORM_MS,
    FEEDBACK_DISPLAY_MS,
    DEBOUNCE_MS
};

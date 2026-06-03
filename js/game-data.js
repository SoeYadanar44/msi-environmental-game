const LEVEL_COUNT = 20;

const LEVEL_COPY = {
    1: { problem: "Rising Global Temperatures", cause: "Excess greenhouse gas emissions", solution: "Switch to renewable energy (solar, wind)", description: "Global temperatures are rising because of excessive greenhouse gas emissions. The solution requires a fundamental shift to renewable energy sources like solar and wind power." },
    2: { problem: "Melting Glaciers", cause: "Global warming from fossil fuel burning", solution: "Reduce carbon emissions worldwide", description: "Glaciers are melting at unprecedented rates due to global warming caused by fossil fuel burning. Immediate carbon emission reductions are essential to preserve these vital water sources." },
    3: { problem: "Rising Sea Levels", cause: "Polar ice caps melting", solution: "Coastal protection and emission cuts", description: "Sea levels are increasing as polar ice caps melt, threatening coastal communities worldwide. We need both coastal protection measures and aggressive emission reduction targets." },
    4: { problem: "Air Pollution in Cities", cause: "Vehicle exhaust and industrial smoke", solution: "Promote electric vehicles and public transport", description: "Air pollution in cities is worsening because of vehicle emissions and industrial activities. Promoting electric vehicles and expanding public transportation can significantly improve air quality." },
    5: { problem: "Ocean Acidification", cause: "Absorption of excess CO₂ by oceans", solution: "Reduce carbon output, protect marine life", description: "Oceans are becoming more acidic as they absorb excess carbon dioxide, threatening marine ecosystems. Reducing carbon emissions and establishing marine protected areas are crucial steps." },
    6: { problem: "More Frequent Wildfires", cause: "Hotter, drier conditions due to climate change", solution: "Forest management and fire prevention programs", description: "Climate change is creating hotter, drier conditions that increase wildfire risks. Better forest management practices and community fire prevention programs can reduce this threat." },
    7: { problem: "Deforestation", cause: "Logging, agriculture, urban expansion", solution: "Reforestation and sustainable land use", description: "Deforestation continues due to logging, farming, and urban development. Reforestation projects and sustainable land use policies are essential to protect remaining forests." },
    8: { problem: "Species Extinction", cause: "Habitat loss and climate disruption", solution: "Wildlife conservation programs", description: "Many species face extinction because of habitat destruction and climate disruption. Comprehensive wildlife conservation programs and habitat restoration are urgently needed." },
    9: { problem: "Extreme Heatwaves", cause: "Rising greenhouse gases trapping heat", solution: "Urban green spaces and heat action plans", description: "Extreme heatwaves are becoming more common as greenhouse gases trap more heat. Creating urban green spaces and implementing heat action plans can save lives." },
    10: { problem: "Droughts", cause: "Changing rainfall patterns from global warming", solution: "Water conservation and smart irrigation", description: "Droughts are occurring more frequently due to changing rainfall patterns. Water conservation programs and smart irrigation technologies can help communities adapt." },
    11: { problem: "Flooding", cause: "Intense storms and sea level rise", solution: "Better drainage and flood defenses", description: "Flooding is becoming more severe because of stronger storms and rising sea levels. Improved drainage systems and flood defenses are critical for vulnerable areas." },
    12: { problem: "Food Insecurity", cause: "Crop failures from droughts and floods", solution: "Climate-resilient farming techniques", description: "Food insecurity is increasing as extreme weather damages crops. Climate-resilient farming techniques and crop diversification can help ensure food supplies." },
    13: { problem: "Stronger Hurricanes / Typhoons", cause: "Warmer ocean waters fuel storms", solution: "Early warning systems and disaster preparedness", description: "Warmer ocean temperatures are fueling stronger tropical storms. Early warning systems and community disaster preparedness can reduce casualties and damage." },
    14: { problem: "Desertification", cause: "Overgrazing and deforestation", solution: "Planting trees and sustainable farming", description: "Desertification is spreading due to overgrazing and deforestation. Tree planting initiatives and sustainable farming practices can reverse this trend." },
    15: { problem: "Coral Reef Bleaching", cause: "Warmer ocean temperatures", solution: "Marine protected areas and emission reduction", description: "Coral reefs are bleaching because of rising ocean temperatures. Marine protected areas and global emission reductions are essential for reef survival." },
    16: { problem: "Plastic Pollution in Oceans", cause: "Overuse of single-use plastics", solution: "Recycling and banning single-use plastics", description: "Plastic pollution is devastating marine ecosystems due to single-use plastics. Comprehensive recycling programs and plastic bans can significantly reduce ocean plastic." },
    17: { problem: "Poor Indoor Air Quality", cause: "Burning coal, wood, or kerosene", solution: "Clean stoves and alternative fuels", description: "Poor indoor air quality results from burning solid fuels in homes. Clean cookstoves and alternative energy sources can prevent respiratory diseases." },
    18: { problem: "Loss of Arctic Wildlife", cause: "Melting sea ice habitats", solution: "Protect arctic reserves and cut emissions", description: "Arctic wildlife is losing habitat as sea ice melts. Protecting arctic reserves and reducing global emissions are critical for species survival." },
    19: { problem: "Overfishing", cause: "Unsustainable fishing practices", solution: "Regulate fishing and promote aquaculture", description: "Overfishing is depleting fish populations worldwide. Stronger fishing regulations and sustainable aquaculture can restore ocean fisheries." },
    20: { problem: "Energy Waste", cause: "Inefficient appliances and buildings", solution: "Energy-efficient technology and insulation", description: "Energy waste occurs when inefficient appliances and buildings consume excessive power. Energy-efficient technologies and proper insulation can dramatically reduce waste." }
};

function pic(type, num) {
    return `pics/${num}${type}.png`;
}

function tripletBase(levelNum) {
    return (levelNum - 1) * 3 + 1;
}

function wrapLevel(num) {
    return ((num - 1 + LEVEL_COUNT) % LEVEL_COUNT) + 1;
}

// Fisher-Yates shuffle - modifies array in place
function shuffleArrayInPlace(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// Get all possible decoys from ALL other levels (excluding current level and the last used ones)
function getAllOtherLevels(excludeLevelNum, excludePreviousLevels = []) {
    const otherLevels = [];
    for (let i = 1; i <= LEVEL_COUNT; i++) {
        if (i !== excludeLevelNum && !excludePreviousLevels.includes(i)) {
            otherLevels.push(i);
        }
    }
    return otherLevels;
}

// Track used decoy levels to prevent repetition
let usedCauseDecoyLevels = [];
let usedSolutionDecoyLevels = [];

// Reset used decoys (call when needed, or let them cycle through all)
function resetUsedDecoys() {
    usedCauseDecoyLevels = [];
    usedSolutionDecoyLevels = [];
}

// Get fresh decoy levels that haven't been used recently
function getFreshDecoyLevels(currentLevelNum, type, count = 2) {
    const usedList = type === 'cause' ? usedCauseDecoyLevels : usedSolutionDecoyLevels;
    
    // Get all levels except current and except recently used ones
    let availableLevels = [];
    for (let i = 1; i <= LEVEL_COUNT; i++) {
        if (i !== currentLevelNum && !usedList.includes(i)) {
            availableLevels.push(i);
        }
    }
    
    // If we don't have enough available levels (ran out of fresh ones), reset the used list
    if (availableLevels.length < count) {
        // Reset the used list for this type
        if (type === 'cause') {
            usedCauseDecoyLevels = [];
        } else {
            usedSolutionDecoyLevels = [];
        }
        
        // Rebuild available levels (now excluding only current level)
        availableLevels = [];
        for (let i = 1; i <= LEVEL_COUNT; i++) {
            if (i !== currentLevelNum) {
                availableLevels.push(i);
            }
        }
    }
    
    // Randomly select the required number of decoy levels
    const shuffled = shuffleArrayInPlace([...availableLevels]);
    const selected = shuffled.slice(0, count);
    
    // Add to used list
    selected.forEach(level => {
        if (!usedList.includes(level)) {
            usedList.push(level);
        }
    });
    
    // Keep used list at a reasonable size (last 10)
    while (usedList.length > 10) {
        usedList.shift();
    }
    
    return selected;
}

// Build level with fresh decoys that haven't been used recently
function buildLevelWithFreshDecoys(levelNum) {
    const copy = LEVEL_COPY[levelNum];
    const base = tripletBase(levelNum);
    
    // Get fresh decoy levels for cause and solution separately
    const causeDecoyLevels = getFreshDecoyLevels(levelNum, 'cause', 2);
    const solutionDecoyLevels = getFreshDecoyLevels(levelNum, 'solution', 2);
    
    // Build cause options
    const causeOptions = [
        {
            id: "correct",
            text: copy?.cause ?? "Matching cause",
            image: pic("c", base + 1)
        }
    ];
    
    // Add decoy causes
    causeDecoyLevels.forEach((decoyLevel, idx) => {
        const decoyCopy = LEVEL_COPY[decoyLevel];
        const decoyBase = tripletBase(decoyLevel);
        causeOptions.push({
            id: `decoy-${decoyLevel}`,
            text: decoyCopy?.cause ?? "Another cause",
            image: pic("c", decoyBase + 1)
        });
    });
    
    // Build solution options
    const solutionOptions = [
        {
            id: "correct",
            text: copy?.solution ?? "Matching solution",
            image: pic("s", base + 2)
        }
    ];
    
    // Add decoy solutions
    solutionDecoyLevels.forEach((decoyLevel, idx) => {
        const decoyCopy = LEVEL_COPY[decoyLevel];
        const decoyBase = tripletBase(decoyLevel);
        solutionOptions.push({
            id: `decoy-${decoyLevel}`,
            text: decoyCopy?.solution ?? "Another solution",
            image: pic("s", decoyBase + 2)
        });
    });
    
    // Shuffle the options so the correct one isn't always first
    shuffleArrayInPlace(causeOptions);
    shuffleArrayInPlace(solutionOptions);
    
    return {
        id: levelNum,
        problem: {
            title: copy?.problem ?? `Environmental challenge ${levelNum}`,
            image: pic("p", base)
        },
        causes: causeOptions,
        solutions: solutionOptions,
        correctCauseId: "correct",
        correctSolutionId: "correct"
    };
}

// Store the last built levels to avoid rebuilding the same level multiple times
const levelCache = {};

function getLevelWithFreshDecoys(levelNum) {
    // Clear cache for this level to force fresh decoys
    // Uncomment if you want fresh decoys every time you revisit a level
    // delete levelCache[levelNum];
    
    if (!levelCache[levelNum]) {
        levelCache[levelNum] = buildLevelWithFreshDecoys(levelNum);
    }
    return levelCache[levelNum];
}

// For backward compatibility
if (typeof window !== 'undefined') {
    window.LEVEL_COPY = LEVEL_COPY;
    window.LEVEL_COUNT = LEVEL_COUNT;
    window.getLevelWithFreshDecoys = getLevelWithFreshDecoys;
    window.resetUsedDecoys = resetUsedDecoys;
}
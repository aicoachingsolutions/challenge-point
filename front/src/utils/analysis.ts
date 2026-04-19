import { DifficultyLevels, EngagementLevels, IActivity } from '@/MODELS/activity.model'

export const determineZpdZone = (difficultyLevel: DifficultyLevels, engagementLevel: EngagementLevels) => {
    // Map for zone determination
    const zoneMap = {
        // Format: [difficulty][engagement] = zone
        [DifficultyLevels.Low]: {
            [EngagementLevels.Low]: 1, // Far too easy
            [EngagementLevels.Medium]: 1, // Far too easy
            [EngagementLevels.High]: 2, // Slightly easy
        },
        [DifficultyLevels.Medium]: {
            [EngagementLevels.Low]: 1, // Far too easy
            [EngagementLevels.Medium]: 2, // Slightly easy
            [EngagementLevels.High]: 3, // ZPD / Optimal
        },
        [DifficultyLevels.High]: {
            [EngagementLevels.Low]: 5, // Far too hard
            [EngagementLevels.Medium]: 4, // Slightly too hard
            [EngagementLevels.High]: 3, // ZPD / Optimal
        },
    };

    return zoneMap[difficultyLevel]?.[engagementLevel] || 1;
};

interface IZone {
    name: string,
            color: string,
            description: string,
            inZpd: boolean  
}

  export const zones = {
        1: {
            name: "Far Too Easy",
            color: "#D3D3D3",
            description: "The activity was too simple and didn't challenge players",
            inZpd: false
        },
        2: {
            name: "Slightly Easy",
            color: "#ADD8E6",
            description: "The activity was moderately engaging but could be more challenging",
            inZpd: false
        },
        3: {
            name: "Optimal Learning Zone",
            color: "#00BFFF",
            description: "Optimal challenge and engagement level for learning",
            inZpd: true
        },
        4: {
            name: "Slightly Too Hard",
            color: "#FFA500",
            description: "The activity was challenging but may have reduced engagement",
            inZpd: false
        },
        5: {
            name: "Far Too Hard",
            color: "#DC143C",
            description: "The activity was too difficult, likely causing frustration",
            inZpd: false
        }
    };

// Function to get zone information based on zone number
export const getZoneInfo: (zoneNumber: number) => IZone = (zoneNumber: number) => {
  
    
    return zones[zoneNumber] || zones[1];
};
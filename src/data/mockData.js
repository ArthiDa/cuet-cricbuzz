// Mock data for development and UI testing

export const mockTeams = [
  {
    id: 1,
    name: "Thunder Strikers",
    shortName: "TS",
    logo: "🔥",
    color: "#ef4444",
    played: 6,
    won: 4,
    lost: 2,
    points: 8,
    nrr: "+1.25"
  },
  {
    id: 2,
    name: "Lightning Warriors",
    shortName: "LW",
    logo: "⚡",
    color: "#3b82f6",
    played: 6,
    won: 5,
    lost: 1,
    points: 10,
    nrr: "+2.15"
  },
  {
    id: 3,
    name: "Royal Panthers",
    shortName: "RP",
    logo: "👑",
    color: "#8b5cf6",
    played: 6,
    won: 3,
    lost: 3,
    points: 6,
    nrr: "+0.45"
  },
  {
    id: 4,
    name: "Storm Chasers",
    shortName: "SC",
    logo: "🌪️",
    color: "#10b981",
    played: 6,
    won: 2,
    lost: 4,
    points: 4,
    nrr: "-0.85"
  }
];

export const mockPlayers = [
  {
    id: 1,
    name: "Rahul Sharma",
    teamId: 1,
    role: "Batsman",
    matches: 6,
    runs: 245,
    wickets: 0,
    fours: 28,
    sixes: 12,
    ballsPlayed: 156,
    average: 40.83,
    strikeRate: 157.05,
    overs: 0
  },
  {
    id: 2,
    name: "Amit Kumar",
    teamId: 1,
    role: "Bowler",
    matches: 6,
    runs: 45,
    wickets: 12,
    fours: 3,
    sixes: 2,
    ballsPlayed: 32,
    average: 15.00,
    strikeRate: 140.63,
    overs: 18,
    economy: 7.83
  },
  {
    id: 3,
    name: "Vikram Singh",
    teamId: 2,
    role: "All-Rounder",
    matches: 6,
    runs: 178,
    wickets: 8,
    fours: 18,
    sixes: 9,
    ballsPlayed: 124,
    average: 29.67,
    strikeRate: 143.55,
    overs: 15,
    economy: 8.20
  },
  {
    id: 4,
    name: "Arjun Patel",
    teamId: 2,
    role: "Batsman",
    matches: 6,
    runs: 289,
    wickets: 1,
    fours: 32,
    sixes: 15,
    ballsPlayed: 178,
    average: 48.17,
    strikeRate: 162.36,
    overs: 2
  }
];

export const mockMatches = [
  {
    id: 1,
    matchNumber: 1,
    team1: mockTeams[0],
    team2: mockTeams[1],
    venue: "CUET Main Ground",
    date: "2025-11-01",
    time: "14:00",
    status: "completed",
    toss: {
      winner: mockTeams[0],
      decision: "bat"
    },
    result: {
      winner: mockTeams[1],
      margin: "6 wickets",
      summary: "Lightning Warriors won by 6 wickets"
    },
    innings: [
      {
        battingTeam: mockTeams[0],
        runs: 145,
        wickets: 7,
        overs: 10
      },
      {
        battingTeam: mockTeams[1],
        runs: 148,
        wickets: 4,
        overs: 9.2
      }
    ]
  },
  {
    id: 2,
    matchNumber: 2,
    team1: mockTeams[2],
    team2: mockTeams[3],
    venue: "CUET Practice Ground",
    date: "2025-11-05",
    time: "16:00",
    status: "live",
    currentInning: 1,
    toss: {
      winner: mockTeams[2],
      decision: "bat"
    },
    liveScore: {
      battingTeam: mockTeams[2],
      runs: 89,
      wickets: 3,
      overs: 7.4,
      currentBatsmen: [
        { name: "Player 1", runs: 34, balls: 22, fours: 4, sixes: 2, onStrike: true },
        { name: "Player 2", runs: 18, balls: 15, fours: 2, sixes: 1, onStrike: false }
      ],
      currentBowler: {
        name: "Bowler 1",
        overs: 2.4,
        runs: 24,
        wickets: 1,
        economy: 9.0
      },
      recentBalls: ["1", "4", "W", "0", "6", "2"]
    }
  },
  {
    id: 3,
    matchNumber: 3,
    team1: mockTeams[0],
    team2: mockTeams[3],
    venue: "CUET Main Ground",
    date: "2025-11-10",
    time: "14:00",
    status: "upcoming"
  }
];

export const mockLiveMatch = {
  id: 2,
  matchNumber: 2,
  team1: mockTeams[2],
  team2: mockTeams[3],
  venue: "CUET Practice Ground",
  date: "2025-11-05",
  status: "live",
  currentInning: 1,
  overs: 10,
  toss: {
    winner: mockTeams[2],
    decision: "bat"
  },
  innings: [
    {
      inningNumber: 1,
      battingTeam: mockTeams[2],
      bowlingTeam: mockTeams[3],
      runs: 89,
      wickets: 3,
      overs: 7.4,
      currentBatsmen: [
        { 
          id: 1,
          name: "Rohit Verma", 
          runs: 34, 
          balls: 22, 
          fours: 4, 
          sixes: 2, 
          strikeRate: 154.55,
          onStrike: true 
        },
        { 
          id: 2,
          name: "Suresh Reddy", 
          runs: 18, 
          balls: 15, 
          fours: 2, 
          sixes: 1, 
          strikeRate: 120.00,
          onStrike: false 
        }
      ],
      currentBowler: {
        id: 1,
        name: "Manoj Das",
        overs: 2.4,
        maidens: 0,
        runs: 24,
        wickets: 1,
        economy: 9.0
      },
      partnership: {
        runs: 45,
        balls: 28
      },
      runRate: {
        current: 11.61,
        required: null
      },
      recentBalls: ["1", "4", "W", "0", "6", "2", "1", ".", "2", "4"]
    }
  ],
  commentary: [
    {
      over: 7.4,
      ball: "Good length delivery, defended back to the bowler",
      runs: 0,
      timestamp: "2025-11-05 16:45:23"
    },
    {
      over: 7.3,
      ball: "SHORT! Pulled away for SIX! What a shot!",
      runs: 6,
      timestamp: "2025-11-05 16:45:10"
    },
    {
      over: 7.2,
      ball: "WICKET! Caught at mid-off. Soft dismissal.",
      runs: 0,
      isWicket: true,
      timestamp: "2025-11-05 16:44:55"
    }
  ]
};

export const mockPointsTable = [
  {
    position: 1,
    team: mockTeams[1],
    played: 6,
    won: 5,
    lost: 1,
    tied: 0,
    nrr: "+2.15",
    points: 10
  },
  {
    position: 2,
    team: mockTeams[0],
    played: 6,
    won: 4,
    lost: 2,
    tied: 0,
    nrr: "+1.25",
    points: 8
  },
  {
    position: 3,
    team: mockTeams[2],
    played: 6,
    won: 3,
    lost: 3,
    tied: 0,
    nrr: "+0.45",
    points: 6
  },
  {
    position: 4,
    team: mockTeams[3],
    played: 6,
    won: 2,
    lost: 4,
    tied: 0,
    nrr: "-0.85",
    points: 4
  }
];


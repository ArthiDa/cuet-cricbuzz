import { supabase } from '../config/supabase';

/**
 * Player Statistics Service - Get tournament-wide player stats
 */

/**
 * Get all players with their tournament statistics
 */
export const getPlayersWithStats = async () => {
  try {
    // Fetch all players
    const { data: players, error: playersError } = await supabase
      .from('players')
      .select(`
        id,
        name,
        role,
        jersey_number,
        team_id,
        teams(id, name, short_name, logo)
      `)
      .order('name', { ascending: true });
    
    if (playersError) throw playersError;
    
    // Fetch batting stats for all completed matches
    const { data: battingStats, error: battingError } = await supabase
      .from('batting_innings')
      .select(`
        player_id,
        runs_scored,
        balls_faced,
        fours,
        sixes,
        is_out,
        innings:innings_id(
          match:matches!innings_match_id_fkey(status, archived)
        )
      `);
    
    if (battingError) throw battingError;
    
    // Fetch bowling stats for all completed matches
    const { data: bowlingStats, error: bowlingError } = await supabase
      .from('bowling_innings')
      .select(`
        player_id,
        balls_bowled,
        runs_conceded,
        wickets_taken,
        innings:innings_id(
          match:matches!innings_match_id_fkey(status, archived)
        )
      `);
    
    if (bowlingError) throw bowlingError;
    
    // Aggregate stats per player
    const playerStatsMap = {};
    
    players?.forEach(player => {
      playerStatsMap[player.id] = {
        id: player.id,
        name: player.name,
        role: player.role,
        jerseyNumber: player.jersey_number,
        team: player.teams ? {
          id: player.teams.id,
          name: player.teams.name,
          shortName: player.teams.short_name,
          logo: player.teams.logo || '🏏',
        } : null,
        // Batting stats
        matches: 0,
        innings: 0,
        runs: 0,
        ballsFaced: 0,
        notOuts: 0,
        fours: 0,
        sixes: 0,
        highScore: 0,
        average: 0,
        strikeRate: 0,
        // Bowling stats
        ballsBowled: 0,
        runsConceded: 0,
        wickets: 0,
        bestBowling: '0/0',
        bowlingAverage: 0,
        economy: 0,
        // For calculating best bowling
        _bestBowlingWickets: 0,
        _bestBowlingRuns: 999,
      };
    });
    
    // Process batting stats (only from completed, non-archived matches)
    battingStats?.forEach(stat => {
      const match = stat.innings?.match;
      if (!match || match.status !== 'completed' || match.archived) return;
      
      if (playerStatsMap[stat.player_id]) {
        const player = playerStatsMap[stat.player_id];
        player.innings++;
        player.runs += stat.runs_scored || 0;
        player.ballsFaced += stat.balls_faced || 0;
        player.fours += stat.fours || 0;
        player.sixes += stat.sixes || 0;
        
        if (!stat.is_out) {
          player.notOuts++;
        }
        
        if ((stat.runs_scored || 0) > player.highScore) {
          player.highScore = stat.runs_scored || 0;
        }
      }
    });
    
    // Process bowling stats (only from completed, non-archived matches)
    bowlingStats?.forEach(stat => {
      const match = stat.innings?.match;
      if (!match || match.status !== 'completed' || match.archived) return;
      
      if (playerStatsMap[stat.player_id]) {
        const player = playerStatsMap[stat.player_id];
        player.ballsBowled += stat.balls_bowled || 0;
        player.runsConceded += stat.runs_conceded || 0;
        player.wickets += stat.wickets_taken || 0;
        
        // Track best bowling
        const wickets = stat.wickets_taken || 0;
        const runs = stat.runs_conceded || 0;
        
        if (wickets > player._bestBowlingWickets || 
            (wickets === player._bestBowlingWickets && runs < player._bestBowlingRuns)) {
          player._bestBowlingWickets = wickets;
          player._bestBowlingRuns = runs;
          player.bestBowling = `${wickets}/${runs}`;
        }
      }
    });
    
    // Calculate derived stats
    Object.values(playerStatsMap).forEach(player => {
      // Count unique matches (approximate by innings count)
      player.matches = player.innings;
      
      // Batting average
      const dismissals = player.innings - player.notOuts;
      player.average = dismissals > 0 ? (player.runs / dismissals).toFixed(2) : player.runs.toFixed(2);
      
      // Strike rate
      player.strikeRate = player.ballsFaced > 0 
        ? ((player.runs / player.ballsFaced) * 100).toFixed(2) 
        : '0.00';
      
      // Bowling average
      player.bowlingAverage = player.wickets > 0 
        ? (player.runsConceded / player.wickets).toFixed(2) 
        : '0.00';
      
      // Economy rate
      const overs = player.ballsBowled > 0 
        ? Math.floor(player.ballsBowled / 6) + (player.ballsBowled % 6) / 10 
        : 0;
      player.economy = overs > 0 
        ? (player.runsConceded / overs).toFixed(2) 
        : '0.00';
      
      // Clean up temporary fields
      delete player._bestBowlingWickets;
      delete player._bestBowlingRuns;
    });
    
    return { data: Object.values(playerStatsMap), error: null };
  } catch (error) {
    console.error('Error fetching player stats:', error);
    return { data: null, error };
  }
};

/**
 * Get top run scorers
 */
export const getTopRunScorers = async (limit = 10) => {
  try {
    const { data, error } = await getPlayersWithStats();
    
    if (error) throw error;
    
    const topScorers = data
      .filter(p => p.runs > 0)
      .sort((a, b) => {
        if (b.runs !== a.runs) return b.runs - a.runs;
        return parseFloat(b.average) - parseFloat(a.average);
      })
      .slice(0, limit);
    
    return { data: topScorers, error: null };
  } catch (error) {
    console.error('Error fetching top run scorers:', error);
    return { data: null, error };
  }
};

/**
 * Get top wicket takers
 */
export const getTopWicketTakers = async (limit = 10) => {
  try {
    const { data, error } = await getPlayersWithStats();
    
    if (error) throw error;
    
    const topWicketTakers = data
      .filter(p => p.wickets > 0)
      .sort((a, b) => {
        if (b.wickets !== a.wickets) return b.wickets - a.wickets;
        return parseFloat(a.bowlingAverage) - parseFloat(b.bowlingAverage);
      })
      .slice(0, limit);
    
    return { data: topWicketTakers, error: null };
  } catch (error) {
    console.error('Error fetching top wicket takers:', error);
    return { data: null, error };
  }
};

/**
 * Subscribe to player stats changes (Real-time)
 */
export const subscribeToPlayerStats = (callback) => {
  const subscription = supabase
    .channel('player_stats_changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'batting_innings'
      },
      (payload) => {
        callback(payload);
      }
    )
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'bowling_innings'
      },
      (payload) => {
        callback(payload);
      }
    )
    .subscribe();
  
  return subscription;
};

/**
 * Unsubscribe from player stats changes
 */
export const unsubscribeFromPlayerStats = (subscription) => {
  if (subscription) {
    supabase.removeChannel(subscription);
  }
};


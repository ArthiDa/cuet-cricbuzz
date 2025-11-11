import { supabase } from '../config/supabase';

/**
 * Points Table Service - Calculate tournament standings
 */

/**
 * Calculate Net Run Rate (NRR) for a team
 * NRR = (Total Runs Scored / Total Overs Faced) - (Total Runs Conceded / Total Overs Bowled)
 */
const calculateNRR = (runsScored, oversFaced, runsConceded, oversBowled) => {
  if (oversFaced === 0 && oversBowled === 0) return 0;
  
  const runRate = oversFaced > 0 ? runsScored / oversFaced : 0;
  const concededRate = oversBowled > 0 ? runsConceded / oversBowled : 0;
  
  return runRate - concededRate;
};

/**
 * Get points table from all completed matches
 */
export const getPointsTable = async () => {
  try {
    // Fetch all completed matches with innings data
    const { data: matches, error: matchesError } = await supabase
      .from('matches')
      .select(`
        id,
        team1_id,
        team2_id,
        winner_id,
        result_type,
        status,
        archived,
        team1:teams!matches_team1_id_fkey(id, name, short_name, logo),
        team2:teams!matches_team2_id_fkey(id, name, short_name, logo),
        innings(
          id,
          inning_number,
          batting_team_id,
          bowling_team_id,
          total_runs,
          total_wickets,
          total_overs,
          total_balls
        )
      `)
      .eq('status', 'completed')
      .eq('archived', false);
    
    if (matchesError) throw matchesError;
    
    // Fetch all teams
    const { data: teams, error: teamsError } = await supabase
      .from('teams')
      .select('id, name, short_name, logo')
      .order('name', { ascending: true });
    
    if (teamsError) throw teamsError;
    
    // Initialize standings object
    const standings = {};
    teams.forEach(team => {
      standings[team.id] = {
        team: {
          id: team.id,
          name: team.name,
          shortName: team.short_name,
          logo: team.logo || '🏏',
        },
        played: 0,
        won: 0,
        lost: 0,
        tied: 0,
        noResult: 0,
        runsScored: 0,
        oversFaced: 0,
        runsConceded: 0,
        oversBowled: 0,
        points: 0,
        nrr: 0,
      };
    });
    
    // Process each match
    matches?.forEach(match => {
      const team1Id = match.team1_id;
      const team2Id = match.team2_id;
      const winnerId = match.winner_id;
      const resultType = match.result_type;
      
      // Update matches played
      if (standings[team1Id]) standings[team1Id].played++;
      if (standings[team2Id]) standings[team2Id].played++;
      
      // Update wins/losses/ties
      if (resultType === 'tied') {
        if (standings[team1Id]) {
          standings[team1Id].tied++;
          standings[team1Id].points += 1;
        }
        if (standings[team2Id]) {
          standings[team2Id].tied++;
          standings[team2Id].points += 1;
        }
      } else if (winnerId) {
        if (standings[winnerId]) {
          standings[winnerId].won++;
          standings[winnerId].points += 2;
        }
        
        const loserId = winnerId === team1Id ? team2Id : team1Id;
        if (standings[loserId]) {
          standings[loserId].lost++;
        }
      }
      
      // Calculate runs and overs for NRR
      match.innings?.forEach(inning => {
        const battingTeamId = inning.batting_team_id;
        const bowlingTeamId = inning.bowling_team_id;
        
        if (standings[battingTeamId]) {
          standings[battingTeamId].runsScored += inning.total_runs || 0;
          standings[battingTeamId].oversFaced += inning.total_overs || 0;
        }
        
        if (standings[bowlingTeamId]) {
          standings[bowlingTeamId].runsConceded += inning.total_runs || 0;
          standings[bowlingTeamId].oversBowled += inning.total_overs || 0;
        }
      });
    });
    
    // Calculate NRR for each team
    Object.keys(standings).forEach(teamId => {
      const team = standings[teamId];
      team.nrr = calculateNRR(
        team.runsScored,
        team.oversFaced,
        team.runsConceded,
        team.oversBowled
      );
    });
    
    // Convert to array and sort by points (desc), then NRR (desc)
    const pointsTableArray = Object.values(standings)
      .filter(team => team.played > 0) // Only show teams that have played
      .sort((a, b) => {
        if (b.points !== a.points) {
          return b.points - a.points;
        }
        return b.nrr - a.nrr;
      })
      .map((team, index) => ({
        ...team,
        position: index + 1,
        nrr: team.nrr.toFixed(3), // Format NRR to 3 decimal places
      }));
    
    return { data: pointsTableArray, error: null };
  } catch (error) {
    console.error('Error calculating points table:', error);
    return { data: null, error };
  }
};

/**
 * Subscribe to matches changes for real-time points table updates
 */
export const subscribeToPointsTable = (callback) => {
  const subscription = supabase
    .channel('points_table_changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'matches'
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
        table: 'innings'
      },
      (payload) => {
        callback(payload);
      }
    )
    .subscribe();
  
  return subscription;
};

/**
 * Unsubscribe from points table changes
 */
export const unsubscribeFromPointsTable = (subscription) => {
  if (subscription) {
    supabase.removeChannel(subscription);
  }
};


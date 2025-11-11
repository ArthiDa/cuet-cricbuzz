import { supabase } from '../config/supabase';

/**
 * Match Service - CRUD operations for matches
 */

// Get the current tournament ID
const getCurrentTournamentId = async () => {
  const { data, error } = await supabase
    .from('tournaments')
    .select('id')
    .limit(1)
    .single();
  
  if (error) throw error;
  return data.id;
};

/**
 * Get all matches with team information (excludes archived)
 */
export const getAllMatches = async () => {
  try {
    const { data, error } = await supabase
      .from('matches')
      .select(`
        *,
        team1:teams!matches_team1_id_fkey(id, name, short_name, logo),
        team2:teams!matches_team2_id_fkey(id, name, short_name, logo),
        toss_winner:teams!matches_toss_winner_id_fkey(id, name, short_name),
        winner:teams!matches_winner_id_fkey(id, name, short_name),
        innings(
          id,
          inning_number,
          batting_team_id,
          total_runs,
          total_wickets,
          total_overs,
          status
        )
      `)
      .eq('archived', false)
      .order('match_number', { ascending: true });
    
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching matches:', error);
    return { data: null, error };
  }
};

/**
 * Get archived matches
 */
export const getArchivedMatches = async () => {
  try {
    const { data, error } = await supabase
      .from('matches')
      .select(`
        *,
        team1:teams!matches_team1_id_fkey(id, name, short_name, logo),
        team2:teams!matches_team2_id_fkey(id, name, short_name, logo),
        winner:teams!matches_winner_id_fkey(id, name, short_name, logo),
        innings(
          id,
          inning_number,
          batting_team_id,
          total_runs,
          total_wickets,
          total_overs
        )
      `)
      .eq('archived', true)
      .order('match_date', { ascending: false });
    
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching archived matches:', error);
    return { data: null, error };
  }
};

/**
 * Get match by ID with full details
 */
export const getMatchById = async (matchId) => {
  try {
    const { data, error } = await supabase
      .from('matches')
      .select(`
        *,
        team1:teams!matches_team1_id_fkey(id, name, short_name, logo),
        team2:teams!matches_team2_id_fkey(id, name, short_name, logo),
        toss_winner:teams!matches_toss_winner_id_fkey(id, name, short_name),
        winner:teams!matches_winner_id_fkey(id, name, short_name),
        innings(
          *,
          batting_team:teams!innings_batting_team_id_fkey(id, name, short_name, logo),
          bowling_team:teams!innings_bowling_team_id_fkey(id, name, short_name, logo)
        )
      `)
      .eq('id', matchId)
      .single();
    
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching match:', error);
    return { data: null, error };
  }
};

/**
 * Create new match
 */
export const createMatch = async (matchData) => {
  try {
    const tournamentId = await getCurrentTournamentId();
    
    const { data, error } = await supabase
      .from('matches')
      .insert([
        {
          tournament_id: tournamentId,
          match_number: matchData.matchNumber,
          team1_id: matchData.team1Id,
          team2_id: matchData.team2Id,
          venue: matchData.venue,
          match_date: matchData.date,
          match_time: matchData.time || null,
          overs_per_side: matchData.overs,
          toss_winner_id: matchData.tossWinnerId || null,
          toss_decision: matchData.tossDecision || null,
          status: 'upcoming'
        }
      ])
      .select(`
        *,
        team1:team1_id(id, name, short_name, logo),
        team2:team2_id(id, name, short_name, logo)
      `)
      .single();
    
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error creating match:', error);
    return { data: null, error };
  }
};

/**
 * Update match
 */
export const updateMatch = async (matchId, matchData) => {
  try {
    const { data, error } = await supabase
      .from('matches')
      .update({
        match_number: matchData.matchNumber,
        team1_id: matchData.team1Id,
        team2_id: matchData.team2Id,
        venue: matchData.venue,
        match_date: matchData.date,
        match_time: matchData.time || null,
        overs_per_side: matchData.overs,
        toss_winner_id: matchData.tossWinnerId || null,
        toss_decision: matchData.tossDecision || null,
      })
      .eq('id', matchId)
      .select(`
        *,
        team1:team1_id(id, name, short_name, logo),
        team2:team2_id(id, name, short_name, logo)
      `)
      .single();
    
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error updating match:', error);
    return { data: null, error };
  }
};

/**
 * Delete match (only for upcoming matches)
 */
export const deleteMatch = async (matchId) => {
  try {
    // Check match status
    const { data: match } = await supabase
      .from('matches')
      .select('status')
      .eq('id', matchId)
      .single();
    
    if (!match) {
      return { 
        data: null, 
        error: { message: 'Match not found.' } 
      };
    }
    
    // Only allow deletion of upcoming matches
    if (match.status !== 'upcoming') {
      return { 
        data: null, 
        error: { message: 'Cannot delete started or completed matches. Use Archive instead.' } 
      };
    }
    
    const { error } = await supabase
      .from('matches')
      .delete()
      .eq('id', matchId);
    
    if (error) throw error;
    return { data: true, error: null };
  } catch (error) {
    console.error('Error deleting match:', error);
    return { data: null, error };
  }
};

/**
 * Archive match
 */
export const archiveMatch = async (matchId) => {
  try {
    const { error } = await supabase
      .from('matches')
      .update({ archived: true })
      .eq('id', matchId);
    
    if (error) throw error;
    return { data: true, error: null };
  } catch (error) {
    console.error('Error archiving match:', error);
    return { data: null, error };
  }
};

/**
 * Unarchive match
 */
export const unarchiveMatch = async (matchId) => {
  try {
    const { error } = await supabase
      .from('matches')
      .update({ archived: false })
      .eq('id', matchId);
    
    if (error) throw error;
    return { data: true, error: null };
  } catch (error) {
    console.error('Error unarchiving match:', error);
    return { data: null, error };
  }
};

/**
 * Start a match (change status to live and create innings)
 */
export const startMatch = async (matchId, tossWinnerId, tossDecision) => {
  try {
    // Update match status
    const { data: match, error: matchError } = await supabase
      .from('matches')
      .update({
        status: 'live',
        toss_winner_id: tossWinnerId,
        toss_decision: tossDecision,
        current_inning: 1
      })
      .eq('id', matchId)
      .select(`
        *,
        team1:teams!matches_team1_id_fkey(id, name, short_name, logo),
        team2:teams!matches_team2_id_fkey(id, name, short_name, logo)
      `)
      .single();
    
    if (matchError) throw matchError;
    
    // Determine batting and bowling teams based on toss
    const battingTeamId = tossDecision === 'bat' ? tossWinnerId : 
                          (tossWinnerId === match.team1_id ? match.team2_id : match.team1_id);
    const bowlingTeamId = tossDecision === 'bat' ? 
                          (tossWinnerId === match.team1_id ? match.team2_id : match.team1_id) : 
                          tossWinnerId;
    
    // Create first innings
    const { data: innings, error: inningsError } = await supabase
      .from('innings')
      .insert([
        {
          match_id: matchId,
          inning_number: 1,
          batting_team_id: battingTeamId,
          bowling_team_id: bowlingTeamId,
          status: 'in_progress'
        }
      ])
      .select()
      .single();
    
    if (inningsError) throw inningsError;
    
    return { data: { match, innings }, error: null };
  } catch (error) {
    console.error('Error starting match:', error);
    return { data: null, error };
  }
};

/**
 * Get live matches (excludes archived)
 */
export const getLiveMatches = async () => {
  try {
    const { data, error } = await supabase
      .from('matches')
      .select(`
        *,
        team1:teams!matches_team1_id_fkey(id, name, short_name, logo),
        team2:teams!matches_team2_id_fkey(id, name, short_name, logo),
        innings(
          id,
          inning_number,
          batting_team_id,
          total_runs,
          total_wickets,
          total_overs,
          run_rate
        )
      `)
      .eq('status', 'live')
      .eq('archived', false)
      .order('match_number', { ascending: true });
    
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching live matches:', error);
    return { data: null, error };
  }
};

/**
 * Get upcoming matches (excludes archived)
 */
export const getUpcomingMatches = async () => {
  try {
    const { data, error } = await supabase
      .from('matches')
      .select(`
        *,
        team1:teams!matches_team1_id_fkey(id, name, short_name, logo),
        team2:teams!matches_team2_id_fkey(id, name, short_name, logo)
      `)
      .eq('status', 'upcoming')
      .eq('archived', false)
      .order('match_date', { ascending: true });
    
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching upcoming matches:', error);
    return { data: null, error };
  }
};

/**
 * Get completed matches (excludes archived)
 */
export const getCompletedMatches = async () => {
  try {
    const { data, error } = await supabase
      .from('matches')
      .select(`
        *,
        team1:teams!matches_team1_id_fkey(id, name, short_name, logo),
        team2:teams!matches_team2_id_fkey(id, name, short_name, logo),
        winner:teams!matches_winner_id_fkey(id, name, short_name, logo),
        innings(
          id,
          inning_number,
          batting_team_id,
          total_runs,
          total_wickets,
          total_overs
        )
      `)
      .eq('status', 'completed')
      .eq('archived', false)
      .order('match_date', { ascending: false });
    
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching completed matches:', error);
    return { data: null, error };
  }
};

/**
 * Subscribe to matches changes (Real-time)
 */
export const subscribeToMatches = (callback) => {
  const subscription = supabase
    .channel('matches_changes')
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
    .subscribe();
  
  return subscription;
};

/**
 * Unsubscribe from matches changes
 */
export const unsubscribeFromMatches = (subscription) => {
  if (subscription) {
    supabase.removeChannel(subscription);
  }
};


import { supabase } from '../config/supabase';

/**
 * Player Service - CRUD operations for players
 */

/**
 * Get all players with their team information
 */
export const getAllPlayers = async () => {
  try {
    const { data, error } = await supabase
      .from('players')
      .select(`
        *,
        team:teams(id, name, short_name, logo)
      `)
      .order('name', { ascending: true });
    
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching players:', error);
    return { data: null, error };
  }
};

/**
 * Get players by team ID
 */
export const getPlayersByTeam = async (teamId) => {
  try {
    const { data, error } = await supabase
      .from('players')
      .select('*')
      .eq('team_id', teamId)
      .order('name', { ascending: true });
    
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching team players:', error);
    return { data: null, error };
  }
};

/**
 * Get player by ID
 */
export const getPlayerById = async (playerId) => {
  try {
    const { data, error } = await supabase
      .from('players')
      .select(`
        *,
        team:teams(id, name, short_name, logo)
      `)
      .eq('id', playerId)
      .single();
    
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching player:', error);
    return { data: null, error };
  }
};

/**
 * Create new player
 */
export const createPlayer = async (playerData) => {
  try {
    const { data, error } = await supabase
      .from('players')
      .insert([
        {
          team_id: playerData.teamId,
          name: playerData.name,
          role: playerData.role,
          jersey_number: playerData.jerseyNumber || null,
        }
      ])
      .select(`
        *,
        team:teams(id, name, short_name, logo)
      `)
      .single();
    
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error creating player:', error);
    return { data: null, error };
  }
};

/**
 * Update player
 */
export const updatePlayer = async (playerId, playerData) => {
  try {
    const { data, error } = await supabase
      .from('players')
      .update({
        team_id: playerData.teamId,
        name: playerData.name,
        role: playerData.role,
        jersey_number: playerData.jerseyNumber || null,
      })
      .eq('id', playerId)
      .select(`
        *,
        team:teams(id, name, short_name, logo)
      `)
      .single();
    
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error updating player:', error);
    return { data: null, error };
  }
};

/**
 * Delete player
 */
export const deletePlayer = async (playerId) => {
  try {
    // Check if player has match statistics
    const { data: stats } = await supabase
      .from('batting_innings')
      .select('id')
      .eq('player_id', playerId)
      .limit(1);
    
    if (stats && stats.length > 0) {
      return { 
        data: null, 
        error: { message: 'Cannot delete player with match records. Player has played in matches.' } 
      };
    }
    
    const { error } = await supabase
      .from('players')
      .delete()
      .eq('id', playerId);
    
    if (error) throw error;
    return { data: true, error: null };
  } catch (error) {
    console.error('Error deleting player:', error);
    return { data: null, error };
  }
};

/**
 * Get player statistics
 */
export const getPlayerStats = async (playerId) => {
  try {
    const { data, error } = await supabase
      .from('players')
      .select(`
        *,
        team:teams(name, short_name, logo),
        batting_innings(
          runs_scored,
          balls_faced,
          fours,
          sixes,
          is_out
        ),
        bowling_innings(
          overs_bowled,
          runs_conceded,
          wickets_taken
        )
      `)
      .eq('id', playerId)
      .single();
    
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching player stats:', error);
    return { data: null, error };
  }
};

/**
 * Subscribe to players changes (Real-time)
 */
export const subscribeToPlayers = (callback) => {
  const subscription = supabase
    .channel('players_changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'players'
      },
      (payload) => {
        callback(payload);
      }
    )
    .subscribe();
  
  return subscription;
};

/**
 * Unsubscribe from players changes
 */
export const unsubscribeFromPlayers = (subscription) => {
  if (subscription) {
    supabase.removeChannel(subscription);
  }
};


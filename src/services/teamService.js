import { supabase } from '../config/supabase';

/**
 * Team Service - CRUD operations for teams
 */

// Get the current tournament ID (for now, we'll use the first one)
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
 * Get all teams
 */
export const getAllTeams = async () => {
  try {
    const { data, error } = await supabase
      .from('teams')
      .select('*')
      .order('name', { ascending: true });
    
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching teams:', error);
    return { data: null, error };
  }
};

/**
 * Get team by ID
 */
export const getTeamById = async (teamId) => {
  try {
    const { data, error } = await supabase
      .from('teams')
      .select('*')
      .eq('id', teamId)
      .single();
    
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching team:', error);
    return { data: null, error };
  }
};

/**
 * Create new team
 */
export const createTeam = async (teamData) => {
  try {
    const tournamentId = await getCurrentTournamentId();
    
    const { data, error } = await supabase
      .from('teams')
      .insert([
        {
          tournament_id: tournamentId,
          name: teamData.name,
          short_name: teamData.shortName,
          logo: teamData.logo || '🏏',
          color: teamData.color || '#10b981',
        }
      ])
      .select()
      .single();
    
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error creating team:', error);
    return { data: null, error };
  }
};

/**
 * Update team
 */
export const updateTeam = async (teamId, teamData) => {
  try {
    const { data, error } = await supabase
      .from('teams')
      .update({
        name: teamData.name,
        short_name: teamData.shortName,
        logo: teamData.logo,
        color: teamData.color,
      })
      .eq('id', teamId)
      .select()
      .single();
    
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error updating team:', error);
    return { data: null, error };
  }
};

/**
 * Delete team
 */
export const deleteTeam = async (teamId) => {
  try {
    // Check if team has players
    const { data: players } = await supabase
      .from('players')
      .select('id')
      .eq('team_id', teamId);
    
    if (players && players.length > 0) {
      return { 
        data: null, 
        error: { message: 'Cannot delete team with existing players. Delete players first.' } 
      };
    }
    
    // Check if team has matches
    const { data: matches } = await supabase
      .from('matches')
      .select('id')
      .or(`team1_id.eq.${teamId},team2_id.eq.${teamId}`);
    
    if (matches && matches.length > 0) {
      return { 
        data: null, 
        error: { message: 'Cannot delete team with existing matches.' } 
      };
    }
    
    const { error } = await supabase
      .from('teams')
      .delete()
      .eq('id', teamId);
    
    if (error) throw error;
    return { data: true, error: null };
  } catch (error) {
    console.error('Error deleting team:', error);
    return { data: null, error };
  }
};

/**
 * Get team statistics
 */
export const getTeamStats = async (teamId) => {
  try {
    const { data, error } = await supabase
      .from('teams')
      .select(`
        *,
        players:players(count)
      `)
      .eq('id', teamId)
      .single();
    
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching team stats:', error);
    return { data: null, error };
  }
};

/**
 * Subscribe to teams changes (Real-time)
 */
export const subscribeToTeams = (callback) => {
  const subscription = supabase
    .channel('teams_changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'teams'
      },
      (payload) => {
        callback(payload);
      }
    )
    .subscribe();
  
  return subscription;
};

/**
 * Unsubscribe from teams changes
 */
export const unsubscribeFromTeams = (subscription) => {
  if (subscription) {
    supabase.removeChannel(subscription);
  }
};


import { useState, useEffect } from 'react';
import { getAllTeams } from '../../services/teamService';
import TeamCard from '../../components/team/TeamCard';

const Teams = () => {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const fetchTeams = async () => {
    setLoading(true);
    setError('');
    
    try {
      const { data, error } = await getAllTeams();
      
      if (error) throw error;
      
      setTeams(data || []);
    } catch (err) {
      setError('Failed to load teams: ' + err.message);
      console.error('Error fetching teams:', err);
    } finally {
      setLoading(false);
    }
  };
  
  // Initial fetch
  useEffect(() => {
    fetchTeams();
  }, []);
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-bounce">🏏</div>
          <p className="text-xl text-gray-600">Loading teams...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-800 mb-2">Teams</h1>
        <p className="text-gray-600">
          {teams.length} teams competing in CUET T10 Tournament
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 bg-red-50 border-2 border-red-300 rounded-lg p-4 text-red-700">
          <p className="font-semibold">⚠️ {error}</p>
        </div>
      )}

      {/* Teams Grid */}
      {teams.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {teams.map(team => (
            <TeamCard key={team.id} team={team} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <div className="text-6xl mb-4">🏏</div>
          <h3 className="text-2xl font-bold text-gray-700 mb-2">No Teams Yet</h3>
          <p className="text-gray-500">Teams will appear once they are added to the tournament.</p>
        </div>
      )}
    </div>
  );
};

export default Teams;


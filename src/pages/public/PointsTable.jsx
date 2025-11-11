import { useState, useEffect } from 'react';
import { getPointsTable, subscribeToPointsTable, unsubscribeFromPointsTable } from '../../services/pointsTableService';
import Card from '../../components/common/Card';

const PointsTable = () => {
  const [pointsTable, setPointsTable] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const fetchPointsTable = async () => {
    setLoading(true);
    setError('');
    
    try {
      const { data, error } = await getPointsTable();
      
      if (error) throw error;
      
      setPointsTable(data || []);
    } catch (err) {
      setError('Failed to load points table: ' + err.message);
      console.error('Error fetching points table:', err);
    } finally {
      setLoading(false);
    }
  };
  
  // Initial fetch
  useEffect(() => {
    fetchPointsTable();
  }, []);
  
  // Real-time subscription
  useEffect(() => {
    const subscription = subscribeToPointsTable((payload) => {
      console.log('📡 Points table update received:', payload);
      fetchPointsTable(); // Refetch on any match/innings change
    });
    
    return () => {
      unsubscribeFromPointsTable(subscription);
    };
  }, []);
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-bounce">📊</div>
          <p className="text-xl text-gray-600">Loading points table...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-800 mb-2">Points Table</h1>
        <p className="text-gray-600">Tournament standings and statistics</p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 bg-red-50 border-2 border-red-300 rounded-lg p-4 text-red-700">
          <p className="font-semibold">⚠️ {error}</p>
        </div>
      )}

      {/* Points Table - Mobile Optimized with Horizontal Scroll */}
      <Card>
        <div className="overflow-x-auto -mx-6 sm:mx-0">
          <div className="inline-block min-w-full align-middle px-6 sm:px-0">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-2 sm:px-4 py-3 text-left text-xs sm:text-sm font-bold text-gray-700 whitespace-nowrap">Pos</th>
                  <th className="px-2 sm:px-4 py-3 text-left text-xs sm:text-sm font-bold text-gray-700 whitespace-nowrap">Team</th>
                  <th className="px-2 sm:px-4 py-3 text-center text-xs sm:text-sm font-bold text-gray-700 whitespace-nowrap">P</th>
                  <th className="px-2 sm:px-4 py-3 text-center text-xs sm:text-sm font-bold text-gray-700 whitespace-nowrap">W</th>
                  <th className="px-2 sm:px-4 py-3 text-center text-xs sm:text-sm font-bold text-gray-700 whitespace-nowrap">L</th>
                  <th className="px-2 sm:px-4 py-3 text-center text-xs sm:text-sm font-bold text-gray-700 whitespace-nowrap">T</th>
                  <th className="px-2 sm:px-4 py-3 text-center text-xs sm:text-sm font-bold text-gray-700 whitespace-nowrap">NRR</th>
                  <th className="px-2 sm:px-4 py-3 text-center text-xs sm:text-sm font-bold text-gray-700 whitespace-nowrap">Pts</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {pointsTable.length > 0 ? (
                  pointsTable.map((row) => (
                    <tr 
                      key={row.team.id} 
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-2 sm:px-4 py-3 sm:py-4">
                        <span className="font-bold text-gray-700 text-sm sm:text-base">{row.position}</span>
                      </td>
                      <td className="px-2 sm:px-4 py-3 sm:py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2 sm:space-x-3">
                          <span className="text-xl sm:text-2xl">{row.team.logo}</span>
                          <div>
                            <p className="font-semibold text-gray-800 text-xs sm:text-base">{row.team.shortName}</p>
                            <p className="text-xs text-gray-500 hidden sm:block">{row.team.name}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-2 sm:px-4 py-3 sm:py-4 text-center text-gray-700 text-sm sm:text-base">{row.played}</td>
                      <td className="px-2 sm:px-4 py-3 sm:py-4 text-center font-semibold text-green-600 text-sm sm:text-base">{row.won}</td>
                      <td className="px-2 sm:px-4 py-3 sm:py-4 text-center font-semibold text-red-600 text-sm sm:text-base">{row.lost}</td>
                      <td className="px-2 sm:px-4 py-3 sm:py-4 text-center text-gray-700 text-sm sm:text-base">{row.tied}</td>
                      <td className={`px-2 sm:px-4 py-3 sm:py-4 text-center font-semibold text-sm sm:text-base ${
                        parseFloat(row.nrr) >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {parseFloat(row.nrr) >= 0 ? '+' : ''}{row.nrr}
                      </td>
                      <td className="px-2 sm:px-4 py-3 sm:py-4 text-center">
                        <span className="inline-flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-green-100 text-green-800 font-bold text-sm sm:text-base">
                          {row.points}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8" className="px-4 py-8 text-center text-gray-500">
                      No matches completed yet. Points table will appear once matches are played.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        
        {/* Mobile Scroll Hint */}
        <div className="mt-4 text-center text-xs text-gray-500 sm:hidden">
          ← Swipe to see more →
        </div>

        {/* Legend */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-600">
            <span className="font-semibold">P:</span> Played • 
            <span className="font-semibold"> W:</span> Won • 
            <span className="font-semibold"> L:</span> Lost • 
            <span className="font-semibold"> T:</span> Tied • 
            <span className="font-semibold"> NRR:</span> Net Run Rate • 
            <span className="font-semibold"> Pts:</span> Points
          </p>
        </div>
      </Card>

      {/* Tournament Format Info */}
      <Card className="mt-6">
        <h3 className="font-bold text-lg text-gray-800 mb-3">Tournament Format</h3>
        <div className="space-y-2 text-gray-600">
          <p>• League Stage: All teams play each other</p>
          <p>• Top 4 teams qualify for Semi-Finals</p>
          <p>• Winners of Semi-Finals compete in the Final</p>
          <p>• Points: Win = 2, Tie/No Result = 1, Loss = 0</p>
        </div>
      </Card>
    </div>
  );
};

export default PointsTable;


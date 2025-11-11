import { useState, useEffect } from 'react';
import { getPointsTable, subscribeToPointsTable, unsubscribeFromPointsTable } from '../../services/pointsTableService';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';

const AdminPointsTable = () => {
  const [pointsTable, setPointsTable] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [recalculating, setRecalculating] = useState(false);

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
      console.log('📡 Admin Points Table: Update received:', payload);
      fetchPointsTable();
    });
    
    return () => {
      unsubscribeFromPointsTable(subscription);
    };
  }, []);

  const handleRecalculate = async () => {
    setRecalculating(true);
    await fetchPointsTable();
    setTimeout(() => {
      setRecalculating(false);
    }, 1000);
  };

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
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Points Table Management</h1>
          <p className="text-gray-600">View and manage tournament standings</p>
        </div>
        <Button onClick={handleRecalculate} variant="primary" disabled={recalculating}>
          {recalculating ? '🔄 Recalculating...' : '🔄 Recalculate Table'}
        </Button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 bg-red-50 border-2 border-red-300 rounded-lg p-4 text-red-700">
          <p className="font-semibold">⚠️ {error}</p>
        </div>
      )}

      <Card>
        <div className="overflow-x-auto -mx-6 sm:mx-0">
          <div className="inline-block min-w-full align-middle px-6 sm:px-0">
            <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-bold text-gray-700">Pos</th>
                <th className="px-4 py-3 text-left text-sm font-bold text-gray-700">Team</th>
                <th className="px-4 py-3 text-center text-sm font-bold text-gray-700">P</th>
                <th className="px-4 py-3 text-center text-sm font-bold text-gray-700">W</th>
                <th className="px-4 py-3 text-center text-sm font-bold text-gray-700">L</th>
                <th className="px-4 py-3 text-center text-sm font-bold text-gray-700">T</th>
                <th className="px-4 py-3 text-center text-sm font-bold text-gray-700">NRR</th>
                <th className="px-4 py-3 text-center text-sm font-bold text-gray-700">Pts</th>
                <th className="px-4 py-3 text-center text-sm font-bold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {pointsTable.length > 0 ? (
                pointsTable.map((row) => (
                  <tr key={row.team.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4">
                      <span className="font-bold text-gray-700">{row.position}</span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">{row.team.logo}</span>
                        <div>
                          <p className="font-semibold text-gray-800">{row.team.name}</p>
                          <p className="text-xs text-gray-500">{row.team.shortName}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center text-gray-700">{row.played}</td>
                    <td className="px-4 py-4 text-center font-semibold text-green-600">{row.won}</td>
                    <td className="px-4 py-4 text-center font-semibold text-red-600">{row.lost}</td>
                    <td className="px-4 py-4 text-center text-gray-700">{row.tied}</td>
                    <td className={`px-4 py-4 text-center font-semibold ${
                      parseFloat(row.nrr) >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {parseFloat(row.nrr) >= 0 ? '+' : ''}{row.nrr}
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-green-100 text-green-800 font-bold">
                        {row.points}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <div className="text-xs text-gray-500">
                        Auto-Updated
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="9" className="px-4 py-8 text-center text-gray-500">
                    <div className="text-5xl mb-4">📊</div>
                    <p className="font-semibold mb-2">No Data Available</p>
                    <p className="text-sm">Points table will appear once matches are completed.</p>
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
      </Card>

      <Card className="mt-6">
        <h3 className="font-bold text-lg mb-4">Points Calculation Rules</h3>
        <div className="space-y-2 text-gray-700">
          <p>• <strong>Win:</strong> 2 points</p>
          <p>• <strong>Loss:</strong> 0 points</p>
          <p>• <strong>Tie/No Result:</strong> 1 point each</p>
          <p>• <strong>Net Run Rate (NRR):</strong> (Total runs scored / Total overs faced) - (Total runs conceded / Total overs bowled)</p>
          <p className="mt-4 text-sm text-gray-600">
            * Points table is automatically updated after each match completion
          </p>
        </div>
      </Card>
    </div>
  );
};

export default AdminPointsTable;


const ScoreDisplay = ({ innings }) => {
  return (
    <div className="bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl p-6 shadow-xl">
      <div className="flex justify-between items-center">
        <div>
          <div className="flex items-center space-x-3 mb-2">
            <span className="text-3xl">{innings.battingTeam.logo}</span>
            <h2 className="text-2xl font-bold">{innings.battingTeam.name}</h2>
          </div>
          <p className="text-green-100 text-sm">
            vs {innings.bowlingTeam?.name || 'Opponent'}
          </p>
        </div>

        <div className="text-right">
          <div className="text-5xl font-bold">
            {innings.runs}/{innings.wickets}
          </div>
          <div className="text-xl text-green-100 mt-1">
            ({innings.overs} overs)
          </div>
        </div>
      </div>

      {/* Run Rate */}
      {innings.runRate && (
        <div className="flex justify-between mt-4 pt-4 border-t border-green-500">
          <div>
            <p className="text-green-200 text-sm">Current Run Rate</p>
            <p className="text-xl font-bold">{innings.runRate.current.toFixed(2)}</p>
          </div>
          {innings.runRate.required && (
            <div className="text-right">
              <p className="text-green-200 text-sm">Required Run Rate</p>
              <p className="text-xl font-bold">{innings.runRate.required.toFixed(2)}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ScoreDisplay;


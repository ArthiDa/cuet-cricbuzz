const BowlerCard = ({ bowler }) => {
  return (
    <div className="bg-blue-50 border-2 border-blue-500 rounded-lg p-4">
      <div className="flex justify-between items-center">
        <div>
          <h4 className="font-bold text-lg">{bowler.name}</h4>
          <span className="text-xs text-blue-700 font-semibold">BOWLING</span>
        </div>

        <div className="grid grid-cols-4 gap-4 text-center">
          <div>
            <p className="text-xs text-gray-500">Overs</p>
            <p className="font-bold text-lg">{bowler.overs}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Runs</p>
            <p className="font-bold text-lg">{bowler.runs}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Wickets</p>
            <p className="font-bold text-lg">{bowler.wickets}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Eco</p>
            <p className="font-bold text-lg">{bowler.economy.toFixed(1)}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BowlerCard;


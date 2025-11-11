const BatsmanCard = ({ batsman }) => {
  return (
    <div className={`flex justify-between items-center p-4 rounded-lg ${
      batsman.onStrike ? 'bg-green-50 border-2 border-green-500' : 'bg-gray-50'
    }`}>
      <div className="flex items-center space-x-3">
        {batsman.onStrike && (
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
        )}
        <div>
          <h4 className="font-bold text-lg">{batsman.name}</h4>
          {batsman.onStrike && (
            <span className="text-xs text-green-700 font-semibold">ON STRIKE</span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4 text-center">
        <div>
          <p className="text-xs text-gray-500">Runs</p>
          <p className="font-bold text-lg">{batsman.runs}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Balls</p>
          <p className="font-bold text-lg">{batsman.balls}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">4s/6s</p>
          <p className="font-bold text-lg">{batsman.fours}/{batsman.sixes}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">SR</p>
          <p className="font-bold text-lg">{batsman.strikeRate.toFixed(1)}</p>
        </div>
      </div>
    </div>
  );
};

export default BatsmanCard;


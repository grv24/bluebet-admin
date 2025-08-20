import React from "react";

interface GameData {
  title: string;
  image: string;
  label?: string;
}

interface ErrorModalProps {
  isOpen: boolean;
  onClose: () => void;
  gameData?: GameData;
}

const ErrorModal: React.FC<ErrorModalProps> = ({
  isOpen,
  onClose,
  gameData,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-md w-full mx-4">
        <div className="flex justify-between items-center p-4 bg-[#3b5160] w-full mb-4">
          <h2 className="text-xl font-bold  text-white">Game Details</h2>
        </div>

        {gameData && (
          <div className="space-y-4 px-6 ">
            <div className="text-center">
              <img
                src={gameData.image}
                alt={gameData.title}
                className="w-full h-48 object-cover rounded-lg mb-4"
              />
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                {gameData.title}
              </h3>
              {gameData.label && (
                <span className="inline-block bg-yellow-400 text-black px-3 py-1 rounded-full text-sm font-medium">
                  {gameData.label}
                </span>
              )}
            </div>

            <div className="text-center text-gray-600">
              <p>This game is currently under maintenance.</p>
              <p className="text-sm mt-2">Please try again later.</p>
            </div>
          </div>
        )}

        <div className="flex justify-end m-6 ">
          <button
            onClick={onClose}
            className="bg-[#3b5160] cursor-pointer hover:bg-[#29363f] text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ErrorModal;

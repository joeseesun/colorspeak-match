import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';

interface WinnerModalProps {
  onRestart: () => void;
}

export const WinnerModal: React.FC<WinnerModalProps> = ({ onRestart }) => {
  useEffect(() => {
    const duration = 3000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#FF6B6B', '#4ECDC4', '#FFE66D']
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#FF6B6B', '#4ECDC4', '#FFE66D']
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };

    frame();
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-[3rem] border-8 border-[#FFD93D] p-8 shadow-2xl max-w-sm w-full text-center transform transition-all scale-100 animate-bounce-gentle">
        <div className="w-24 h-24 bg-[#FFE66D] rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-white shadow-md">
          <span className="text-5xl">⭐</span>
        </div>
        
        <h2 className="text-4xl font-black text-[#4ECDC4] mb-2 drop-shadow-sm">
          YOU WON!
        </h2>
        <p className="text-gray-500 mb-8 font-semibold text-lg">
          Great Job, Super Star!
        </p>
        
        <button
          onClick={onRestart}
          className="w-full py-4 px-6 bg-[#FF6B6B] border-4 border-white text-white rounded-3xl font-black text-xl shadow-[0_6px_0_#d32f2f] hover:shadow-[0_8px_0_#d32f2f] active:translate-y-[4px] active:shadow-[0_2px_0_#d32f2f] transition-all"
        >
          Play Again
        </button>
      </div>
    </div>
  );
};
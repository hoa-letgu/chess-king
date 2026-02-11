import React, { useState } from "react";
import ChessGame from "@/games/chess/ChessGame";
import XiangqiGame from "@/games/xiangqi/XiangqiGame";
import GoGame from "@/games/go/GoGame";
import GomokuGame from "@/games/gomoku/GomokuGame";
import GameCard from "@/components/game-card";

export default function App() {
  const [selectedGame, setSelectedGame] = useState<string | null>(null);
  const [bg, setBg] = useState("/home/1920x720.png");

 const games = [
  {
    id: "chess",
    title: "Cờ Vua",
    description: "Trò chơi trí tuệ kinh điển của phương Tây.",
    image: "/chess/bgcovua.png",
    bg: "/chess/bgcovua.png",
  },
  {
    id: "xiangqi",
    title: "Cờ Tướng",
    description: "Chiến thuật điều binh khiển tướng phương Đông.",
    image: "/xiangqi/bgcotuong.png",
    bg: "/xiangqi/bgcotuong.png",
  },
  {
    id: "go",
    title: "Cờ Vây",
    description: "Nghệ thuật bao vây và chiếm lĩnh lãnh thổ.",
    image: "/go/bgcovay.png",
    bg: "/go/bgcovay.png",
  },
  {
    id: "gomoku",
    title: "Cờ Caro",
    description: "Nối 5 quân cờ để giành chiến thắng.",
    image: "/gomoku/bgxo.png",
    bg: "/gomoku/bgxo.png",
  },
];

  const renderGame = () => {
    switch (selectedGame) {
      case "chess":
        return <ChessGame onExit={() => setSelectedGame(null)} />;
      case "xiangqi":
        return <XiangqiGame onExit={() => setSelectedGame(null)} />;
      case "go":
        return <GoGame onExit={() => setSelectedGame(null)} />;
      case "gomoku":
        return <GomokuGame onExit={() => setSelectedGame(null)} />;
      default:
        return null;
    }
  };

  if (selectedGame) return renderGame();

  return (
    <div
      className="min-h-screen text-slate-50 bg-cover bg-center bg-no-repeat transition-all duration-500"
      style={{ backgroundImage: `url('${bg}')` }}
    >
      <div className="min-h-screen bg-black/70">
        <div className="container mx-auto px-4 py-16 md:py-24">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {games.map((game) => (
			 <GameCard
			  key={game.id}
			  title={game.title}
			  description={game.description}
			  image={game.bg}
			  onClick={() => setSelectedGame(game.id)}
			/>
			))}
          </div>
        </div>
      </div>
    </div>
  );
}
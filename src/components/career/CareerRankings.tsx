import React, { useState } from 'react';
import { Player, SurfaceAffinity } from '@/data/players';
import RankingsView from '@/components/RankingsView';
import PlayerDetailDialog from '@/components/PlayerDetailDialog';

interface Props {
  players: Player[];
  careerPlayerId: number;
  getH2HRecord?: (opponentId: number) => { wins: number; losses: number };
  getH2HPair?: (id1: number, id2: number) => { p1Wins: number; p2Wins: number };
}

const CareerRankings: React.FC<Props> = ({ players, careerPlayerId, getH2HRecord, getH2HPair }) => {
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const handlePlayerSelect = (player: Player) => {
    setSelectedPlayer(player);
    setDialogOpen(true);
  };

  return (
    <>
      <RankingsView players={players} onPlayerSelect={handlePlayerSelect} careerPlayerId={careerPlayerId} getH2HRecord={getH2HRecord} />
      <PlayerDetailDialog
        player={selectedPlayer}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onUpdateFictionalRanking={() => {}}
        getH2HPair={getH2HPair}
        allPlayers={players}
        readOnly={selectedPlayer?.id === careerPlayerId}
      />
    </>
  );
};

export default CareerRankings;

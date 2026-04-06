import React, { useState } from 'react';
import { Player, SurfaceAffinity } from '@/data/players';
import RankingsView from '@/components/RankingsView';
import PlayerDetailDialog from '@/components/PlayerDetailDialog';

interface Props {
  players: Player[];
  careerPlayerId: number;
}

const CareerRankings: React.FC<Props> = ({ players, careerPlayerId }) => {
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const handlePlayerSelect = (player: Player) => {
    if (player.id === careerPlayerId) return; // Don't show detail for career player
    setSelectedPlayer(player);
    setDialogOpen(true);
  };

  return (
    <>
      <RankingsView players={players} onPlayerSelect={handlePlayerSelect} />
      <PlayerDetailDialog
        player={selectedPlayer}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onUpdateFictionalRanking={() => {}} // Read-only in career mode
      />
    </>
  );
};

export default CareerRankings;

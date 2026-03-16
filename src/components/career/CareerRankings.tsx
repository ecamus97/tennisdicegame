import React from 'react';
import { Player } from '@/data/players';
import RankingsView from '@/components/RankingsView';
import PlayerDetailDialog from '@/components/PlayerDetailDialog';
import { useState } from 'react';

interface Props {
  players: Player[];
  careerPlayerId: number;
}

const CareerRankings: React.FC<Props> = ({ players, careerPlayerId }) => {
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const handlePlayerSelect = (player: Player) => {
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
      />
    </>
  );
};

export default CareerRankings;

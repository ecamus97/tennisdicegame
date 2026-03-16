import React, { useState } from 'react';
import { Player } from '@/data/players';
import RankingsView from '@/components/RankingsView';

interface Props {
  players: Player[];
  careerPlayerId: number;
}

const CareerRankings: React.FC<Props> = ({ players }) => {
  return <RankingsView players={players} />;
};

export default CareerRankings;

import React from 'react';
import { CareerPlayer } from '@/data/careerData';
import { DollarSign, TrendingUp, TrendingDown } from 'lucide-react';

interface Props {
  player: CareerPlayer;
}

const CareerFinances: React.FC<Props> = ({ player }) => {
  const totalIncome = player.financialHistory.filter(f => f.type === 'income').reduce((s, f) => s + f.amount, 0);
  const totalExpenses = player.financialHistory.filter(f => f.type === 'expense').reduce((s, f) => s + f.amount, 0);

  return (
    <div className="space-y-4">
      <div className="glass-card p-4">
        <h2 className="font-display font-semibold text-foreground mb-4">💰 Finances</h2>
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="p-3 rounded-lg bg-secondary/30 text-center">
            <DollarSign className="w-5 h-5 mx-auto text-accent mb-1" />
            <div className="text-xs text-muted-foreground">Balance</div>
            <div className="text-lg font-display font-bold text-foreground">${player.money.toLocaleString()}</div>
          </div>
          <div className="p-3 rounded-lg bg-secondary/30 text-center">
            <TrendingUp className="w-5 h-5 mx-auto text-green-400 mb-1" />
            <div className="text-xs text-muted-foreground">Total Income</div>
            <div className="text-lg font-display font-bold text-green-400">${totalIncome.toLocaleString()}</div>
          </div>
          <div className="p-3 rounded-lg bg-secondary/30 text-center">
            <TrendingDown className="w-5 h-5 mx-auto text-red-400 mb-1" />
            <div className="text-xs text-muted-foreground">Total Expenses</div>
            <div className="text-lg font-display font-bold text-red-400">${totalExpenses.toLocaleString()}</div>
          </div>
        </div>
      </div>

      <div className="glass-card p-4">
        <h3 className="font-display font-semibold text-foreground mb-3">Transaction History</h3>
        <div className="space-y-1.5 max-h-96 overflow-y-auto">
          {player.financialHistory.slice().reverse().map((f, i) => (
            <div key={i} className="flex items-center justify-between text-xs p-2 rounded bg-secondary/20">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${f.type === 'income' ? 'bg-green-400' : 'bg-red-400'}`} />
                <span className="text-foreground">{f.description}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">S{f.season} W{f.week}</span>
                <span className={f.type === 'income' ? 'text-green-400' : 'text-red-400'}>
                  {f.type === 'income' ? '+' : '-'}${f.amount.toLocaleString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CareerFinances;

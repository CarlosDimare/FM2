
import React, { useState } from 'react';
import { Club } from '../types';
import { world } from '../services/worldManager';
import { notifyAll } from '../stores/worldStore';
import { FMBox, FMButton } from './FMUI';
import { Building2, Award, DollarSign, Users, ArrowUp } from 'lucide-react';

interface BoardViewProps {
  userClub: Club;
}

export const BoardView: React.FC<BoardViewProps> = ({ userClub }) => {
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const refreshClub = () => notifyAll();

  const handleUpgrade = (facility: 'training' | 'youth') => {
    const result = world.requestFacilityUpgrade(userClub.id, facility, new Date());
    setFeedback({ type: result.success ? 'success' : 'error', message: result.message });
    refreshClub();
  };

  const handleBudgetRequest = () => {
    const result = world.requestBudgetIncrease(userClub.id, new Date());
    setFeedback({ type: result.success ? 'success' : 'error', message: result.message });
    refreshClub();
  };

  const trainingCost = Math.round((userClub.trainingFacilities + 1) * (userClub.trainingFacilities + 1) * 50000);
  const youthCost = Math.round((userClub.youthFacilities + 1) * (userClub.youthFacilities + 1) * 50000);
  const requestedAmount = Math.round(userClub.finances.transferBudget * 0.3);

  const confidenceColor = userClub.boardConfidence >= 70 ? 'text-green-600' : userClub.boardConfidence >= 40 ? 'text-amber-600' : 'text-red-600';

  return (
    <div className="p-2 md:p-4 h-full flex flex-col gap-4 bg-[#d4dcd4] overflow-y-auto">
      <header className="shrink-0">
        <h2 className="text-xl md:text-2xl font-black text-slate-900 uppercase italic tracking-tighter flex items-center gap-2">
          <Award size={22} /> Directiva
       </h2>
        <p className="text-slate-600 font-bold text-[10px] uppercase tracking-widest">
          Presenta tus propuestas a la junta directiva de {userClub.name}.
       </p>
     </header>

      <FMBox title="Confianza de la directiva">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-700">Nivel actual</span>
            <span className={`font-black text-lg ${confidenceColor}`}>{Math.round(userClub.boardConfidence)}%</span>
         </div>
          <div className="h-4 bg-slate-300 rounded-sm overflow-hidden border border-slate-400">
            <div
              className={`h-full transition-all ${userClub.boardConfidence >= 70 ? 'bg-green-500' : userClub.boardConfidence >= 40 ? 'bg-amber-500' : 'bg-red-500'}`}
              style={{ width: `${userClub.boardConfidence}%` }}
            />
         </div>
          <div className="text-[10px] text-slate-500 italic">
            {userClub.boardConfidence >= 70 ? '✓ Te tienen en alta estima. Probablemente aceptarán tus peticiones.' :
             userClub.boardConfidence >= 40 ? '! Estabilidad normal. Algunas peticiones serán aprobadas.' :
             '⚠ La confianza es baja. Las propuestas podrían ser rechazadas.'}
         </div>
       </div>
     </FMBox>

      <FMBox title="Saldo y finanzas">
        <div className="grid grid-cols-2 gap-3 text-[11px]">
          <div className="bg-white border border-slate-300 p-3 rounded-sm">
            <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Saldo</div>
            <div className="font-black text-slate-900">£{userClub.finances.balance.toLocaleString()</div>
         </div>
          <div className="bg-white border border-slate-300 p-3 rounded-sm">
            <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Presupuesto Fichajes</div>
            <div className="font-black text-green-700">£{userClub.finances.transferBudget.toLocaleString()</div>
         </div>
       </div>
     </FMBox>

      <FMBox title="Mejoras de Instalaciones">
        <div className="space-y-2">
          <div className="bg-white border border-slate-300 p-3 rounded-sm flex items-center justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="text-[10px] font-black uppercase flex items-center gap-2 mb-1">
                <Building2 size={14} /> Entrenamiento
             </div>
              <div className="text-[9px] text-slate-600">Nivel actual: <b>{userClub.trainingFacilities}/20</b</div>
              <div className="text-[9px] text-slate-600">Costo próximo nivel: <b>£{trainingCost.toLocaleString()</b</div>
           </div>
            <FMButton onClick={() => handleUpgrade('training')} disabled={userClub.trainingFacilities >= 20 || userClub.finances.balance < trainingCost} className="text-[10px] shrink-0">
              <ArrowUp size={12} /> Mejorar
           </FMButton>
         </div>
          <div className="bg-white border border-slate-300 p-3 rounded-sm flex items-center justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="text-[10px] font-black uppercase flex items-center gap-2 mb-1">
                <Users size={14} /> Juveniles
             </div>
              <div className="text-[9px] text-slate-600">Nivel actual: <b>{userClub.youthFacilities}/20</b</div>
              <div className="text-[9px] text-slate-600">Costo próximo nivel: <b>£{youthCost.toLocaleString()</b</div>
           </div>
            <FMButton onClick={() => handleUpgrade('youth')} disabled={userClub.youthFacilities >= 20 || userClub.finances.balance < youthCost} className="text-[10px] shrink-0">
              <ArrowUp size={12} /> Mejorar
           </FMButton>
         </div>
       </div>
     </FMBox>

      <FMBox title="Aumento de Presupuesto de Fichajes">
        <div className="bg-white border border-slate-300 p-3 rounded-sm">
          <div className="text-[10px] mb-2">Pide a la junta un aumento del 30% del presupuesto de fichajes actual</div>
          <div className="text-[9px] text-slate-600 mb-3">Aumento solicitado: <b>£{requestedAmount.toLocaleString()</b</div>
          <FMButton onClick={handleBudgetRequest} className="w-full text-[10px]" variant="primary">
            <DollarSign size={12} /> Solicitar aumento (£{requestedAmount.toLocaleString()})
         </FMButton>
       </div>
     </FMBox>

      {feedback && (
        <div className={`p-3 rounded-sm border ${feedback.type === 'success' ? 'bg-green-100 border-green-400 text-green-900' : 'bg-red-100 border-red-400 text-red-900'} text-xs font-bold`}>
          {feedback.message}
       </div>
      )}
   </div>
  );
};

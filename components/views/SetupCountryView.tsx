import React from 'react';
import { world } from '../../services/worldManager';
import { getFlagUrl } from '../../data/static';
import { ChevronLeft } from 'lucide-react';

interface SetupCountryViewProps {
  onSelectCountry: (country: string) => void;
  onBack: () => void;
}

export const SetupCountryView: React.FC<SetupCountryViewProps> = ({ onSelectCountry, onBack }) => {
  const countryLeagues = world.competitions.filter(c => c.type === 'LEAGUE');
  const countriesMap = new Map<string, number>();
  countryLeagues.forEach(l => {
    countriesMap.set(l.country, (countriesMap.get(l.country) || 0) + 1);
  });
  const countries = Array.from(countriesMap.entries()).sort((a, b) => a[0].localeCompare(b[0]));

  return (
    <div className="h-screen w-screen bg-[#d4dcd4] flex items-center justify-center p-4" style={{ fontFamily: 'Verdana, sans-serif' }}>
      <div className="max-w-4xl w-full bg-white/10 rounded-sm p-4 sm:p-10 border border-white/10 shadow-2xl max-h-[90vh] overflow-y-auto">
        <h1 className="text-3xl sm:text-5xl font-black text-white/90 mb-2 tracking-tighter italic uppercase text-center">FM Argentina</h1>
        <p className="text-[10px] text-white/50 font-bold uppercase text-center tracking-[0.3em] mb-6">Seleccioná un país</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {countries.map(([country, count]) => (
            <button key={country} onClick={() => onSelectCountry(country)}
              className="p-4 bg-white/10/5 hover:bg-[#e2eae2] border border-white/10 rounded-sm text-left transition-all shadow-sm flex items-center gap-3">
              <img src={getFlagUrl(country)} alt={country} className="w-8 h-6 rounded-sm object-cover border border-white/10" />
              <div className="flex-1 min-w-0">
                <p className="font-black text-white/90 text-xs uppercase truncate">{country}</p>
                <p className="text-[9px] text-white/50">{count} liga{count !== 1 ? 's' : ''}</p>
              </div>
            </button>
          ))}
        </div>
        <button onClick={onBack} className="mt-4 text-[10px] text-white/50 hover:text-white/90 font-bold flex items-center gap-1">
          <ChevronLeft size={12} /> Volver al tipo de carrera
        </button>
      </div>
    </div>
  );
};

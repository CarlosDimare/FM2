
import React from 'react';

/**
 * FM Industrial Steel Design System
 * Focus: High contrast, technical gray tones, zero white/blue backgrounds.
 */

export const FMSpinner: React.FC<{ size?: 'sm' | 'md' | 'lg'; className?: string }> = ({ size = 'md', className = '' }) => {
    const sizeClass = size === 'sm' ? 'w-5 h-5' : size === 'lg' ? 'w-10 h-10' : 'w-7 h-7';
    return (
        <div className={`${sizeClass} border-2 border-white/10 border-t-[#3a4a3a] rounded-full animate-spin ${className}`} />
    );
};

export const FMProgressBar: React.FC<{ value: number; max?: number; className?: string; height?: 'sm' | 'md' | 'lg' }> = ({ 
    value, 
    max = 100, 
    className = '', 
    height = 'md' 
}) => {
    const percentage = Math.max(0, Math.min(100, (value / max) * 100));
    const heightClass = height === 'sm' ? 'h-2' : height === 'lg' ? 'h-4' : 'h-3';
    return (
        <div className={`w-full bg-white/10/10 border border-white/10 rounded-lg ${heightClass} overflow-hidden ${className}`}>
            <div 
                className="h-full bg-white/10/40 transition-all duration-300 ease-out" 
                style={{ width: `${percentage}%` }} 
            />
        </div>
    );
};

export const FMLoadingOverlay: React.FC<{ 
    message?: string; 
    detail?: string; 
    progress?: { current: number; total: number; detail: string };
    onCancel?: () => void;
    showCancel?: boolean;
}> = ({ 
    message = 'Procesando...', 
    detail, 
    progress, 
    onCancel, 
    showCancel = false 
}) => (
    <div className="fixed inset-0 z-[1000] flex flex-col items-center justify-center bg-white/10/95 backdrop-blur-sm" style={{ fontFamily: 'Verdana, sans-serif' }}>
        <FMSpinner size="lg" />
        <p className="mt-4 text-[#1a1a1a] font-bold text-[12px] uppercase tracking-wider">{message}</p>
        {progress && (
            <div className="mt-4 w-full max-w-md">
                <FMProgressBar value={progress.current} max={progress.total} />
                <p className="mt-2 text-[#64748b] text-[10px] uppercase tracking-wider text-center">{progress.detail}</p>
            </div>
        )}
        {detail && !progress && <p className="mt-2 text-[#64748b] text-[10px] uppercase tracking-wider">{detail}</p>}
        {showCancel && onCancel && (
            <FMButton variant="danger" className="mt-4 w-full max-w-md" onClick={onCancel}>
                Cancelar y Volver
            </FMButton>
        )}
    </div>
);

export const FMBox: React.FC<{ 
    title?: React.ReactNode; 
    children: React.ReactNode; 
    className?: string; 
    noPadding?: boolean;
    headerRight?: React.ReactNode;
}> = ({ title, children, className = "", noPadding = false, headerRight }) => {
    return (
        <div className={`bg-white/10 backdrop-blur-md border border-white/10 rounded-xl shadow-md flex flex-col ${className}`}>
            {title && (
                <div className="border-b border-white/10 px-2 py-1 flex justify-between items-center shrink-0 h-8" 
                     style={{ background: 'linear-gradient(to bottom, #cfd8cf 0%, #a3b4a3 100%)' }}>
                    <span className="text-[#1a1a1a] font-bold text-[11px] tracking-tight uppercase" style={{ fontFamily: 'Verdana, sans-serif' }}>{title}</span>
                    {headerRight && <div>{headerRight}</div>}
                </div>
            )}
            <div className={`flex-1 overflow-hidden ${noPadding ? '' : 'p-2'}`}>
                {children}
            </div>
        </div>
    );
};

export const FMButton: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'danger' | 'vacation' }> = ({ 
    className = "", variant = 'primary', children, ...props 
}) => {
    let baseStyles = "px-3 py-1.5 text-[10px] font-bold tracking-wide rounded-[2px] border shadow-sm active:translate-y-px transition-all flex items-center justify-center gap-2 uppercase";
    let variantStyles = "";
    
    switch(variant) {
        case 'primary': 
            variantStyles = "bg-gradient-to-b from-[#3a4a3a] to-[#1a2a1a] border-[#0a1a0a] text-white hover:brightness-110";
            break;
        case 'secondary':
            variantStyles = "bg-gradient-to-b from-[#f0f4f0] to-[#d0d8d0] border-white/10 text-[#1a1a1a] hover:brightness-95";
            break;
        case 'danger':
            variantStyles = "bg-gradient-to-b from-[#c04040] to-[#802020] border-[#601010] text-white hover:brightness-110";
            break;
        case 'vacation':
            variantStyles = "bg-gradient-to-b from-[#e0a040] to-[#b07020] border-[#805010] text-white hover:brightness-110";
            break;
    }

    return (
        <button className={`${baseStyles} ${variantStyles} ${className} disabled:opacity-50 disabled:cursor-not-allowed`} style={{ fontFamily: 'Verdana, sans-serif' }} {...props}>
            {children}
        </button>
    );
};

export const FMTable: React.FC<{
    headers: string[];
    children: React.ReactNode;
    colWidths?: string[];
    onHeaderClick?: (index: number) => void;
}> = ({ headers, children, colWidths, onHeaderClick }) => {
    return (
        <div className="w-full h-full overflow-x-auto overflow-y-auto bg-white/10/5 custom-scroll">
            <table className="w-full text-left border-collapse min-w-full">
                <thead className="sticky top-0 z-10 text-[10px] font-bold text-[#1a1a1a] shadow-sm border-b border-[#8c9c8c]"
                       style={{ 
                           background: 'linear-gradient(to bottom, #dbe6db 0%, #aabdaa 100%)',
                           fontFamily: 'Verdana, sans-serif'
                       }}>
                    <tr>
                        {headers.map((h, i) => (
                            <th 
                                key={i} 
                                className={`px-2 py-1.5 whitespace-nowrap border-r border-white/15/50 last:border-0 uppercase tracking-tighter ${onHeaderClick ? 'cursor-pointer hover:bg-[#9caea0]/40 select-none' : ''}`} 
                                style={{ width: colWidths?.[i] }}
                                onClick={() => onHeaderClick && onHeaderClick(i)}
                            >
                                {h}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="text-[11px] text-[#1a1a1a]" style={{ fontFamily: 'Verdana, sans-serif' }}>
                    {children}
                </tbody>
            </table>
        </div>
    );
};

export const FMTableCell: React.FC<React.TdHTMLAttributes<HTMLTableCellElement> & { isNumber?: boolean }> = ({ children, className = "", isNumber, ...props }) => (
    <td className={`px-2 py-1 whitespace-nowrap border-b border-white/10 ${isNumber ? 'font-mono' : 'font-normal'} ${className}`} {...props}>
        {children}
    </td>
);

export const FMModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    title: string;
    size?: 'md' | 'lg';
    children: React.ReactNode;
}> = ({ isOpen, onClose, title, size = 'md', children }) => {
    if (!isOpen) return null;
    const maxWidth = size === 'lg' ? 'max-w-2xl' : 'max-w-md';
    return (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose} style={{ fontFamily: 'Verdana, sans-serif' }}>
            <div className={`bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl shadow-2xl w-full ${maxWidth} mx-4 max-h-[85vh] overflow-y-auto`} onClick={e => e.stopPropagation()}>
                <div className="border-b border-white/10 px-3 py-2 flex justify-between items-center" style={{ background: 'linear-gradient(to bottom, #cfd8cf 0%, #a3b4a3 100%)' }}>
                    <span className="text-[#1a1a1a] font-bold text-[12px] tracking-tight uppercase">{title}</span>
                    <button onClick={onClose} className="text-[#4a5a4a] hover:text-[#1a2a1a] transition-colors font-bold text-lg leading-none">&times;</button>
                </div>
                <div className="p-4">
                    {children}
                </div>
            </div>
        </div>
    );
};

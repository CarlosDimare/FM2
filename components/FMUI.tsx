
import React from 'react';

/**
 * FM Industrial Steel Design System
 * Focus: High contrast, technical gray tones, zero white/blue backgrounds.
 */

export const FMSpinner: React.FC<{ size?: 'sm' | 'md' | 'lg'; className?: string }> = ({ size = 'md', className = '' }) => {
    const sizeClass = size === 'sm' ? 'w-5 h-5' : size === 'lg' ? 'w-10 h-10' : 'w-7 h-7';
    return (
        <div className={`${sizeClass} border-2 border-[#a0b0a0] border-t-[#3a4a3a] rounded-full animate-spin ${className}`} />
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
        <div className={`w-full bg-[#e0e8e0] border border-[#a0b0a0] rounded-sm ${heightClass} overflow-hidden ${className}`}>
            <div 
                className="h-full bg-[#3a4a3a] transition-all duration-300 ease-out" 
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
    <div className="fixed inset-0 z-[1000] flex flex-col items-center justify-center bg-white/95 backdrop-blur-sm" style={{ fontFamily: 'Verdana, sans-serif' }}>
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
        <div className={`bg-[#e8ece8] border border-[#a0b0a0] rounded-sm shadow-md flex flex-col min-h-0 ${className}`}>
            {title && (
                <div className="border-b border-[#a0b0a0] px-2 py-1 flex justify-between items-center shrink-0 h-8" 
                     style={{ background: 'linear-gradient(to bottom, #cfd8cf 0%, #a3b4a3 100%)' }}>
                    <span className="text-[#1a1a1a] font-bold text-[11px] tracking-tight uppercase" style={{ fontFamily: 'Verdana, sans-serif' }}>{title}</span>
                    {headerRight && <div>{headerRight}</div>}
                </div>
            )}
            <div className={`flex-1 min-h-0 overflow-hidden ${noPadding ? '' : 'p-2'}`}>
                {children}
            </div>
        </div>
    );
};

export const FMEmptyState: React.FC<{
    icon: React.ReactNode;
    title: string;
    subtitle?: string;
    action?: React.ReactNode;
    className?: string;
}> = ({ icon, title, subtitle, action, className = "" }) => {
    return (
        <div className={`flex flex-col items-center justify-center text-center px-6 py-14 ${className}`}>
            <div className="w-16 h-16 rounded-full bg-[#e0e8e0] border-2 border-[#a0b0a0] shadow-inner flex items-center justify-center text-[#5a6a5a] mb-4">
                {icon}
            </div>
            <h4 className="text-[#1a1a1a] font-black text-[11px] uppercase tracking-widest mb-2" style={{ fontFamily: 'Verdana, sans-serif' }}>{title}</h4>
            {subtitle && <p className="text-[#6a7a6a] text-[10px] font-bold uppercase tracking-wide max-w-xs leading-relaxed" style={{ fontFamily: 'Verdana, sans-serif' }}>{subtitle}</p>}
            {action && <div className="mt-5">{action}</div>}
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
            variantStyles = "bg-gradient-to-b from-[#f0f4f0] to-[#d0d8d0] border-[#a0b0a0] text-[#1a1a1a] hover:brightness-95";
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
        <div className="w-full h-full overflow-x-auto overflow-y-auto bg-white custom-scroll">
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
                                className={`px-2 py-1.5 whitespace-nowrap border-r border-[#9caea0]/50 last:border-0 uppercase tracking-tighter ${onHeaderClick ? 'cursor-pointer hover:bg-[#9caea0]/40 select-none' : ''}`} 
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
    <td className={`px-2 py-1 whitespace-nowrap border-b border-[#e0e0e0] ${isNumber ? 'font-mono' : 'font-normal'} ${className}`} {...props}>
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
            <div className={`bg-[#e8ece8] border-2 border-[#a0b0a0] rounded-sm shadow-2xl w-full ${maxWidth} mx-4 max-h-[85vh] overflow-y-auto`} onClick={e => e.stopPropagation()}>
                <div className="border-b border-[#a0b0a0] px-3 py-2 flex justify-between items-center" style={{ background: 'linear-gradient(to bottom, #cfd8cf 0%, #a3b4a3 100%)' }}>
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

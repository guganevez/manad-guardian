import { MANADFile } from '@/lib/manad-parser';
import { useMemo } from 'react';
import { detectDiscrepancies } from '@/lib/discrepancy-engine';

interface LoadedFile {
  file: MANADFile;
  name: string;
}

interface AuditSidebarProps {
  file: MANADFile;
  fileName: string;
  activeView: string;
  onViewChange: (view: string) => void;
  files?: LoadedFile[];
  activeFileIndex?: number;
  onFileSelect?: (index: number) => void;
  onAddFile?: () => void;
  hasMultipleFiles?: boolean;
}

const NAV_ITEMS = [
  { id: 'summary', label: 'RESUMO', block: '0', count: (f: MANADFile) => 1 },
  { id: 'workers', label: 'TRABALHADORES', block: 'K', count: (f: MANADFile) => f.workers.length },
  { id: 'departments', label: 'DEPARTAMENTOS', block: 'K', count: (f: MANADFile) => f.departments.length },
  { id: 'events', label: 'EVENTOS', block: 'K', count: (f: MANADFile) => f.events.length },
  { id: 'synthetic', label: 'BASES (K250)', block: 'K', count: (f: MANADFile) => f.syntheticData.length },
  { id: 'analytic', label: 'VALORES (K300)', block: 'K', count: (f: MANADFile) => f.analyticData.length },
  { id: 'control', label: 'CONTROLE', block: '9', count: (f: MANADFile) => f.controlRecords.length },
];

function getBlockColor(block: string) {
  switch (block) {
    case '0': return 'bg-manad-block0';
    case 'K': return 'bg-manad-blockK';
    case '9': return 'bg-manad-block9';
    case 'A': return 'bg-destructive';
    default: return 'bg-muted-foreground';
  }
}

export function AuditSidebar({
  file, fileName, activeView, onViewChange,
  files = [], activeFileIndex = 0, onFileSelect, onAddFile, hasMultipleFiles,
}: AuditSidebarProps) {
  const discrepancyCount = useMemo(() => {
    const result = detectDiscrepancies(file);
    return result.total;
  }, [file]);

  return (
    <aside className="w-[280px] h-screen border-r border-border flex flex-col" style={{ backgroundColor: 'hsl(240, 10%, 5%)' }}>
      {/* File selector for multi-file */}
      {files.length > 0 && (
        <div className="p-3 border-b border-border">
          <div className="flex items-center justify-between mb-2">
            <div className="audit-label">ARQUIVOS ({files.length})</div>
            {onAddFile && (
              <button
                onClick={onAddFile}
                className="font-mono text-audit-xs text-primary hover:text-primary/80 transition-colors duration-150"
              >
                [+ ADICIONAR]
              </button>
            )}
          </div>
          <div className="space-y-1 max-h-28 overflow-auto">
            {files.map((f, i) => (
              <button
                key={i}
                onClick={() => onFileSelect?.(i)}
                className={`w-full text-left px-2 py-1 rounded-sm font-mono text-audit-xs transition-colors duration-150 truncate ${
                  i === activeFileIndex
                    ? 'bg-accent text-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                }`}
              >
                {f.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* File header */}
      <div className="p-4 border-b border-border">
        <div className="audit-label mb-1">EMPRESA</div>
        <div className="font-mono text-audit-sm text-foreground truncate">{file.companyName}</div>
        <div className="audit-label mt-3 mb-1">CNPJ</div>
        <div className="font-mono text-audit-sm text-muted-foreground">{file.cnpj}</div>
        <div className="audit-label mt-3 mb-1">PERÍODO</div>
        <div className="font-mono text-audit-sm text-muted-foreground">
          {file.header?.startDate} — {file.header?.endDate}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-2">
        <div className="audit-label px-4 py-2">REGISTROS</div>
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            onClick={() => onViewChange(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-2 text-left transition-colors duration-150 ${
              activeView === item.id
                ? 'bg-accent text-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
            }`}
          >
            <span className={`w-1 h-4 rounded-sm ${getBlockColor(item.block)}`} />
            <span className="font-mono text-audit-sm flex-1">{item.label}</span>
            <span className="font-mono text-audit-xs text-muted-foreground">
              {item.count(file).toLocaleString('pt-BR')}
            </span>
          </button>
        ))}

        {/* Audit section */}
        <div className="audit-label px-4 py-2 mt-2">AUDITORIA</div>
        <button
          onClick={() => onViewChange('validation')}
          className={`w-full flex items-center gap-3 px-4 py-2 text-left transition-colors duration-150 ${
            activeView === 'validation'
              ? 'bg-accent text-foreground'
              : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
          }`}
        >
          <span className="w-1 h-4 rounded-sm bg-primary" />
          <span className="font-mono text-audit-sm flex-1">VALIDAÇÃO FUNC.</span>
        </button>
        <button
          onClick={() => onViewChange('discrepancies')}
          className={`w-full flex items-center gap-3 px-4 py-2 text-left transition-colors duration-150 ${
            activeView === 'discrepancies'
              ? 'bg-accent text-foreground'
              : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
          }`}
        >
          <span className="w-1 h-4 rounded-sm bg-destructive" />
          <span className="font-mono text-audit-sm flex-1">DISCREPÂNCIAS</span>
          {discrepancyCount > 0 && (
            <span className="font-mono text-audit-xs text-destructive font-semibold">
              {discrepancyCount}
            </span>
          )}
        </button>

        {hasMultipleFiles && (
          <button
            onClick={() => onViewChange('comparison')}
            className={`w-full flex items-center gap-3 px-4 py-2 text-left transition-colors duration-150 ${
              activeView === 'comparison'
                ? 'bg-accent text-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
            }`}
          >
            <span className="w-1 h-4 rounded-sm bg-primary" />
            <span className="font-mono text-audit-sm flex-1">COMPARAÇÃO</span>
          </button>
        )}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-border">
        <div className="audit-label mb-1">TOTAL DE LINHAS</div>
        <div className="font-mono text-2xl text-primary">
          {file.totalLines.toLocaleString('pt-BR')}
        </div>
      </div>
    </aside>
  );
}

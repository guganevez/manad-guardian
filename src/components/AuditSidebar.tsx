import { MANADFile } from '@/lib/manad-parser';

interface AuditSidebarProps {
  file: MANADFile;
  fileName: string;
  activeView: string;
  onViewChange: (view: string) => void;
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
    default: return 'bg-muted-foreground';
  }
}

export function AuditSidebar({ file, fileName, activeView, onViewChange }: AuditSidebarProps) {
  return (
    <aside className="w-[280px] h-screen border-r border-border flex flex-col" style={{ backgroundColor: 'hsl(240, 10%, 5%)' }}>
      {/* File header */}
      <div className="p-4 border-b border-border">
        <div className="audit-label mb-1">ARQUIVO</div>
        <div className="font-mono text-audit-sm text-foreground truncate">{fileName}</div>
        <div className="audit-label mt-3 mb-1">EMPRESA</div>
        <div className="font-mono text-audit-sm text-foreground truncate">{file.companyName}</div>
        <div className="audit-label mt-3 mb-1">CNPJ</div>
        <div className="font-mono text-audit-sm text-muted-foreground">{file.cnpj}</div>
        <div className="flex gap-4 mt-3">
          <div>
            <div className="audit-label mb-1">PERÍODO</div>
            <div className="font-mono text-audit-sm text-muted-foreground">
              {file.header?.startDate} — {file.header?.endDate}
            </div>
          </div>
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

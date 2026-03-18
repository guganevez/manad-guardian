import { useState, useMemo } from 'react';
import { RecordK050 } from '@/lib/manad-parser';
import { InspectorPanel } from './InspectorPanel';

interface WorkersViewProps {
  workers: RecordK050[];
}

export function WorkersView({ workers }: WorkersViewProps) {
  const [search, setSearch] = useState('');
  const [selectedRaw, setSelectedRaw] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'terminated'>('all');

  const filtered = useMemo(() => {
    return workers.filter((w) => {
      const matchSearch = !search || 
        w.name.toLowerCase().includes(search.toLowerCase()) ||
        w.cpf.includes(search) ||
        w.employeeCode.includes(search);
      
      const matchStatus = statusFilter === 'all' ||
        (statusFilter === 'active' && !w.terminationDate) ||
        (statusFilter === 'terminated' && !!w.terminationDate);
      
      return matchSearch && matchStatus;
    });
  }, [workers, search, statusFilter]);

  return (
    <div className="flex flex-col h-full">
      {/* Filters */}
      <div className="p-3 border-b border-border flex gap-3 items-center">
        <input
          type="text"
          placeholder="Buscar por nome, CPF ou código..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-surface border border-border rounded-sm px-3 py-1.5 font-mono text-audit-sm text-foreground placeholder:text-muted-foreground flex-1 max-w-sm outline-none focus:border-primary/50 transition-colors duration-150"
        />
        <div className="flex gap-1">
          {(['all', 'active', 'terminated'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`font-mono text-audit-xs px-2 py-1 rounded-sm transition-colors duration-150 ${
                statusFilter === s
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {s === 'all' ? 'TODOS' : s === 'active' ? 'ATIVOS' : 'DESLIGADOS'}
            </button>
          ))}
        </div>
        <span className="font-mono text-audit-xs text-muted-foreground ml-auto">
          {filtered.length.toLocaleString('pt-BR')} registros
        </span>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full">
          <thead className="sticky top-0 bg-background z-10">
            <tr className="border-b border-border">
              <th className="audit-label text-left p-2 w-12">CÓD</th>
              <th className="audit-label text-left p-2">NOME</th>
              <th className="audit-label text-left p-2">CPF</th>
              <th className="audit-label text-left p-2">PIS</th>
              <th className="audit-label text-left p-2">ADMISSÃO</th>
              <th className="audit-label text-left p-2">DESLIGAMENTO</th>
              <th className="audit-label text-left p-2 w-8">CAT</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((w, i) => (
              <tr
                key={i}
                onClick={() => setSelectedRaw(w.rawLine)}
                className="border-b border-border/50 hover:bg-accent/30 cursor-pointer transition-colors duration-150 group"
              >
                <td className="font-mono text-audit-sm p-2 text-muted-foreground">{w.employeeCode}</td>
                <td className="font-mono text-audit-sm p-2 text-foreground">{w.name}</td>
                <td className="font-mono text-audit-sm p-2 text-muted-foreground">{w.cpf}</td>
                <td className="font-mono text-audit-sm p-2 text-muted-foreground">{w.pis}</td>
                <td className="font-mono text-audit-sm p-2 text-muted-foreground">{w.admissionDate}</td>
                <td className="font-mono text-audit-sm p-2">
                  {w.terminationDate ? (
                    <span className="bg-warning/10 text-warning border border-warning/20 px-1.5 py-0.5 text-[10px] font-mono">
                      {w.terminationDate}
                    </span>
                  ) : (
                    <span className="text-primary text-audit-xs">ATIVO</span>
                  )}
                </td>
                <td className="font-mono text-audit-sm p-2 text-muted-foreground">{w.category}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedRaw && (
        <InspectorPanel rawLine={selectedRaw} onClose={() => setSelectedRaw(null)} />
      )}
    </div>
  );
}

import { useState, useMemo } from 'react';
import { MANADFile, getIndFlLabel } from '@/lib/manad-parser';
import { detectDiscrepancies, Discrepancy } from '@/lib/discrepancy-engine';

interface DiscrepancyViewProps {
  file: MANADFile;
}

function SeverityBadge({ severity }: { severity: Discrepancy['severity'] }) {
  const styles = {
    critical: 'bg-destructive/20 text-destructive border-destructive/30',
    warning: 'bg-warning/20 text-warning border-warning/30',
    info: 'bg-primary/20 text-primary border-primary/30',
  };
  const labels = { critical: 'CRÍTICO', warning: 'ALERTA', info: 'INFO' };

  return (
    <span className={`font-mono text-audit-xs px-2 py-0.5 rounded-sm border ${styles[severity]}`}>
      {labels[severity]}
    </span>
  );
}

export function DiscrepancyView({ file }: DiscrepancyViewProps) {
  const [severityFilter, setSeverityFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [periodFilter, setPeriodFilter] = useState('');
  const [indFlFilter, setIndFlFilter] = useState('');

  const summary = useMemo(() => detectDiscrepancies(file), [file]);

  const periods = useMemo(() => {
    const set = new Set<string>();
    summary.discrepancies.forEach(d => set.add(d.period));
    return Array.from(set).sort();
  }, [summary]);

  const indFlValues = useMemo(() => {
    const set = new Set<string>();
    summary.discrepancies.forEach(d => set.add(d.indFl));
    return Array.from(set).sort();
  }, [summary]);

  const filtered = useMemo(() => {
    return summary.discrepancies.filter((d) => {
      if (severityFilter && d.severity !== severityFilter) return false;
      if (typeFilter && d.type !== typeFilter) return false;
      if (deptFilter && d.departmentCode !== deptFilter) return false;
      if (periodFilter && d.period !== periodFilter) return false;
      if (indFlFilter && d.indFl !== indFlFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!d.employeeName.toLowerCase().includes(q) && !d.employeeCode.includes(q)) return false;
      }
      return true;
    });
  }, [summary, severityFilter, typeFilter, deptFilter, periodFilter, indFlFilter, search]);

  return (
    <div className="flex flex-col h-full">
      {/* Summary cards */}
      <div className="p-4 border-b border-border">
        <div className="audit-label mb-3">ANÁLISE DE DISCREPÂNCIAS K250 × K300</div>
        <div className="grid grid-cols-4 gap-3">
          <div className="surface border border-border p-3 rounded-sm">
            <div className="audit-label mb-1">TOTAL</div>
            <div className="font-mono text-2xl text-foreground">{summary.total}</div>
          </div>
          <div className="surface border border-destructive/30 p-3 rounded-sm">
            <div className="audit-label mb-1">CRÍTICOS</div>
            <div className="font-mono text-2xl text-destructive">{summary.critical}</div>
          </div>
          <div className="surface border border-warning/30 p-3 rounded-sm">
            <div className="audit-label mb-1">ALERTAS</div>
            <div className="font-mono text-2xl text-warning">{summary.warnings}</div>
          </div>
          <div className="surface border border-primary/30 p-3 rounded-sm">
            <div className="audit-label mb-1">INFO</div>
            <div className="font-mono text-2xl text-primary">{summary.info}</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="p-3 border-b border-border flex gap-3 items-center flex-wrap">
        <input
          type="text"
          placeholder="Buscar funcionário..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-surface border border-border rounded-sm px-3 py-1.5 font-mono text-audit-sm text-foreground placeholder:text-muted-foreground max-w-xs outline-none focus:border-primary/50 transition-colors duration-150"
        />
        <select
          value={deptFilter}
          onChange={(e) => setDeptFilter(e.target.value)}
          className="bg-surface border border-border rounded-sm px-3 py-1.5 font-mono text-audit-sm text-foreground outline-none focus:border-primary/50 transition-colors duration-150"
        >
          <option value="">TODOS DEPTOS</option>
          {file.departments.map((d) => (
            <option key={d.departmentCode} value={d.departmentCode}>
              {d.departmentCode} - {d.departmentName}
            </option>
          ))}
        </select>
        <select
          value={periodFilter}
          onChange={(e) => setPeriodFilter(e.target.value)}
          className="bg-surface border border-border rounded-sm px-3 py-1.5 font-mono text-audit-sm text-foreground outline-none focus:border-primary/50 transition-colors duration-150"
        >
          <option value="">TODOS PERÍODOS</option>
          {periods.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
        <select
          value={indFlFilter}
          onChange={(e) => setIndFlFilter(e.target.value)}
          className="bg-surface border border-border rounded-sm px-3 py-1.5 font-mono text-audit-sm text-foreground outline-none focus:border-primary/50 transition-colors duration-150"
        >
          <option value="">TODAS FOLHAS</option>
          {indFlValues.map((v) => (
            <option key={v} value={v}>{v} - {getIndFlLabel(v)}</option>
          ))}
        </select>
        <select
          value={severityFilter}
          onChange={(e) => setSeverityFilter(e.target.value)}
          className="bg-surface border border-border rounded-sm px-3 py-1.5 font-mono text-audit-sm text-foreground outline-none focus:border-primary/50 transition-colors duration-150"
        >
          <option value="">TODAS SEVERIDADES</option>
          <option value="critical">CRÍTICO</option>
          <option value="warning">ALERTA</option>
          <option value="info">INFO</option>
        </select>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="bg-surface border border-border rounded-sm px-3 py-1.5 font-mono text-audit-sm text-foreground outline-none focus:border-primary/50 transition-colors duration-150"
        >
          <option value="">TODOS TIPOS</option>
          <option value="missing_k300">K300 AUSENTE</option>
          <option value="missing_k250">K250 AUSENTE</option>
          <option value="sum_mismatch">DIFERENÇA DE SOMA</option>
        </select>
        <span className="font-mono text-audit-xs text-muted-foreground ml-auto">
          {filtered.length} discrepâncias
        </span>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        {filtered.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="font-mono text-lg text-primary mb-2">✓ NENHUMA DISCREPÂNCIA</div>
              <div className="font-mono text-audit-sm text-muted-foreground">
                Os registros K250 e K300 estão consistentes.
              </div>
            </div>
          </div>
        ) : (
          <table className="w-full">
            <thead className="sticky top-0 bg-background z-10">
              <tr className="border-b border-border">
                <th className="audit-label text-left p-2">SEVERIDADE</th>
                <th className="audit-label text-left p-2">FUNCIONÁRIO</th>
                <th className="audit-label text-left p-2">DEPTO</th>
                <th className="audit-label text-left p-2">PERÍODO</th>
                <th className="audit-label text-left p-2">FOLHA</th>
                <th className="audit-label text-left p-2">DESCRIÇÃO</th>
                <th className="audit-label text-right p-2">K250</th>
                <th className="audit-label text-right p-2">K300</th>
                <th className="audit-label text-right p-2">DIFF</th>
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, 500).map((d, i) => (
                <tr
                  key={i}
                  className={`border-b border-border/50 transition-colors duration-150 ${
                    d.severity === 'critical' ? 'bg-destructive/5 hover:bg-destructive/10' :
                    d.severity === 'warning' ? 'bg-warning/5 hover:bg-warning/10' :
                    'hover:bg-accent/30'
                  }`}
                >
                  <td className="p-2"><SeverityBadge severity={d.severity} /></td>
                  <td className="font-mono text-audit-sm p-2 text-foreground">
                    <div>{d.employeeName}</div>
                    <div className="text-muted-foreground text-audit-xs">{d.employeeCode}</div>
                  </td>
                  <td className="font-mono text-audit-sm p-2 text-muted-foreground">{d.departmentCode}</td>
                  <td className="font-mono text-audit-sm p-2 text-muted-foreground">{d.period}</td>
                  <td className="font-mono text-audit-xs p-2 text-muted-foreground" title={getIndFlLabel(d.indFl)}>
                    {d.indFl} - {getIndFlLabel(d.indFl)}
                  </td>
                  <td className="font-mono text-audit-xs p-2 text-foreground max-w-[300px]">{d.description}</td>
                  <td className="font-mono text-audit-sm p-2 text-right text-foreground">
                    {d.k250Value ? `R$ ${d.k250Value}` : '—'}
                  </td>
                  <td className="font-mono text-audit-sm p-2 text-right text-foreground">
                    {d.k300Sum ? `R$ ${d.k300Sum}` : '—'}
                  </td>
                  <td className="font-mono text-audit-sm p-2 text-right text-destructive font-semibold">
                    {d.difference ? `R$ ${d.difference}` : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
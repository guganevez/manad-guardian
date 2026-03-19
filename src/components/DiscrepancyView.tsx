import { useState, useMemo } from 'react';
import { MANADFile, getIndFlLabel } from '@/lib/manad-parser';
import { detectDiscrepancies, Discrepancy } from '@/lib/discrepancy-engine';

interface DiscrepancyViewProps {
  file: MANADFile;
}

const TYPE_LABELS: Record<Discrepancy['type'], string> = {
  missing_k300_irrf: 'K300 AUSENTE · IRRF',
  missing_k300_ps: 'K300 AUSENTE · PS',
  missing_k250_irrf: 'K250 AUSENTE · IRRF',
  missing_k250_ps: 'K250 AUSENTE · PS',
  sum_mismatch_irrf: 'DIFERENÇA DE SOMA · IRRF',
  sum_mismatch_ps: 'DIFERENÇA DE SOMA · PS',
};

function SeverityBadge({ severity }: { severity: Discrepancy['severity'] }) {
  const styles = {
    critical: 'border-destructive/30 bg-destructive/20 text-destructive',
    warning: 'border-warning/30 bg-warning/20 text-warning',
    info: 'border-primary/30 bg-primary/20 text-primary',
  };
  const labels = { critical: 'CRÍTICO', warning: 'ALERTA', info: 'INFO' };

  return <span className={`rounded-sm border px-2 py-0.5 font-mono text-audit-xs ${styles[severity]}`}>{labels[severity]}</span>;
}

export function DiscrepancyView({ file }: DiscrepancyViewProps) {
  const [severityFilter, setSeverityFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [periodFilter, setPeriodFilter] = useState('');
  const [indFlFilter, setIndFlFilter] = useState('');
  const [baseFilter, setBaseFilter] = useState('');

  const summary = useMemo(() => detectDiscrepancies(file), [file]);

  const periods = useMemo(() => {
    const values = new Set<string>();
    summary.discrepancies.forEach((discrepancy) => values.add(discrepancy.period));
    return Array.from(values).sort();
  }, [summary]);

  const indFlValues = useMemo(() => {
    const values = new Set<string>();
    summary.discrepancies.forEach((discrepancy) => values.add(discrepancy.indFl));
    return Array.from(values).sort();
  }, [summary]);

  const filtered = useMemo(() => {
    return summary.discrepancies.filter((discrepancy) => {
      if (severityFilter && discrepancy.severity !== severityFilter) return false;
      if (typeFilter && discrepancy.type !== typeFilter) return false;
      if (deptFilter && discrepancy.departmentCode !== deptFilter) return false;
      if (periodFilter && discrepancy.period !== periodFilter) return false;
      if (indFlFilter && discrepancy.indFl !== indFlFilter) return false;
      if (baseFilter && discrepancy.baseType !== baseFilter) return false;

      if (search) {
        const query = search.toLowerCase();
        if (!discrepancy.employeeName.toLowerCase().includes(query) && !discrepancy.employeeCode.toLowerCase().includes(query)) {
          return false;
        }
      }

      return true;
    });
  }, [summary, severityFilter, typeFilter, deptFilter, periodFilter, indFlFilter, baseFilter, search]);

  const baseSummary = useMemo(() => {
    const createMetrics = () => ({ total: 0, critical: 0, warning: 0, info: 0 });
    const metrics = {
      IRRF: createMetrics(),
      PS: createMetrics(),
    } satisfies Record<Discrepancy['baseType'], { total: number; critical: number; warning: number; info: number }>;

    filtered.forEach((discrepancy) => {
      const bucket = metrics[discrepancy.baseType];
      bucket.total += 1;
      if (discrepancy.severity === 'critical') bucket.critical += 1;
      if (discrepancy.severity === 'warning') bucket.warning += 1;
      if (discrepancy.severity === 'info') bucket.info += 1;
    });

    return metrics;
  }, [filtered]);

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border p-4">
        <div className="audit-label mb-3">ANÁLISE DE DISCREPÂNCIAS K250 × K300</div>
        <div className="grid gap-3 xl:grid-cols-[1.1fr_1fr_1fr]">
          <div className="grid grid-cols-2 gap-3">
            <div className="surface rounded-sm border border-border p-3">
              <div className="audit-label mb-1">TOTAL GERAL</div>
              <div className="font-mono text-2xl text-foreground">{filtered.length}</div>
            </div>
            <div className="surface rounded-sm border border-destructive/30 p-3">
              <div className="audit-label mb-1">CRÍTICOS</div>
              <div className="font-mono text-2xl text-destructive">
                {filtered.filter((discrepancy) => discrepancy.severity === 'critical').length}
              </div>
            </div>
            <div className="surface rounded-sm border border-warning/30 p-3">
              <div className="audit-label mb-1">ALERTAS</div>
              <div className="font-mono text-2xl text-warning">
                {filtered.filter((discrepancy) => discrepancy.severity === 'warning').length}
              </div>
            </div>
            <div className="surface rounded-sm border border-primary/30 p-3">
              <div className="audit-label mb-1">INFO</div>
              <div className="font-mono text-2xl text-primary">
                {filtered.filter((discrepancy) => discrepancy.severity === 'info').length}
              </div>
            </div>
          </div>

          <div className="surface rounded-sm border border-border p-3">
            <div className="audit-label mb-2">BASE IRRF</div>
            <div className="grid grid-cols-2 gap-2 font-mono text-audit-sm">
              <div className="text-foreground">Total: {baseSummary.IRRF.total}</div>
              <div className="text-destructive">Críticos: {baseSummary.IRRF.critical}</div>
              <div className="text-warning">Alertas: {baseSummary.IRRF.warning}</div>
              <div className="text-primary">Info: {baseSummary.IRRF.info}</div>
            </div>
          </div>

          <div className="surface rounded-sm border border-border p-3">
            <div className="audit-label mb-2">BASE PS</div>
            <div className="grid grid-cols-2 gap-2 font-mono text-audit-sm">
              <div className="text-foreground">Total: {baseSummary.PS.total}</div>
              <div className="text-destructive">Críticos: {baseSummary.PS.critical}</div>
              <div className="text-warning">Alertas: {baseSummary.PS.warning}</div>
              <div className="text-primary">Info: {baseSummary.PS.info}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 border-b border-border p-3">
        <input
          type="text"
          placeholder="Buscar funcionário..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="max-w-xs rounded-sm border border-border bg-surface px-3 py-1.5 font-mono text-audit-sm text-foreground outline-none transition-colors duration-150 placeholder:text-muted-foreground focus:border-primary/50"
        />
        <select
          value={deptFilter}
          onChange={(event) => setDeptFilter(event.target.value)}
          className="rounded-sm border border-border bg-surface px-3 py-1.5 font-mono text-audit-sm text-foreground outline-none transition-colors duration-150 focus:border-primary/50"
        >
          <option value="">TODOS DEPTOS</option>
          {file.departments.map((department) => (
            <option key={department.departmentCode} value={department.departmentCode}>
              {department.departmentCode} - {department.departmentName}
            </option>
          ))}
        </select>
        <select
          value={periodFilter}
          onChange={(event) => setPeriodFilter(event.target.value)}
          className="rounded-sm border border-border bg-surface px-3 py-1.5 font-mono text-audit-sm text-foreground outline-none transition-colors duration-150 focus:border-primary/50"
        >
          <option value="">TODOS PERÍODOS</option>
          {periods.map((period) => (
            <option key={period} value={period}>
              {period}
            </option>
          ))}
        </select>
        <select
          value={indFlFilter}
          onChange={(event) => setIndFlFilter(event.target.value)}
          className="rounded-sm border border-border bg-surface px-3 py-1.5 font-mono text-audit-sm text-foreground outline-none transition-colors duration-150 focus:border-primary/50"
        >
          <option value="">TODAS FOLHAS</option>
          {indFlValues.map((value) => (
            <option key={value} value={value}>
              {value} - {getIndFlLabel(value)}
            </option>
          ))}
        </select>
        <select
          value={baseFilter}
          onChange={(event) => setBaseFilter(event.target.value)}
          className="rounded-sm border border-border bg-surface px-3 py-1.5 font-mono text-audit-sm text-foreground outline-none transition-colors duration-150 focus:border-primary/50"
        >
          <option value="">TODAS BASES</option>
          <option value="IRRF">BASE IRRF</option>
          <option value="PS">BASE PS</option>
        </select>
        <select
          value={severityFilter}
          onChange={(event) => setSeverityFilter(event.target.value)}
          className="rounded-sm border border-border bg-surface px-3 py-1.5 font-mono text-audit-sm text-foreground outline-none transition-colors duration-150 focus:border-primary/50"
        >
          <option value="">TODAS SEVERIDADES</option>
          <option value="critical">CRÍTICO</option>
          <option value="warning">ALERTA</option>
          <option value="info">INFO</option>
        </select>
        <select
          value={typeFilter}
          onChange={(event) => setTypeFilter(event.target.value)}
          className="rounded-sm border border-border bg-surface px-3 py-1.5 font-mono text-audit-sm text-foreground outline-none transition-colors duration-150 focus:border-primary/50"
        >
          <option value="">TODOS TIPOS</option>
          {Object.entries(TYPE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <span className="ml-auto font-mono text-audit-xs text-muted-foreground">{filtered.length} discrepâncias</span>
      </div>

      <div className="flex-1 overflow-auto">
        {filtered.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <div className="mb-2 font-mono text-lg text-primary">✓ NENHUMA DISCREPÂNCIA</div>
              <div className="font-mono text-audit-sm text-muted-foreground">
                As bases IRRF e PS dos registros K250 e K300 estão consistentes.
              </div>
            </div>
          </div>
        ) : (
          <table className="w-full">
            <thead className="sticky top-0 z-10 bg-background">
              <tr className="border-b border-border">
                <th className="audit-label p-2 text-left">SEVERIDADE</th>
                <th className="audit-label p-2 text-left">BASE</th>
                <th className="audit-label p-2 text-left">TIPO</th>
                <th className="audit-label p-2 text-left">FUNCIONÁRIO</th>
                <th className="audit-label p-2 text-left">DEPTO</th>
                <th className="audit-label p-2 text-left">PERÍODO</th>
                <th className="audit-label p-2 text-left">FOLHA</th>
                <th className="audit-label p-2 text-left">DESCRIÇÃO</th>
                <th className="audit-label p-2 text-right">K250</th>
                <th className="audit-label p-2 text-right">K300</th>
                <th className="audit-label p-2 text-right">DIFF</th>
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, 500).map((discrepancy, index) => (
                <tr
                  key={`${discrepancy.type}-${discrepancy.employeeCode}-${index}`}
                  className={`border-b border-border/50 transition-colors duration-150 ${
                    discrepancy.severity === 'critical'
                      ? 'bg-destructive/5 hover:bg-destructive/10'
                      : discrepancy.severity === 'warning'
                        ? 'bg-warning/5 hover:bg-warning/10'
                        : 'hover:bg-accent/30'
                  }`}
                >
                  <td className="p-2"><SeverityBadge severity={discrepancy.severity} /></td>
                  <td className="p-2 font-mono text-audit-xs text-foreground">{discrepancy.baseType}</td>
                  <td className="p-2 font-mono text-audit-xs text-muted-foreground">{TYPE_LABELS[discrepancy.type]}</td>
                  <td className="p-2 font-mono text-audit-sm text-foreground">
                    <div>{discrepancy.employeeName}</div>
                    <div className="text-audit-xs text-muted-foreground">{discrepancy.employeeCode}</div>
                  </td>
                  <td className="p-2 font-mono text-audit-sm text-muted-foreground">{discrepancy.departmentCode}</td>
                  <td className="p-2 font-mono text-audit-sm text-muted-foreground">{discrepancy.period}</td>
                  <td className="p-2 font-mono text-audit-xs text-muted-foreground" title={getIndFlLabel(discrepancy.indFl)}>
                    {discrepancy.indFl} - {getIndFlLabel(discrepancy.indFl)}
                  </td>
                  <td className="max-w-[320px] p-2 font-mono text-audit-xs text-foreground">{discrepancy.description}</td>
                  <td className="p-2 text-right font-mono text-audit-sm text-foreground">
                    {discrepancy.k250Value ? `R$ ${discrepancy.k250Value}` : '—'}
                  </td>
                  <td className="p-2 text-right font-mono text-audit-sm text-foreground">
                    {discrepancy.k300Sum ? `R$ ${discrepancy.k300Sum}` : '—'}
                  </td>
                  <td className="p-2 text-right font-mono text-audit-sm font-semibold text-destructive">
                    {discrepancy.difference ? `R$ ${discrepancy.difference}` : '—'}
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

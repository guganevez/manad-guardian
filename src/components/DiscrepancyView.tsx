import { useState, useMemo, useCallback } from 'react';
import {
  MANADFile,
  RecordK300,
  getIndFlLabel,
  IND_RUBR_LABELS,
  IND_BASE_IRRF_LABELS,
  IND_BASE_PS_LABELS,
} from '@/lib/manad-parser';
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

function parseValue(value: string): number {
  if (!value) return 0;
  return parseFloat(value.replace(',', '.')) || 0;
}

function getRubrMultiplier(indRubr: string): number {
  if (indRubr === 'P') return 1;
  if (indRubr === 'D') return -1;
  return 0;
}

function getSignedValue(record: RecordK300): number {
  return parseValue(record.value) * getRubrMultiplier(record.indRubr);
}

function hasBaseIndicator(record: RecordK300, baseType: 'IRRF' | 'PS'): boolean {
  if (baseType === 'IRRF') return Boolean(record.indBaseIRRF) && record.indBaseIRRF !== '3';
  return Boolean(record.indBasePS) && record.indBasePS !== '8';
}

interface ExpandedK300RowProps {
  records: RecordK300[];
  baseType: 'IRRF' | 'PS';
  eventMap: Map<string, string>;
  colSpan: number;
}

function ExpandedK300Row({ records, baseType, eventMap, colSpan }: ExpandedK300RowProps) {
  const filtered = records.filter((r) => hasBaseIndicator(r, baseType));

  const total = filtered.reduce((sum, r) => sum + getSignedValue(r), 0);

  if (filtered.length === 0) {
    return (
      <tr className="bg-accent/10">
        <td colSpan={colSpan} className="px-6 py-3 font-mono text-audit-xs text-muted-foreground">
          Nenhum item K300 com base {baseType} encontrado para este funcionário/período/folha.
        </td>
      </tr>
    );
  }

  return (
    <>
      <tr className="bg-accent/10">
        <td colSpan={colSpan} className="px-4 py-0">
          <div className="py-2">
            <div className="mb-2 flex items-center gap-4">
              <span className="font-mono text-audit-xs text-muted-foreground">
                ITENS K300 · BASE {baseType} · {filtered.length} registros
              </span>
              <span className={`font-mono text-audit-sm font-semibold ${total >= 0 ? 'text-primary' : 'text-destructive'}`}>
                SOMA: R$ {total.toFixed(2)}
              </span>
            </div>
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="px-2 py-1 text-left font-mono text-[9px] uppercase text-muted-foreground">EVENTO</th>
                  <th className="px-2 py-1 text-left font-mono text-[9px] uppercase text-muted-foreground">DESCRIÇÃO</th>
                  <th className="px-2 py-1 text-right font-mono text-[9px] uppercase text-muted-foreground">VALOR</th>
                  <th className="px-2 py-1 text-right font-mono text-[9px] uppercase text-muted-foreground">C/ SINAL</th>
                  <th className="px-2 py-1 text-left font-mono text-[9px] uppercase text-muted-foreground">RUBRICA</th>
                  <th className="px-2 py-1 text-left font-mono text-[9px] uppercase text-muted-foreground">BASE IRRF</th>
                  <th className="px-2 py-1 text-left font-mono text-[9px] uppercase text-muted-foreground">BASE PS</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((record, idx) => {
                  const signed = getSignedValue(record);
                  return (
                    <tr key={`${record.eventCode}-${idx}`} className="border-b border-border/30">
                      <td className="px-2 py-1 font-mono text-audit-xs text-foreground">{record.eventCode}</td>
                      <td className="max-w-[220px] truncate px-2 py-1 font-mono text-audit-xs text-muted-foreground">
                        {eventMap.get(record.eventCode) || '—'}
                      </td>
                      <td className="px-2 py-1 text-right font-mono text-audit-xs text-foreground">R$ {record.value}</td>
                      <td className={`px-2 py-1 text-right font-mono text-audit-xs ${signed >= 0 ? 'text-primary' : 'text-destructive'}`}>
                        R$ {signed.toFixed(2)}
                      </td>
                      <td className="px-2 py-1 font-mono text-audit-xs">
                        <span className={record.indRubr === 'P' ? 'text-primary' : record.indRubr === 'D' ? 'text-destructive' : 'text-muted-foreground'}>
                          {record.indRubr} - {IND_RUBR_LABELS[record.indRubr] || record.indRubr}
                        </span>
                      </td>
                      <td className="px-2 py-1 font-mono text-audit-xs text-muted-foreground" title={IND_BASE_IRRF_LABELS[record.indBaseIRRF]}>
                        {record.indBaseIRRF || '—'}
                      </td>
                      <td className="px-2 py-1 font-mono text-audit-xs text-muted-foreground" title={IND_BASE_PS_LABELS[record.indBasePS]}>
                        {record.indBasePS || '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </td>
      </tr>
    </>
  );
}

export function DiscrepancyView({ file }: DiscrepancyViewProps) {
  const [severityFilter, setSeverityFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [periodFilter, setPeriodFilter] = useState('');
  const [indFlFilter, setIndFlFilter] = useState('');
  const [baseFilter, setBaseFilter] = useState('');
  const [expandedKey, setExpandedKey] = useState<string | null>(null);

  const summary = useMemo(() => detectDiscrepancies(file), [file]);

  const eventMap = useMemo(() => {
    const map = new Map<string, string>();
    file.events.forEach((e) => map.set(e.eventCode, e.eventName));
    return map;
  }, [file.events]);

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

  // Pre-index K300 records by the same key used in discrepancy engine
  const k300Index = useMemo(() => {
    const map = new Map<string, RecordK300[]>();
    for (const record of file.analyticData) {
      const key = `${record.employeeCode}|${record.departmentCode}|${record.period}|${record.indFl}`;
      const list = map.get(key) || [];
      list.push(record);
      map.set(key, list);
    }
    return map;
  }, [file.analyticData]);

  const makeRowKey = useCallback((d: Discrepancy, index: number) =>
    `${d.type}-${d.employeeCode}-${d.departmentCode}-${d.period}-${d.indFl}-${index}`, []);

  const getLinkedK300 = useCallback((d: Discrepancy) => {
    const key = `${d.employeeCode}|${d.departmentCode}|${d.period}|${d.indFl}`;
    return k300Index.get(key) || [];
  }, [k300Index]);

  const toggleExpanded = useCallback((key: string) => {
    setExpandedKey((prev) => (prev === key ? null : key));
  }, []);

  const COL_SPAN = 14;

  // Group filtered discrepancies by employee for summary rows
  const groupedByEmployee = useMemo(() => {
    const groups: { employeeCode: string; employeeName: string; items: { discrepancy: Discrepancy; globalIndex: number }[]; totals: { k250IRRF: number; k300IRRF: number; difIRRF: number; k250PS: number; k300PS: number; difPS: number } }[] = [];
    const map = new Map<string, typeof groups[number]>();

    filtered.forEach((d, idx) => {
      let group = map.get(d.employeeCode);
      if (!group) {
        group = {
          employeeCode: d.employeeCode,
          employeeName: d.employeeName,
          items: [],
          totals: { k250IRRF: 0, k300IRRF: 0, difIRRF: 0, k250PS: 0, k300PS: 0, difPS: 0 },
        };
        map.set(d.employeeCode, group);
        groups.push(group);
      }
      group.items.push({ discrepancy: d, globalIndex: idx });

      const k250 = parseValue(d.k250Value || '');
      const k300 = parseValue(d.k300Sum || '');
      const dif = parseValue(d.difference || '');

      if (d.baseType === 'IRRF') {
        group.totals.k250IRRF += k250;
        group.totals.k300IRRF += k300;
        group.totals.difIRRF += dif;
      } else {
        group.totals.k250PS += k250;
        group.totals.k300PS += k300;
        group.totals.difPS += dif;
      }
    });

    return groups;
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
                <th className="audit-label w-6 p-2 text-left" rowSpan={2}></th>
                <th className="audit-label p-2 text-left" rowSpan={2}>SEVERIDADE</th>
                <th className="audit-label p-2 text-left" rowSpan={2}>BASE</th>
                <th className="audit-label p-2 text-left" rowSpan={2}>TIPO</th>
                <th className="audit-label p-2 text-left" rowSpan={2}>FUNCIONÁRIO</th>
                <th className="audit-label p-2 text-left" rowSpan={2}>DEPTO</th>
                <th className="audit-label p-2 text-left" rowSpan={2}>PERÍODO</th>
                <th className="audit-label p-2 text-left" rowSpan={2}>FOLHA</th>
                <th className="audit-label p-2 text-center" colSpan={3}>BASE IRRF</th>
                <th className="audit-label p-2 text-center" colSpan={3}>BASE PS</th>
              </tr>
              <tr className="border-b border-border">
                <th className="audit-label p-2 text-right">K250</th>
                <th className="audit-label p-2 text-right">K300</th>
                <th className="audit-label p-2 text-right">DIF</th>
                <th className="audit-label p-2 text-right">K250</th>
                <th className="audit-label p-2 text-right">K300</th>
                <th className="audit-label p-2 text-right">DIF</th>
              </tr>
            </thead>
            <tbody>
              {groupedByEmployee.map((group) => (
                <>
                  {group.items.map(({ discrepancy, globalIndex }) => {
                    const rowKey = makeRowKey(discrepancy, globalIndex);
                    const isExpanded = expandedKey === rowKey;
                    const isIRRF = discrepancy.baseType === 'IRRF';

                    return (
                      <>
                        <tr
                          key={rowKey}
                          onClick={() => toggleExpanded(rowKey)}
                          className={`cursor-pointer border-b border-border/50 transition-colors duration-150 ${
                            isExpanded
                              ? 'bg-accent/30'
                              : discrepancy.severity === 'critical'
                                ? 'bg-destructive/5 hover:bg-destructive/10'
                                : discrepancy.severity === 'warning'
                                  ? 'bg-warning/5 hover:bg-warning/10'
                                  : 'hover:bg-accent/30'
                          }`}
                        >
                          <td className="p-2 font-mono text-audit-xs text-muted-foreground">
                            {isExpanded ? '▼' : '▶'}
                          </td>
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
                          <td className="p-2 text-right font-mono text-audit-sm text-foreground">
                            {isIRRF && discrepancy.k250Value ? `R$ ${discrepancy.k250Value}` : '—'}
                          </td>
                          <td className="p-2 text-right font-mono text-audit-sm text-foreground">
                            {isIRRF && discrepancy.k300Sum ? `R$ ${discrepancy.k300Sum}` : '—'}
                          </td>
                          <td className={`p-2 text-right font-mono text-audit-sm font-semibold ${isIRRF && discrepancy.difference ? 'text-destructive' : 'text-muted-foreground'}`}>
                            {isIRRF && discrepancy.difference ? `R$ ${discrepancy.difference}` : '—'}
                          </td>
                          <td className="p-2 text-right font-mono text-audit-sm text-primary">
                            {!isIRRF && discrepancy.k250Value ? `R$ ${discrepancy.k250Value}` : '—'}
                          </td>
                          <td className="p-2 text-right font-mono text-audit-sm text-primary">
                            {!isIRRF && discrepancy.k300Sum ? `R$ ${discrepancy.k300Sum}` : '—'}
                          </td>
                          <td className={`p-2 text-right font-mono text-audit-sm font-semibold ${!isIRRF && discrepancy.difference ? 'text-destructive' : 'text-muted-foreground'}`}>
                            {!isIRRF && discrepancy.difference ? `R$ ${discrepancy.difference}` : '—'}
                          </td>
                        </tr>
                        {isExpanded && (
                          <ExpandedK300Row
                            key={`${rowKey}-detail`}
                            records={getLinkedK300(discrepancy)}
                            baseType={discrepancy.baseType}
                            eventMap={eventMap}
                            colSpan={COL_SPAN}
                          />
                        )}
                      </>
                    );
                  })}
                  {/* Summary row per employee */}
                  <tr key={`summary-${group.employeeCode}`} className="border-b-2 border-border bg-accent/20">
                    <td className="p-2" />
                    <td colSpan={3} className="p-2 font-mono text-audit-xs font-bold uppercase text-muted-foreground">
                      RESUMO
                    </td>
                    <td className="p-2 font-mono text-audit-sm font-bold text-foreground">
                      <div>{group.employeeName}</div>
                      <div className="text-audit-xs text-muted-foreground">{group.employeeCode} · {group.items.length} discrepância(s)</div>
                    </td>
                    <td colSpan={3} className="p-2" />
                    <td className="p-2 text-right font-mono text-audit-sm font-bold text-foreground">
                      {group.totals.k250IRRF ? `R$ ${group.totals.k250IRRF.toFixed(2)}` : '—'}
                    </td>
                    <td className="p-2 text-right font-mono text-audit-sm font-bold text-foreground">
                      {group.totals.k300IRRF ? `R$ ${group.totals.k300IRRF.toFixed(2)}` : '—'}
                    </td>
                    <td className={`p-2 text-right font-mono text-audit-sm font-bold ${group.totals.difIRRF ? 'text-destructive' : 'text-muted-foreground'}`}>
                      {group.totals.difIRRF ? `R$ ${group.totals.difIRRF.toFixed(2)}` : '—'}
                    </td>
                    <td className="p-2 text-right font-mono text-audit-sm font-bold text-primary">
                      {group.totals.k250PS ? `R$ ${group.totals.k250PS.toFixed(2)}` : '—'}
                    </td>
                    <td className="p-2 text-right font-mono text-audit-sm font-bold text-primary">
                      {group.totals.k300PS ? `R$ ${group.totals.k300PS.toFixed(2)}` : '—'}
                    </td>
                    <td className={`p-2 text-right font-mono text-audit-sm font-bold ${group.totals.difPS ? 'text-destructive' : 'text-muted-foreground'}`}>
                      {group.totals.difPS ? `R$ ${group.totals.difPS.toFixed(2)}` : '—'}
                    </td>
                  </tr>
                </>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

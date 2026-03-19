import { useState, useMemo } from 'react';
import {
  MANADFile,
  RecordK250,
  getIndFlLabel,
  IND_RUBR_LABELS,
  IND_BASE_IRRF_LABELS,
  IND_BASE_PS_LABELS,
} from '@/lib/manad-parser';
import { InspectorPanel } from './InspectorPanel';
import { MultiSelectFilter } from './MultiSelectFilter';

interface EmployeeValidationViewProps {
  file: MANADFile;
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

export function EmployeeValidationView({ file }: EmployeeValidationViewProps) {
  const [employeeFilter, setEmployeeFilter] = useState('');
  const [periodFilter, setPeriodFilter] = useState<Set<string>>(new Set());
  const [deptFilter, setDeptFilter] = useState<Set<string>>(new Set());
  const [indFlFilter, setIndFlFilter] = useState('');
  const [selectedK250, setSelectedK250] = useState<RecordK250 | null>(null);
  const [selectedRaw, setSelectedRaw] = useState<string | null>(null);
  const [baseIRRFFilter, setBaseIRRFFilter] = useState<Set<string>>(new Set());
  const [basePSFilter, setBasePSFilter] = useState<Set<string>>(new Set());
  const [rubrFilter, setRubrFilter] = useState('');

  const workerMap = useMemo(() => {
    const map = new Map<string, string>();
    file.workers.forEach((w) => map.set(w.employeeCode, w.name));
    return map;
  }, [file.workers]);

  const deptMap = useMemo(() => {
    const map = new Map<string, string>();
    file.departments.forEach((d) => map.set(d.departmentCode, d.departmentName));
    return map;
  }, [file.departments]);

  const eventMap = useMemo(() => {
    const map = new Map<string, string>();
    file.events.forEach((e) => map.set(e.eventCode, e.eventName));
    return map;
  }, [file.events]);

  // Build employee options from workers who have K250 records
  const employeeOptions = useMemo(() => {
    const codes = new Set<string>();
    file.syntheticData.forEach((r) => codes.add(r.employeeCode));
    return Array.from(codes)
      .map((code) => ({ code, name: workerMap.get(code) || code }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [file.syntheticData, workerMap]);

  const periodOptions = useMemo(() => {
    const values = new Set<string>();
    file.syntheticData.forEach((r) => values.add(r.period));
    return Array.from(values).sort().map((v) => ({ value: v, label: v }));
  }, [file.syntheticData]);

  const deptOptions = useMemo(() => {
    const values = new Set<string>();
    file.syntheticData.forEach((r) => values.add(r.departmentCode));
    return Array.from(values).sort().map((v) => ({
      value: v,
      label: `${v} - ${deptMap.get(v) || v}`,
    }));
  }, [file.syntheticData, deptMap]);

  const indFlValues = useMemo(() => {
    const values = new Set<string>();
    file.syntheticData.forEach((r) => values.add(r.indFl));
    return Array.from(values).sort();
  }, [file.syntheticData]);

  // K250 records for the selected employee
  const k250Records = useMemo(() => {
    if (!employeeFilter) return [];
    return file.syntheticData.filter((r) => {
      if (r.employeeCode !== employeeFilter) return false;
      if (periodFilter.size > 0 && !periodFilter.has(r.period)) return false;
      if (deptFilter.size > 0 && !deptFilter.has(r.departmentCode)) return false;
      if (indFlFilter && r.indFl !== indFlFilter) return false;
      return true;
    });
  }, [file.syntheticData, employeeFilter, periodFilter, deptFilter, indFlFilter]);

  // K300 items linked to selected K250
  const linkedK300 = useMemo(() => {
    if (!selectedK250) return [];
    return file.analyticData.filter(
      (r) =>
        r.employeeCode === selectedK250.employeeCode &&
        r.departmentCode === selectedK250.departmentCode &&
        r.period === selectedK250.period &&
        r.indFl === selectedK250.indFl,
    ).sort((a, b) => a.eventCode.localeCompare(b.eventCode));
  }, [selectedK250, file.analyticData]);

  // K300 filter options from linked records
  const k300BaseIRRFOptions = useMemo(() => {
    const vals = new Set<string>();
    linkedK300.forEach((r) => { if (r.indBaseIRRF) vals.add(r.indBaseIRRF); });
    return Array.from(vals).sort().map((v) => ({ value: v, label: `${v} - ${IND_BASE_IRRF_LABELS[v] || v}` }));
  }, [linkedK300]);

  const k300BasePSOptions = useMemo(() => {
    const vals = new Set<string>();
    linkedK300.forEach((r) => { if (r.indBasePS) vals.add(r.indBasePS); });
    return Array.from(vals).sort().map((v) => ({ value: v, label: `${v} - ${IND_BASE_PS_LABELS[v] || v}` }));
  }, [linkedK300]);

  const filteredK300 = useMemo(() => {
    return linkedK300.filter((r) => {
      if (baseIRRFFilter.size > 0 && !baseIRRFFilter.has(r.indBaseIRRF)) return false;
      if (basePSFilter.size > 0 && !basePSFilter.has(r.indBasePS)) return false;
      if (rubrFilter && r.indRubr !== rubrFilter) return false;
      return true;
    });
  }, [linkedK300, baseIRRFFilter, basePSFilter, rubrFilter]);

  // Totals for K300
  const k300Totals = useMemo(() => {
    const result = { totalSigned: 0, irrfTotal: 0, psTotal: 0, irrfCount: 0, psCount: 0 };
    filteredK300.forEach((r) => {
      const signed = parseValue(r.value) * getRubrMultiplier(r.indRubr);
      result.totalSigned += signed;
      if (r.indBaseIRRF && r.indBaseIRRF !== '3') { result.irrfTotal += signed; result.irrfCount++; }
      if (r.indBasePS && r.indBasePS !== '8') { result.psTotal += signed; result.psCount++; }
    });
    return result;
  }, [filteredK300]);

  // K250 totals for comparison
  const k250Totals = useMemo(() => {
    let irrf = 0, ps = 0;
    k250Records.forEach((r) => {
      irrf += parseValue(r.vlBaseIRRF);
      ps += parseValue(r.vlBasePS);
    });
    return { irrf, ps };
  }, [k250Records]);

  const selectedWorkerName = workerMap.get(employeeFilter) || '';

  return (
    <div className="flex h-full flex-col">
      {/* Header filters */}
      <div className="flex flex-wrap items-center gap-3 border-b border-border p-3">
        <select
          value={employeeFilter}
          onChange={(e) => { setEmployeeFilter(e.target.value); setSelectedK250(null); }}
          className="max-w-sm rounded-sm border border-border bg-surface px-3 py-1.5 font-mono text-audit-sm text-foreground outline-none transition-colors duration-150 focus:border-primary/50"
        >
          <option value="">SELECIONE FUNCIONÁRIO</option>
          {employeeOptions.map((emp) => (
            <option key={emp.code} value={emp.code}>
              {emp.code} - {emp.name}
            </option>
          ))}
        </select>
        <MultiSelectFilter
          label="REFERÊNCIAS"
          options={periodOptions}
          selected={periodFilter}
          onChange={setPeriodFilter}
        />
        <MultiSelectFilter
          label="DEPARTAMENTOS"
          options={deptOptions}
          selected={deptFilter}
          onChange={setDeptFilter}
        />
        <select
          value={indFlFilter}
          onChange={(e) => setIndFlFilter(e.target.value)}
          className="rounded-sm border border-border bg-surface px-3 py-1.5 font-mono text-audit-sm text-foreground outline-none transition-colors duration-150 focus:border-primary/50"
        >
          <option value="">TODAS FOLHAS</option>
          {indFlValues.map((v) => (
            <option key={v} value={v}>{v} - {getIndFlLabel(v)}</option>
          ))}
        </select>
        <span className="ml-auto font-mono text-audit-xs text-muted-foreground">
          {k250Records.length} registros K250
        </span>
      </div>

      {/* No employee selected */}
      {!employeeFilter && (
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <div className="font-mono text-lg text-muted-foreground">SELECIONE UM FUNCIONÁRIO</div>
            <div className="mt-2 font-mono text-audit-xs text-muted-foreground">
              Utilize o filtro acima para escolher o funcionário e validar os registros K250 × K300
            </div>
          </div>
        </div>
      )}

      {/* Employee selected - show K250 list */}
      {employeeFilter && (
        <>
          {/* Employee info bar */}
          <div className="flex items-center gap-4 border-b border-border bg-accent/20 px-4 py-2">
            <span className="font-mono text-audit-sm text-primary">{employeeFilter}</span>
            <span className="font-mono text-audit-sm text-foreground">{selectedWorkerName}</span>
            <div className="ml-auto flex gap-4">
              <div className="text-right">
                <div className="font-mono text-audit-xs text-muted-foreground">TOTAL BASE IRRF (K250)</div>
                <div className="font-mono text-audit-sm text-foreground">R$ {k250Totals.irrf.toFixed(2)}</div>
              </div>
              <div className="text-right">
                <div className="font-mono text-audit-xs text-muted-foreground">TOTAL BASE PS (K250)</div>
                <div className="font-mono text-audit-sm text-primary">R$ {k250Totals.ps.toFixed(2)}</div>
              </div>
            </div>
          </div>

          <div className="flex flex-1 flex-col overflow-hidden">
            {/* K250 table */}
            <div className={`overflow-auto ${selectedK250 ? 'max-h-[40%]' : 'flex-1'}`}>
              <table className="w-full">
                <thead className="sticky top-0 z-10 bg-background">
                  <tr className="border-b border-border">
                    <th className="audit-label p-2 text-left">FOLHA</th>
                    <th className="audit-label p-2 text-left">DEPTO</th>
                    <th className="audit-label p-2 text-left">PERÍODO</th>
                    <th className="audit-label p-2 text-left">CARGO</th>
                    <th className="audit-label p-2 text-right">BASE IRRF</th>
                    <th className="audit-label p-2 text-right">BASE PS</th>
                  </tr>
                </thead>
                <tbody>
                  {k250Records.map((record, index) => {
                    const isSelected = selectedK250?.rawLine === record.rawLine;
                    return (
                      <tr
                        key={`${record.period}-${record.departmentCode}-${index}`}
                        onClick={() => {
                          setSelectedK250((c) => (c?.rawLine === record.rawLine ? null : record));
                          setBaseIRRFFilter(new Set());
                          setBasePSFilter(new Set());
                          setRubrFilter('');
                        }}
                        className={`cursor-pointer border-b border-border/50 transition-colors duration-150 ${
                          isSelected ? 'bg-accent/40 hover:bg-accent/50' : 'hover:bg-accent/30'
                        }`}
                        style={{ borderLeft: `2px solid hsl(var(--manad-blockK))` }}
                      >
                        <td className="p-2 font-mono text-audit-xs text-muted-foreground">
                          {record.indFl} - {getIndFlLabel(record.indFl)}
                        </td>
                        <td className="p-2 font-mono text-audit-sm text-muted-foreground" title={deptMap.get(record.departmentCode)}>
                          {record.departmentCode}
                        </td>
                        <td className="p-2 font-mono text-audit-sm text-muted-foreground">{record.period}</td>
                        <td className="max-w-[200px] truncate p-2 font-mono text-audit-sm text-muted-foreground">{record.role}</td>
                        <td className="p-2 text-right font-mono text-audit-sm text-foreground">R$ {record.vlBaseIRRF}</td>
                        <td className="p-2 text-right font-mono text-audit-sm text-primary">R$ {record.vlBasePS}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {k250Records.length === 0 && (
                <div className="p-6 text-center font-mono text-audit-sm text-muted-foreground">
                  Nenhum registro K250 encontrado para os filtros selecionados.
                </div>
              )}
            </div>

            {/* K300 detail panel */}
            {selectedK250 && (
              <div className="flex flex-col overflow-hidden border-t border-border">
                {/* K250 selected header */}
                <div className="flex items-center gap-4 border-b border-border bg-accent/10 px-4 py-2">
                  <span className="font-mono text-audit-xs text-muted-foreground">K250:</span>
                  <span className="font-mono text-audit-sm text-foreground">
                    {selectedK250.indFl} · {selectedK250.departmentCode} · {selectedK250.period}
                  </span>
                  <span className="font-mono text-audit-xs text-muted-foreground">
                    IRRF: R$ {selectedK250.vlBaseIRRF || '0,00'} · PS: R$ {selectedK250.vlBasePS || '0,00'}
                  </span>
                  <div className="ml-auto flex gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedRaw(selectedK250.rawLine)}
                      className="rounded-sm border border-border px-2 py-1 font-mono text-audit-xs text-foreground transition-colors hover:bg-accent/40"
                    >
                      LINHA
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedK250(null)}
                      className="rounded-sm border border-border px-2 py-1 font-mono text-audit-xs text-muted-foreground transition-colors hover:bg-accent/40"
                    >
                      FECHAR
                    </button>
                  </div>
                </div>

                {/* K300 filters */}
                <div className="flex flex-wrap items-center gap-3 border-b border-border p-2">
                  <span className="font-mono text-audit-xs text-muted-foreground">K300:</span>
                  <MultiSelectFilter label="BASE IRRF" options={k300BaseIRRFOptions} selected={baseIRRFFilter} onChange={setBaseIRRFFilter} />
                  <MultiSelectFilter label="BASE PS" options={k300BasePSOptions} selected={basePSFilter} onChange={setBasePSFilter} />
                  <select
                    value={rubrFilter}
                    onChange={(e) => setRubrFilter(e.target.value)}
                    className="rounded-sm border border-border bg-surface px-2 py-1 font-mono text-audit-xs text-foreground outline-none transition-colors focus:border-primary/50"
                  >
                    <option value="">TODAS RUBRICAS</option>
                    <option value="P">P - Provento</option>
                    <option value="D">D - Desconto</option>
                    <option value="O">O - Outros</option>
                  </select>
                  <span className="ml-auto font-mono text-audit-xs text-muted-foreground">
                    {filteredK300.length} de {linkedK300.length} itens
                  </span>
                </div>

                {/* Totals comparison */}
                <div className="grid gap-2 border-b border-border p-3 md:grid-cols-5">
                  <div className="rounded-sm border border-border bg-background/60 p-2">
                    <div className="font-mono text-[9px] uppercase text-muted-foreground">TOTAL SELEÇÃO</div>
                    <div className={`font-mono text-sm ${k300Totals.totalSigned >= 0 ? 'text-primary' : 'text-destructive'}`}>
                      R$ {k300Totals.totalSigned.toFixed(2)}
                    </div>
                  </div>
                  <div className="rounded-sm border border-border bg-background/60 p-2">
                    <div className="font-mono text-[9px] uppercase text-muted-foreground">SOMA IRRF (K300)</div>
                    <div className="font-mono text-sm text-foreground">R$ {k300Totals.irrfTotal.toFixed(2)}</div>
                  </div>
                  <div className="rounded-sm border border-border bg-background/60 p-2">
                    <div className="font-mono text-[9px] uppercase text-muted-foreground">SOMA PS (K300)</div>
                    <div className="font-mono text-sm text-primary">R$ {k300Totals.psTotal.toFixed(2)}</div>
                  </div>
                  <div className="rounded-sm border border-border bg-background/60 p-2">
                    <div className="font-mono text-[9px] uppercase text-muted-foreground">DIF. IRRF</div>
                    <div className={`font-mono text-sm ${Math.abs(parseValue(selectedK250.vlBaseIRRF) - k300Totals.irrfTotal) < 0.01 ? 'text-primary' : 'text-destructive'}`}>
                      R$ {(parseValue(selectedK250.vlBaseIRRF) - k300Totals.irrfTotal).toFixed(2)}
                    </div>
                  </div>
                  <div className="rounded-sm border border-border bg-background/60 p-2">
                    <div className="font-mono text-[9px] uppercase text-muted-foreground">DIF. PS</div>
                    <div className={`font-mono text-sm ${Math.abs(parseValue(selectedK250.vlBasePS) - k300Totals.psTotal) < 0.01 ? 'text-primary' : 'text-destructive'}`}>
                      R$ {(parseValue(selectedK250.vlBasePS) - k300Totals.psTotal).toFixed(2)}
                    </div>
                  </div>
                </div>

                {/* K300 table */}
                <div className="flex-1 overflow-auto">
                  <table className="w-full">
                    <thead className="sticky top-0 z-10 bg-background">
                      <tr className="border-b border-border">
                        <th className="audit-label p-2 text-left">EVENTO</th>
                        <th className="audit-label p-2 text-left">DESCRIÇÃO</th>
                        <th className="audit-label p-2 text-right">VALOR</th>
                        <th className="audit-label p-2 text-right">C/ SINAL</th>
                        <th className="audit-label p-2 text-left">RUBRICA</th>
                        <th className="audit-label p-2 text-left">BASE IRRF</th>
                        <th className="audit-label p-2 text-left">BASE PS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredK300.map((r, i) => {
                        const signed = parseValue(r.value) * getRubrMultiplier(r.indRubr);
                        return (
                          <tr
                            key={`${r.eventCode}-${i}`}
                            onClick={() => setSelectedRaw(r.rawLine)}
                            className="cursor-pointer border-b border-border/50 transition-colors duration-150 hover:bg-accent/30"
                          >
                            <td className="p-2 font-mono text-audit-sm text-foreground">{r.eventCode}</td>
                            <td className="max-w-[240px] truncate p-2 font-mono text-audit-xs text-muted-foreground" title={eventMap.get(r.eventCode)}>
                              {eventMap.get(r.eventCode) || '—'}
                            </td>
                            <td className="p-2 text-right font-mono text-audit-sm text-foreground">R$ {r.value}</td>
                            <td className={`p-2 text-right font-mono text-audit-sm ${signed >= 0 ? 'text-primary' : 'text-destructive'}`}>
                              R$ {signed.toFixed(2)}
                            </td>
                            <td className="p-2 font-mono text-audit-xs">
                              <span className={r.indRubr === 'P' ? 'text-primary' : r.indRubr === 'D' ? 'text-destructive' : 'text-muted-foreground'}>
                                {r.indRubr} - {IND_RUBR_LABELS[r.indRubr] || r.indRubr}
                              </span>
                            </td>
                            <td className="p-2 font-mono text-audit-xs text-muted-foreground" title={IND_BASE_IRRF_LABELS[r.indBaseIRRF]}>
                              {r.indBaseIRRF || '—'}
                            </td>
                            <td className="p-2 font-mono text-audit-xs text-muted-foreground" title={IND_BASE_PS_LABELS[r.indBasePS]}>
                              {r.indBasePS || '—'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  {filteredK300.length === 0 && (
                    <div className="p-4 text-center font-mono text-audit-xs text-muted-foreground">
                      Nenhum item K300 encontrado.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {selectedRaw && <InspectorPanel rawLine={selectedRaw} onClose={() => setSelectedRaw(null)} />}
    </div>
  );
}

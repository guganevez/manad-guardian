import { useState, useMemo } from 'react';
import {
  RecordK250,
  RecordK300,
  getIndFlLabel,
  IND_RUBR_LABELS,
  IND_BASE_IRRF_LABELS,
  IND_BASE_PS_LABELS,
} from '@/lib/manad-parser';
import { MultiSelectFilter } from './MultiSelectFilter';

interface K250LinkedItemsPanelProps {
  selectedRecord: RecordK250;
  linkedRecords: RecordK300[];
  workerName: string;
  departmentName?: string;
  eventMap: Map<string, string>;
  onClose: () => void;
  onInspectRaw: (rawLine: string) => void;
}

function parseValue(value: string): number {
  if (!value) return 0;
  return parseFloat(value.replace(',', '.')) || 0;
}

function getRubrMultiplier(indRubr: string): number {
  if (indRubr === 'P') return 1;
  if (indRubr === 'D') return -1;
  return 0; // 'O' - Outros
}

function getSignedValue(record: RecordK300): number {
  return parseValue(record.value) * getRubrMultiplier(record.indRubr);
}

export function K250LinkedItemsPanel({
  selectedRecord,
  linkedRecords,
  workerName,
  departmentName,
  eventMap,
  onClose,
  onInspectRaw,
}: K250LinkedItemsPanelProps) {
  const [baseIRRFFilter, setBaseIRRFFilter] = useState<Set<string>>(new Set());
  const [basePSFilter, setBasePSFilter] = useState<Set<string>>(new Set());
  const [rubrFilter, setRubrFilter] = useState('');

  const baseIRRFOptions = useMemo(() => {
    const values = new Set<string>();
    linkedRecords.forEach((r) => { if (r.indBaseIRRF) values.add(r.indBaseIRRF); });
    return Array.from(values).sort().map((v) => ({
      value: v,
      label: `${v} - ${IND_BASE_IRRF_LABELS[v] || v}`,
    }));
  }, [linkedRecords]);

  const basePSOptions = useMemo(() => {
    const values = new Set<string>();
    linkedRecords.forEach((r) => { if (r.indBasePS) values.add(r.indBasePS); });
    return Array.from(values).sort().map((v) => ({
      value: v,
      label: `${v} - ${IND_BASE_PS_LABELS[v] || v}`,
    }));
  }, [linkedRecords]);

  const filtered = useMemo(() => {
    return linkedRecords.filter((r) => {
      if (baseIRRFFilter.size > 0 && !baseIRRFFilter.has(r.indBaseIRRF)) return false;
      if (basePSFilter.size > 0 && !basePSFilter.has(r.indBasePS)) return false;
      if (rubrFilter && r.indRubr !== rubrFilter) return false;
      return true;
    });
  }, [linkedRecords, baseIRRFFilter, basePSFilter, rubrFilter]);

  const totals = useMemo(() => {
    const result = { count: filtered.length, totalSigned: 0, irrfTotal: 0, psTotal: 0, irrfCount: 0, psCount: 0 };

    filtered.forEach((record) => {
      const signed = getSignedValue(record);
      result.totalSigned += signed;

      if (record.indBaseIRRF && record.indBaseIRRF !== '3') {
        result.irrfCount += 1;
        result.irrfTotal += signed;
      }
      if (record.indBasePS && record.indBasePS !== '3') {
        result.psCount += 1;
        result.psTotal += signed;
      }
    });

    return result;
  }, [filtered]);

  const k250BaseIRRF = parseValue(selectedRecord.vlBaseIRRF);
  const k250BasePS = parseValue(selectedRecord.vlBasePS);
  const diffIRRF = k250BaseIRRF - totals.irrfTotal;
  const diffPS = k250BasePS - totals.psTotal;

  return (
    <div className="border-t border-border surface">
      {/* Header */}
      <div className="flex flex-col gap-4 border-b border-border p-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="space-y-3">
          <div>
            <div className="audit-label mb-2">K250 SELECIONADO</div>
            <div className="font-mono text-audit-sm text-foreground">
              {selectedRecord.employeeCode} · {workerName}
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-sm border border-border bg-background/60 p-3">
              <div className="audit-label mb-1">DEPTO / PERÍODO</div>
              <div className="font-mono text-audit-sm text-foreground">{selectedRecord.departmentCode}</div>
              <div className="font-mono text-audit-xs text-muted-foreground">
                {departmentName || 'Departamento não localizado'} · {selectedRecord.period}
              </div>
            </div>
            <div className="rounded-sm border border-border bg-background/60 p-3">
              <div className="audit-label mb-1">TIPO DE FOLHA</div>
              <div className="font-mono text-audit-sm text-foreground">{selectedRecord.indFl}</div>
              <div className="font-mono text-audit-xs text-muted-foreground">{getIndFlLabel(selectedRecord.indFl)}</div>
            </div>
            <div className="rounded-sm border border-border bg-background/60 p-3">
              <div className="audit-label mb-1">BASE IRRF K250</div>
              <div className="font-mono text-audit-sm text-foreground">R$ {selectedRecord.vlBaseIRRF || '0,00'}</div>
              <div className="font-mono text-audit-xs text-muted-foreground">Cargo: {selectedRecord.role || 'Não informado'}</div>
            </div>
            <div className="rounded-sm border border-border bg-background/60 p-3">
              <div className="audit-label mb-1">BASE PS K250</div>
              <div className="font-mono text-audit-sm text-primary">R$ {selectedRecord.vlBasePS || '0,00'}</div>
              <div className="font-mono text-audit-xs text-muted-foreground">Itens vinculados logo abaixo</div>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => onInspectRaw(selectedRecord.rawLine)}
            className="rounded-sm border border-border px-3 py-1.5 font-mono text-audit-xs text-foreground transition-colors duration-150 hover:bg-accent/40"
          >
            VER LINHA K250
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-sm border border-border px-3 py-1.5 font-mono text-audit-xs text-muted-foreground transition-colors duration-150 hover:bg-accent/40"
          >
            FECHAR
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 border-b border-border p-3">
        <span className="font-mono text-audit-xs text-muted-foreground">FILTROS K300:</span>
        <MultiSelectFilter
          label="BASE IRRF"
          options={baseIRRFOptions}
          selected={baseIRRFFilter}
          onChange={setBaseIRRFFilter}
        />
        <MultiSelectFilter
          label="BASE PS"
          options={basePSOptions}
          selected={basePSFilter}
          onChange={setBasePSFilter}
        />
        <select
          value={rubrFilter}
          onChange={(e) => setRubrFilter(e.target.value)}
          className="rounded-sm border border-border bg-surface px-3 py-1.5 font-mono text-audit-sm text-foreground outline-none transition-colors duration-150 focus:border-primary/50"
        >
          <option value="">TODAS RUBRICAS</option>
          <option value="P">P - Provento</option>
          <option value="D">D - Desconto</option>
          <option value="O">O - Outros</option>
        </select>
        <span className="ml-auto font-mono text-audit-xs text-muted-foreground">
          {filtered.length} de {linkedRecords.length} itens
        </span>
      </div>

      {/* Totalizers */}
      <div className="grid gap-3 border-b border-border p-4 md:grid-cols-2 xl:grid-cols-5">
        <div className="rounded-sm border border-border bg-background/60 p-3">
          <div className="audit-label mb-1">TOTAL SELEÇÃO</div>
          <div className={`font-mono text-lg ${totals.totalSigned >= 0 ? 'text-primary' : 'text-destructive'}`}>
            R$ {totals.totalSigned.toFixed(2)}
          </div>
          <div className="font-mono text-audit-xs text-muted-foreground">
            P(+1) D(-1) O(0) · {filtered.length} itens
          </div>
        </div>
        <div className="rounded-sm border border-border bg-background/60 p-3">
          <div className="audit-label mb-1">SOMA BASE IRRF (K300)</div>
          <div className="font-mono text-lg text-foreground">R$ {totals.irrfTotal.toFixed(2)}</div>
          <div className="font-mono text-audit-xs text-muted-foreground">{totals.irrfCount} itens com base IRRF</div>
        </div>
        <div className="rounded-sm border border-border bg-background/60 p-3">
          <div className="audit-label mb-1">SOMA BASE PS (K300)</div>
          <div className="font-mono text-lg text-primary">R$ {totals.psTotal.toFixed(2)}</div>
          <div className="font-mono text-audit-xs text-muted-foreground">{totals.psCount} itens com base PS</div>
        </div>
        <div className="rounded-sm border border-border bg-background/60 p-3">
          <div className="audit-label mb-1">DIFERENÇA IRRF</div>
          <div className={`font-mono text-lg ${Math.abs(diffIRRF) < 0.01 ? 'text-primary' : 'text-destructive'}`}>
            R$ {diffIRRF.toFixed(2)}
          </div>
          <div className="font-mono text-audit-xs text-muted-foreground">
            K250({k250BaseIRRF.toFixed(2)}) − K300({totals.irrfTotal.toFixed(2)})
          </div>
        </div>
        <div className="rounded-sm border border-border bg-background/60 p-3">
          <div className="audit-label mb-1">DIFERENÇA PS</div>
          <div className={`font-mono text-lg ${Math.abs(diffPS) < 0.01 ? 'text-primary' : 'text-destructive'}`}>
            R$ {diffPS.toFixed(2)}
          </div>
          <div className="font-mono text-audit-xs text-muted-foreground">
            K250({k250BasePS.toFixed(2)}) − K300({totals.psTotal.toFixed(2)})
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="max-h-[22rem] overflow-auto">
        {filtered.length === 0 ? (
          <div className="p-6 text-center">
            <div className="font-mono text-audit-sm text-muted-foreground">
              Nenhum item K300 vinculado ao K250 selecionado.
            </div>
          </div>
        ) : (
          <table className="w-full">
            <thead className="sticky top-0 z-10 bg-background">
              <tr className="border-b border-border">
                <th className="audit-label p-2 text-left">EVENTO</th>
                <th className="audit-label p-2 text-left">DESCRIÇÃO</th>
                <th className="audit-label p-2 text-right">VALOR</th>
                <th className="audit-label p-2 text-right">VALOR C/ SINAL</th>
                <th className="audit-label p-2 text-left">RUBRICA</th>
                <th className="audit-label p-2 text-left">BASE IRRF</th>
                <th className="audit-label p-2 text-left">BASE PS</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((record, index) => {
                const signed = getSignedValue(record);
                return (
                  <tr
                    key={`${record.eventCode}-${index}`}
                    onClick={() => onInspectRaw(record.rawLine)}
                    className="cursor-pointer border-b border-border/50 transition-colors duration-150 hover:bg-accent/30"
                  >
                    <td className="p-2 font-mono text-audit-sm text-foreground">{record.eventCode}</td>
                    <td className="max-w-[260px] p-2 font-mono text-audit-xs text-muted-foreground" title={eventMap.get(record.eventCode)}>
                      {eventMap.get(record.eventCode) || 'Evento não localizado'}
                    </td>
                    <td className="p-2 text-right font-mono text-audit-sm text-foreground">R$ {record.value}</td>
                    <td className={`p-2 text-right font-mono text-audit-sm ${signed >= 0 ? 'text-primary' : 'text-destructive'}`}>
                      R$ {signed.toFixed(2)}
                    </td>
                    <td className="p-2 font-mono text-audit-xs">
                      <span className={
                        record.indRubr === 'P' ? 'text-primary' : record.indRubr === 'D' ? 'text-destructive' : 'text-muted-foreground'
                      }>
                        {record.indRubr} - {IND_RUBR_LABELS[record.indRubr] || record.indRubr}
                      </span>
                    </td>
                    <td className="p-2 font-mono text-audit-xs text-muted-foreground" title={IND_BASE_IRRF_LABELS[record.indBaseIRRF]}>
                      {record.indBaseIRRF || '—'}
                    </td>
                    <td className="p-2 font-mono text-audit-xs text-muted-foreground" title={IND_BASE_PS_LABELS[record.indBasePS]}>
                      {record.indBasePS || '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

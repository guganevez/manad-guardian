import { useMemo } from 'react';
import {
  RecordK250,
  RecordK300,
  getIndFlLabel,
  IND_RUBR_LABELS,
  IND_BASE_IRRF_LABELS,
  IND_BASE_PS_LABELS,
} from '@/lib/manad-parser';

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

function getSignedValue(record: RecordK300): number {
  const value = parseValue(record.value);
  return record.indRubr === 'D' ? -value : value;
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
  const summary = useMemo(() => {
    return linkedRecords.reduce(
      (totals, record) => {
        if (record.indBaseIRRF && record.indBaseIRRF !== '3') {
          totals.irrfCount += 1;
          totals.irrfTotal += getSignedValue(record);
        }

        if (record.indBasePS && record.indBasePS !== '3') {
          totals.psCount += 1;
          totals.psTotal += getSignedValue(record);
        }

        return totals;
      },
      { irrfTotal: 0, psTotal: 0, irrfCount: 0, psCount: 0 },
    );
  }, [linkedRecords]);

  return (
    <div className="border-t border-border surface">
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

      <div className="grid gap-3 border-b border-border p-4 md:grid-cols-3">
        <div className="rounded-sm border border-border bg-background/60 p-3">
          <div className="audit-label mb-1">ITENS K300</div>
          <div className="font-mono text-xl text-foreground">{linkedRecords.length}</div>
        </div>
        <div className="rounded-sm border border-border bg-background/60 p-3">
          <div className="audit-label mb-1">SOMA BASE IRRF</div>
          <div className="font-mono text-xl text-foreground">R$ {summary.irrfTotal.toFixed(2)}</div>
          <div className="font-mono text-audit-xs text-muted-foreground">{summary.irrfCount} itens com base IRRF</div>
        </div>
        <div className="rounded-sm border border-border bg-background/60 p-3">
          <div className="audit-label mb-1">SOMA BASE PS</div>
          <div className="font-mono text-xl text-primary">R$ {summary.psTotal.toFixed(2)}</div>
          <div className="font-mono text-audit-xs text-muted-foreground">{summary.psCount} itens com base PS</div>
        </div>
      </div>

      <div className="max-h-[22rem] overflow-auto">
        {linkedRecords.length === 0 ? (
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
                <th className="audit-label p-2 text-left">RUBRICA</th>
                <th className="audit-label p-2 text-left">BASE IRRF</th>
                <th className="audit-label p-2 text-left">BASE PS</th>
              </tr>
            </thead>
            <tbody>
              {linkedRecords.map((record, index) => (
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
                  <td className="p-2 font-mono text-audit-xs text-muted-foreground">
                    {record.indRubr} - {IND_RUBR_LABELS[record.indRubr] || record.indRubr}
                  </td>
                  <td className="p-2 font-mono text-audit-xs text-muted-foreground" title={IND_BASE_IRRF_LABELS[record.indBaseIRRF]}>
                    {record.indBaseIRRF || '—'}
                  </td>
                  <td className="p-2 font-mono text-audit-xs text-muted-foreground" title={IND_BASE_PS_LABELS[record.indBasePS]}>
                    {record.indBasePS || '—'}
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

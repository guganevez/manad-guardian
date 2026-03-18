import { MANADFile, formatCurrency } from '@/lib/manad-parser';

interface SummaryViewProps {
  file: MANADFile;
}

export function SummaryView({ file }: SummaryViewProps) {
  const totalK990 = file.totals?.totalRecords || 0;

  const stats = [
    { label: 'TRABALHADORES', value: file.workers.length, block: 'K050' },
    { label: 'DEPARTAMENTOS', value: file.departments.length, block: 'K100' },
    { label: 'EVENTOS', value: file.events.length, block: 'K150' },
    { label: 'BASES SINTÉTICAS', value: file.syntheticData.length, block: 'K250' },
    { label: 'VALORES ANALÍTICOS', value: file.analyticData.length, block: 'K300' },
    { label: 'TOTAL REG. BLOCO K', value: totalK990, block: 'K990' },
  ];

  // count workers with termination
  const terminated = file.workers.filter(w => w.terminationDate).length;
  const active = file.workers.length - terminated;

  return (
    <div className="p-4 space-y-6">
      {/* Header info cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="surface border border-border p-4 rounded-sm">
          <div className="audit-label mb-2">ABERTURA DO ARQUIVO (0000)</div>
          <div className="font-mono text-lg text-foreground">{file.companyName}</div>
          <div className="font-mono text-audit-sm text-muted-foreground mt-1">CNPJ: {file.cnpj}</div>
          <div className="font-mono text-audit-sm text-muted-foreground">
            Período: {file.header?.startDate} — {file.header?.endDate}
          </div>
          <div className="font-mono text-audit-sm text-muted-foreground">
            UF: {file.header?.state}
          </div>
        </div>

        {file.accountant && (
          <div className="surface border border-border p-4 rounded-sm">
            <div className="audit-label mb-2">CONTABILISTA (0050)</div>
            <div className="font-mono text-audit-sm text-foreground">{file.accountant.name}</div>
            <div className="font-mono text-audit-sm text-muted-foreground mt-1">
              CRC: {file.accountant.crc}
            </div>
            <div className="font-mono text-audit-sm text-muted-foreground">
              {file.accountant.email}
            </div>
          </div>
        )}
      </div>

      {/* Stats grid */}
      <div>
        <div className="audit-label mb-3">QUANTITATIVOS</div>
        <div className="grid grid-cols-3 gap-3">
          {stats.map((s) => (
            <div key={s.block} className="surface border border-border p-4 rounded-sm">
              <div className="audit-label mb-1">{s.label}</div>
              <div className="font-mono text-2xl text-primary">
                {s.value.toLocaleString('pt-BR')}
              </div>
              <div className="font-mono text-audit-xs text-muted-foreground mt-1">{s.block}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Worker status */}
      <div>
        <div className="audit-label mb-3">STATUS DOS TRABALHADORES</div>
        <div className="grid grid-cols-2 gap-3">
          <div className="surface border border-border p-4 rounded-sm">
            <div className="audit-label mb-1">ATIVOS</div>
            <div className="font-mono text-2xl text-primary">{active}</div>
          </div>
          <div className="surface border border-border p-4 rounded-sm">
            <div className="audit-label mb-1">DESLIGADOS</div>
            <div className="font-mono text-2xl text-warning">{terminated}</div>
          </div>
        </div>
      </div>

      {/* Control records */}
      {file.controlRecords.length > 0 && (
        <div>
          <div className="audit-label mb-3">REGISTROS DE CONTROLE (9900)</div>
          <div className="surface border border-border rounded-sm overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="audit-label text-left p-2">TIPO</th>
                  <th className="audit-label text-right p-2">QTD</th>
                </tr>
              </thead>
              <tbody>
                {file.controlRecords.map((r, i) => (
                  <tr key={i} className="border-b border-border/50 hover:bg-accent/30 transition-colors duration-150">
                    <td className="font-mono text-audit-sm p-2 text-foreground">{r.recordType}</td>
                    <td className="font-mono text-audit-sm p-2 text-right text-muted-foreground">
                      {r.count.toLocaleString('pt-BR')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

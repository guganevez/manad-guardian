import { MANADFile } from '@/lib/manad-parser';

interface ControlViewProps {
  file: MANADFile;
}

export function ControlView({ file }: ControlViewProps) {
  return (
    <div className="p-4">
      <div className="audit-label mb-3">REGISTROS DE CONTROLE E ENCERRAMENTO</div>
      
      <div className="grid grid-cols-2 gap-4 mb-6">
        {file.totals && (
          <div className="surface border border-border p-4 rounded-sm">
            <div className="audit-label mb-1">K990 — TOTALIZADOR BLOCO K</div>
            <div className="font-mono text-2xl text-primary">
              {file.totals.totalRecords.toLocaleString('pt-BR')}
            </div>
            <div className="font-mono text-audit-xs text-muted-foreground mt-1">registros no bloco K</div>
          </div>
        )}
        <div className="surface border border-border p-4 rounded-sm">
          <div className="audit-label mb-1">9999 — TOTAL DO ARQUIVO</div>
          <div className="font-mono text-2xl text-primary">
            {file.totalLines.toLocaleString('pt-BR')}
          </div>
          <div className="font-mono text-audit-xs text-muted-foreground mt-1">linhas no arquivo</div>
        </div>
      </div>

      <div className="audit-label mb-3">9900 — CONTAGEM POR TIPO DE REGISTRO</div>
      <div className="surface border border-border rounded-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="audit-label text-left p-2">REGISTRO</th>
              <th className="audit-label text-right p-2">QUANTIDADE</th>
              <th className="audit-label text-left p-2">BLOCO</th>
            </tr>
          </thead>
          <tbody>
            {file.controlRecords.map((r, i) => {
              const block = r.recordType.startsWith('K') ? 'K' : r.recordType.startsWith('9') ? '9' : '0';
              const blockColor = block === 'K' ? 'bg-manad-blockK' : block === '9' ? 'bg-manad-block9' : 'bg-manad-block0';
              return (
                <tr key={i} className="border-b border-border/50 hover:bg-accent/30 transition-colors duration-150">
                  <td className="font-mono text-audit-sm p-2 text-foreground flex items-center gap-2">
                    <span className={`w-1 h-3 rounded-sm ${blockColor}`} />
                    {r.recordType}
                  </td>
                  <td className="font-mono text-audit-sm p-2 text-right text-primary">
                    {r.count.toLocaleString('pt-BR')}
                  </td>
                  <td className="font-mono text-audit-xs p-2 text-muted-foreground">
                    BLOCO {block}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

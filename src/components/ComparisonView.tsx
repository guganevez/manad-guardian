import { useMemo } from 'react';
import { MANADFile } from '@/lib/manad-parser';
import { compareFiles, CrossFileComparison } from '@/lib/discrepancy-engine';

interface ComparisonViewProps {
  files: { file: MANADFile; name: string }[];
  file1Index: number;
  file2Index: number;
  onChangeFile1: (i: number) => void;
  onChangeFile2: (i: number) => void;
}

function DiffSection({ title, diff }: { title: string; diff: { onlyIn1: string[]; onlyIn2: string[]; inBoth: number } }) {
  return (
    <div className="surface border border-border p-4 rounded-sm">
      <div className="audit-label mb-3">{title}</div>
      <div className="grid grid-cols-3 gap-3 mb-3">
        <div>
          <div className="audit-label mb-1">EM COMUM</div>
          <div className="font-mono text-lg text-primary">{diff.inBoth}</div>
        </div>
        <div>
          <div className="audit-label mb-1">APENAS ARQ. 1</div>
          <div className="font-mono text-lg text-warning">{diff.onlyIn1.length}</div>
        </div>
        <div>
          <div className="audit-label mb-1">APENAS ARQ. 2</div>
          <div className="font-mono text-lg text-warning">{diff.onlyIn2.length}</div>
        </div>
      </div>
      {(diff.onlyIn1.length > 0 || diff.onlyIn2.length > 0) && (
        <div className="grid grid-cols-2 gap-3">
          {diff.onlyIn1.length > 0 && (
            <div>
              <div className="audit-label mb-1 text-destructive">EXCLUSIVOS ARQ. 1</div>
              <div className="max-h-32 overflow-auto">
                {diff.onlyIn1.slice(0, 20).map((v, i) => (
                  <div key={i} className="font-mono text-audit-xs text-muted-foreground">{v}</div>
                ))}
                {diff.onlyIn1.length > 20 && (
                  <div className="font-mono text-audit-xs text-muted-foreground">+{diff.onlyIn1.length - 20} mais</div>
                )}
              </div>
            </div>
          )}
          {diff.onlyIn2.length > 0 && (
            <div>
              <div className="audit-label mb-1 text-destructive">EXCLUSIVOS ARQ. 2</div>
              <div className="max-h-32 overflow-auto">
                {diff.onlyIn2.slice(0, 20).map((v, i) => (
                  <div key={i} className="font-mono text-audit-xs text-muted-foreground">{v}</div>
                ))}
                {diff.onlyIn2.length > 20 && (
                  <div className="font-mono text-audit-xs text-muted-foreground">+{diff.onlyIn2.length - 20} mais</div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function ComparisonView({ files, file1Index, file2Index, onChangeFile1, onChangeFile2 }: ComparisonViewProps) {
  const comparison = useMemo<CrossFileComparison | null>(() => {
    if (file1Index === file2Index || !files[file1Index] || !files[file2Index]) return null;
    const f1 = files[file1Index];
    const f2 = files[file2Index];
    return compareFiles(f1.file, f1.name, f2.file, f2.name);
  }, [files, file1Index, file2Index]);

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-border">
        <div className="audit-label mb-3">COMPARAÇÃO ENTRE ARQUIVOS</div>
        <div className="flex gap-3 items-center">
          <select
            value={file1Index}
            onChange={(e) => onChangeFile1(Number(e.target.value))}
            className="bg-surface border border-border rounded-sm px-3 py-1.5 font-mono text-audit-sm text-foreground outline-none focus:border-primary/50 transition-colors duration-150 flex-1"
          >
            {files.map((f, i) => (
              <option key={i} value={i}>{f.name} — {f.file.companyName}</option>
            ))}
          </select>
          <span className="font-mono text-audit-sm text-muted-foreground">×</span>
          <select
            value={file2Index}
            onChange={(e) => onChangeFile2(Number(e.target.value))}
            className="bg-surface border border-border rounded-sm px-3 py-1.5 font-mono text-audit-sm text-foreground outline-none focus:border-primary/50 transition-colors duration-150 flex-1"
          >
            {files.map((f, i) => (
              <option key={i} value={i}>{f.name} — {f.file.companyName}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-4">
        {!comparison ? (
          <div className="flex items-center justify-center h-full">
            <div className="font-mono text-audit-sm text-muted-foreground">
              Selecione dois arquivos diferentes para comparar.
            </div>
          </div>
        ) : (
          <>
            {/* Values summary */}
            <div className="surface border border-border p-4 rounded-sm">
              <div className="audit-label mb-3">TOTAIS (K250)</div>
              <div className="grid grid-cols-4 gap-3">
                <div>
                  <div className="audit-label mb-1">{comparison.file1Name}</div>
                  <div className="font-mono text-lg text-foreground">
                    R$ {comparison.totalValuesDiff.file1Total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </div>
                </div>
                <div>
                  <div className="audit-label mb-1">{comparison.file2Name}</div>
                  <div className="font-mono text-lg text-foreground">
                    R$ {comparison.totalValuesDiff.file2Total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </div>
                </div>
                <div>
                  <div className="audit-label mb-1">DIFERENÇA</div>
                  <div className={`font-mono text-lg ${comparison.totalValuesDiff.difference >= 0 ? 'text-primary' : 'text-destructive'}`}>
                    R$ {comparison.totalValuesDiff.difference.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </div>
                </div>
                <div>
                  <div className="audit-label mb-1">VARIAÇÃO</div>
                  <div className={`font-mono text-lg ${comparison.totalValuesDiff.percentChange >= 0 ? 'text-primary' : 'text-destructive'}`}>
                    {comparison.totalValuesDiff.percentChange >= 0 ? '+' : ''}{comparison.totalValuesDiff.percentChange.toFixed(2)}%
                  </div>
                </div>
              </div>
            </div>

            <DiffSection title="TRABALHADORES" diff={comparison.workerDiff} />
            <DiffSection title="DEPARTAMENTOS" diff={comparison.departmentDiff} />
            <DiffSection title="EVENTOS" diff={comparison.eventDiff} />
          </>
        )}
      </div>
    </div>
  );
}

import { MANADFile } from '@/lib/manad-parser';

interface FileDropzoneProps {
  onFileLoaded: (data: MANADFile, fileName: string) => void;
}

export function FileDropzone({ onFileLoaded }: FileDropzoneProps) {
  const handleFile = async (file: File) => {
    const text = await file.text();
    const { parseMANADFile } = await import('@/lib/manad-parser');
    const parsed = parseMANADFile(text);
    onFileLoaded(parsed, file.name);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-8">
      <label
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        className="flex flex-col items-center justify-center w-full max-w-xl h-64 border border-dashed border-border hover:border-primary/50 rounded-sm cursor-pointer transition-colors duration-150 surface"
      >
        <div className="flex flex-col items-center gap-4 p-8">
          <div className="font-mono text-audit-sm text-muted-foreground">[UPLOAD]</div>
          <div className="font-mono text-lg text-foreground tracking-tight">
            MANAD_AUDIT_ENGINE_v1.0
          </div>
          <div className="font-mono text-audit-sm text-muted-foreground text-center">
            Arraste o arquivo .TXT ou clique para selecionar
          </div>
          <div className="audit-label mt-2">
            FORMATO: PIPE-DELIMITED | CHARSET: LATIN-1/UTF-8
          </div>
        </div>
        <input
          type="file"
          accept=".txt,.TXT"
          onChange={handleChange}
          className="hidden"
        />
      </label>
    </div>
  );
}

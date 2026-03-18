import { useState } from 'react';
import { MANADFile } from '@/lib/manad-parser';
import { FileDropzone } from '@/components/FileDropzone';
import { AuditSidebar } from '@/components/AuditSidebar';
import { SummaryView } from '@/components/SummaryView';
import { WorkersView } from '@/components/WorkersView';
import { DepartmentsView } from '@/components/DepartmentsView';
import { EventsView } from '@/components/EventsView';
import { SyntheticView } from '@/components/SyntheticView';
import { AnalyticView } from '@/components/AnalyticView';
import { ControlView } from '@/components/ControlView';
import { DiscrepancyView } from '@/components/DiscrepancyView';
import { ComparisonView } from '@/components/ComparisonView';
import { EmployeeValidationView } from '@/components/EmployeeValidationView';

interface LoadedFile {
  file: MANADFile;
  name: string;
}

const Index = () => {
  const [files, setFiles] = useState<LoadedFile[]>([]);
  const [activeFileIndex, setActiveFileIndex] = useState(0);
  const [activeView, setActiveView] = useState('summary');
  const [comp1, setComp1] = useState(0);
  const [comp2, setComp2] = useState(1);

  const handleFileLoaded = (data: MANADFile, name: string) => {
    setFiles(prev => {
      const next = [...prev, { file: data, name }];
      setActiveFileIndex(next.length - 1);
      if (next.length === 2) setComp2(next.length - 1);
      return next;
    });
    setActiveView('summary');
  };

  const handleRemoveFile = (index: number) => {
    setFiles(prev => {
      const next = prev.filter((_, i) => i !== index);
      if (next.length === 0) return next;
      return next;
    });
    setActiveFileIndex(i => Math.min(i, files.length - 2));
  };

  const currentFile = files[activeFileIndex] || null;

  if (files.length === 0) {
    return <FileDropzone onFileLoaded={handleFileLoaded} />;
  }

  const renderView = () => {
    if (!currentFile) return null;
    const { file } = currentFile;

    switch (activeView) {
      case 'summary': return <SummaryView file={file} />;
      case 'workers': return <WorkersView workers={file.workers} />;
      case 'departments': return <DepartmentsView departments={file.departments} />;
      case 'events': return <EventsView events={file.events} />;
      case 'synthetic': return <SyntheticView file={file} />;
      case 'analytic': return <AnalyticView file={file} />;
      case 'control': return <ControlView file={file} />;
      case 'validation': return <EmployeeValidationView file={file} />;
      case 'discrepancies': return <DiscrepancyView file={file} />;
      case 'comparison': return (
        <ComparisonView
          files={files}
          file1Index={comp1}
          file2Index={comp2}
          onChangeFile1={setComp1}
          onChangeFile2={setComp2}
        />
      );
      default: return <SummaryView file={file} />;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <AuditSidebar
        file={currentFile.file}
        fileName={currentFile.name}
        activeView={activeView}
        onViewChange={setActiveView}
        files={files}
        activeFileIndex={activeFileIndex}
        onFileSelect={setActiveFileIndex}
        onAddFile={() => {
          const input = document.createElement('input');
          input.type = 'file';
          input.accept = '.txt,.TXT';
          input.onchange = async (e) => {
            const f = (e.target as HTMLInputElement).files?.[0];
            if (f) {
              const text = await f.text();
              const { parseMANADFile } = await import('@/lib/manad-parser');
              handleFileLoaded(parseMANADFile(text), f.name);
            }
          };
          input.click();
        }}
        hasMultipleFiles={files.length > 1}
      />
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-12 border-b border-border flex items-center px-4 gap-4 shrink-0">
          <span className="font-mono text-audit-sm text-primary">[MANAD]</span>
          <span className="font-mono text-audit-sm text-foreground">{currentFile.file.companyName}</span>
          <span className="font-mono text-audit-xs text-muted-foreground">
            {currentFile.file.header?.startDate} — {currentFile.file.header?.endDate}
          </span>
          {files.length > 1 && (
            <span className="font-mono text-audit-xs text-primary">
              [{files.length} arquivos]
            </span>
          )}
          <button
            onClick={() => { setFiles([]); setActiveFileIndex(0); }}
            className="ml-auto font-mono text-audit-xs text-muted-foreground hover:text-foreground transition-colors duration-150"
          >
            [LIMPAR TUDO]
          </button>
        </header>

        <div className="flex-1 overflow-auto">
          {renderView()}
        </div>
      </main>
    </div>
  );
};

export default Index;

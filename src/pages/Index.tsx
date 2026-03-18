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

const Index = () => {
  const [file, setFile] = useState<MANADFile | null>(null);
  const [fileName, setFileName] = useState('');
  const [activeView, setActiveView] = useState('summary');

  const handleFileLoaded = (data: MANADFile, name: string) => {
    setFile(data);
    setFileName(name);
    setActiveView('summary');
  };

  if (!file) {
    return <FileDropzone onFileLoaded={handleFileLoaded} />;
  }

  const renderView = () => {
    switch (activeView) {
      case 'summary': return <SummaryView file={file} />;
      case 'workers': return <WorkersView workers={file.workers} />;
      case 'departments': return <DepartmentsView departments={file.departments} />;
      case 'events': return <EventsView events={file.events} />;
      case 'synthetic': return <SyntheticView file={file} />;
      case 'analytic': return <AnalyticView file={file} />;
      case 'control': return <ControlView file={file} />;
      default: return <SummaryView file={file} />;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <AuditSidebar
        file={file}
        fileName={fileName}
        activeView={activeView}
        onViewChange={setActiveView}
      />
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header bar */}
        <header className="h-12 border-b border-border flex items-center px-4 gap-4 shrink-0">
          <span className="font-mono text-audit-sm text-primary">[MANAD]</span>
          <span className="font-mono text-audit-sm text-foreground">{file.companyName}</span>
          <span className="font-mono text-audit-xs text-muted-foreground">
            {file.header?.startDate} — {file.header?.endDate}
          </span>
          <button
            onClick={() => { setFile(null); setFileName(''); }}
            className="ml-auto font-mono text-audit-xs text-muted-foreground hover:text-foreground transition-colors duration-150"
          >
            [NOVO ARQUIVO]
          </button>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-auto">
          {renderView()}
        </div>
      </main>
    </div>
  );
};

export default Index;

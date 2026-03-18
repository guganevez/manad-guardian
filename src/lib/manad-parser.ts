// MANAD File Parser - Pipe-delimited text format

export interface MANADFile {
  header: Record0000 | null;
  accountant: Record0050 | null;
  technician: Record0100 | null;
  workers: RecordK050[];
  departments: RecordK100[];
  events: RecordK150[];
  syntheticData: RecordK250[];
  analyticData: RecordK300[];
  totals: RecordK990 | null;
  controlRecords: Record9900[];
  companyName: string;
  cnpj: string;
  year: string;
  totalLines: number;
}

export interface Record0000 {
  type: '0000';
  companyName: string;
  cnpj: string;
  state: string;
  stateRegistration: string;
  cityCode: string;
  zipCode: string;
  startDate: string;
  endDate: string;
  rawLine: string;
}

export interface Record0050 {
  type: '0050';
  name: string;
  cpf: string;
  crc: string;
  startDate: string;
  address: string;
  email: string;
  rawLine: string;
}

export interface Record0100 {
  type: '0100';
  name: string;
  role: string;
  startDate: string;
  endDate: string;
  cpf: string;
  email: string;
  rawLine: string;
}

export interface RecordK050 {
  type: 'K050';
  cnpj: string;
  startDate: string;
  employeeCode: string;
  cpf: string;
  pis: string;
  category: string;
  name: string;
  birthDate: string;
  admissionDate: string;
  terminationDate: string;
  rawLine: string;
}

export interface RecordK100 {
  type: 'K100';
  startDate: string;
  departmentCode: string;
  cnpj: string;
  departmentName: string;
  rawLine: string;
}

export interface RecordK150 {
  type: 'K150';
  cnpj: string;
  startDate: string;
  eventCode: string;
  eventName: string;
  rawLine: string;
}

export interface RecordK250 {
  type: 'K250';
  cnpj: string;
  indFl: string;
  departmentCode: string;
  employeeCode: string;
  period: string;
  paymentDate: string;
  category: string;
  categoryCode: string;
  role: string;
  dependents: string;
  dependentsIR: string;
  vlBaseIRRF: string;
  vlBasePS: string;
  rawLine: string;
}

export interface RecordK300 {
  type: 'K300';
  cnpj: string;
  indFl: string;
  departmentCode: string;
  employeeCode: string;
  period: string;
  eventCode: string;
  value: string;
  indRubr: string;
  indBaseIRRF: string;
  indBasePS: string;
  rawLine: string;
}

export interface RecordK990 {
  type: 'K990';
  totalRecords: number;
  rawLine: string;
}

export interface Record9900 {
  type: '9900';
  recordType: string;
  count: number;
  rawLine: string;
}

function parseDate(raw: string): string {
  if (!raw || raw.length < 8) return raw || '';
  return `${raw.substring(0, 2)}/${raw.substring(2, 4)}/${raw.substring(4, 8)}`;
}

function parsePeriod(raw: string): string {
  if (!raw || raw.length < 6) return raw || '';
  return `${raw.substring(0, 2)}/${raw.substring(2, 6)}`;
}

export function parseMANADFile(content: string): MANADFile {
  const lines = content.split('\n').filter(l => l.trim());
  
  const result: MANADFile = {
    header: null,
    accountant: null,
    technician: null,
    workers: [],
    departments: [],
    events: [],
    syntheticData: [],
    analyticData: [],
    totals: null,
    controlRecords: [],
    companyName: '',
    cnpj: '',
    year: '',
    totalLines: lines.length,
  };

  for (const line of lines) {
    const fields = line.split('|');
    const type = fields[0];

    switch (type) {
      case '0000':
        result.header = {
          type: '0000',
          companyName: fields[1] || '',
          cnpj: fields[2] || '',
          state: fields[7] || '',
          stateRegistration: fields[8] || '',
          cityCode: fields[9] || '',
          zipCode: fields[10] || '',
          startDate: parseDate(fields[12] || ''),
          endDate: parseDate(fields[13] || ''),
          rawLine: line,
        };
        result.companyName = fields[1] || '';
        result.cnpj = fields[2] || '';
        if (fields[13]) result.year = fields[13].substring(4, 8);
        break;

      case '0050':
        result.accountant = {
          type: '0050',
          name: fields[1] || '',
          cpf: fields[3] || '',
          crc: fields[4] || '',
          startDate: parseDate(fields[5] || ''),
          address: [fields[7], fields[8], fields[9], fields[10], fields[11]].filter(Boolean).join(', '),
          email: fields[17] || '',
          rawLine: line,
        };
        break;

      case '0100':
        result.technician = {
          type: '0100',
          name: fields[1] || '',
          role: fields[2] || '',
          startDate: parseDate(fields[3] || ''),
          endDate: parseDate(fields[4] || ''),
          cpf: fields[6] || '',
          email: fields[9] || '',
          rawLine: line,
        };
        break;

      case 'K050':
        result.workers.push({
          type: 'K050',
          cnpj: fields[1] || '',
          startDate: parseDate(fields[2] || ''),
          employeeCode: fields[3] || '',
          cpf: fields[4] || '',
          pis: fields[5] || '',
          category: fields[6] || '',
          name: fields[7] || '',
          birthDate: parseDate(fields[8] || ''),
          admissionDate: parseDate(fields[9] || ''),
          terminationDate: parseDate(fields[10] || ''),
          rawLine: line,
        });
        break;

      case 'K100':
        result.departments.push({
          type: 'K100',
          startDate: parseDate(fields[1] || ''),
          departmentCode: fields[2] || '',
          cnpj: fields[3] || '',
          departmentName: fields[4] || '',
          rawLine: line,
        });
        break;

      case 'K150':
        result.events.push({
          type: 'K150',
          cnpj: fields[1] || '',
          startDate: parseDate(fields[2] || ''),
          eventCode: fields[3] || '',
          eventName: fields[4] || '',
          rawLine: line,
        });
        break;

      case 'K250':
        result.syntheticData.push({
          type: 'K250',
          cnpj: fields[1] || '',
          indFl: fields[2] || '',
          departmentCode: fields[3] || '',
          employeeCode: fields[4] || '',
          period: parsePeriod(fields[5] || ''),
          paymentDate: parseDate(fields[6] || ''),
          category: fields[7] || '',
          categoryCode: fields[8] || '',
          role: fields[9] || '',
          dependents: fields[10] || '',
          dependentsIR: fields[11] || '',
          vlBaseIRRF: fields[12] || '',
          vlBasePS: fields[13] || '',
          rawLine: line,
        });
        break;

      case 'K300':
        result.analyticData.push({
          type: 'K300',
          cnpj: fields[1] || '',
          indFl: fields[2] || '',
          departmentCode: fields[3] || '',
          employeeCode: fields[4] || '',
          period: parsePeriod(fields[5] || ''),
          eventCode: fields[6] || '',
          value: fields[7] || '',
          indRubr: fields[8] || '',
          indBaseIRRF: fields[9] || '',
          indBasePS: fields[10] || '',
          rawLine: line,
        });
        break;

      case 'K990':
        result.totals = {
          type: 'K990',
          totalRecords: parseInt(fields[1] || '0'),
          rawLine: line,
        };
        break;

      case '9900':
        result.controlRecords.push({
          type: '9900',
          recordType: fields[1] || '',
          count: parseInt(fields[2] || '0'),
          rawLine: line,
        });
        break;
    }
  }

  return result;
}

export function formatCurrency(value: string): string {
  if (!value) return 'R$ 0,00';
  return `R$ ${value}`;
}

export const IND_FL_LABELS: Record<string, string> = {
  '1': 'Normal',
  '2': '13º Salário',
  '3': 'Férias',
  '4': 'Compl. Normal',
  '5': 'Compl. 13º',
};

export function getIndFlLabel(indFl: string): string {
  return IND_FL_LABELS[indFl] || `Outra (${indFl})`;
}

export const IND_RUBR_LABELS: Record<string, string> = {
  'P': 'Provento',
  'D': 'Desconto',
  'O': 'Outros',
};

export const IND_BASE_IRRF_LABELS: Record<string, string> = {
  '1': 'Base salário mensal',
  '2': 'Base 13º salário',
  '3': 'Não é base',
  '9': 'Outras bases',
};

export const IND_BASE_PS_LABELS: Record<string, string> = {
  '1': 'Base salário mensal',
  '2': 'Base 13º salário',
  '3': 'Não é base',
  '8': 'Outras bases',
  '9': 'Outras bases',
};

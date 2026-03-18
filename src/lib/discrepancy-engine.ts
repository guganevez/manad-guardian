// Engine for detecting discrepancies between K250 (synthetic bases) and K300 (analytic values)

import { MANADFile, RecordK250, RecordK300 } from './manad-parser';

export type DiscrepancyBaseType = 'IRRF' | 'PS';
export type DiscrepancyType =
  | 'missing_k300_irrf'
  | 'missing_k300_ps'
  | 'missing_k250_irrf'
  | 'missing_k250_ps'
  | 'sum_mismatch_irrf'
  | 'sum_mismatch_ps';

export interface Discrepancy {
  type: DiscrepancyType;
  baseType: DiscrepancyBaseType;
  severity: 'critical' | 'warning' | 'info';
  employeeCode: string;
  employeeName: string;
  departmentCode: string;
  period: string;
  indFl: string;
  description: string;
  k250Value?: string;
  k300Sum?: string;
  difference?: string;
}

export interface DiscrepancySummary {
  total: number;
  critical: number;
  warnings: number;
  info: number;
  discrepancies: Discrepancy[];
}

type K250Key = string;

function makeKey(employeeCode: string, departmentCode: string, period: string, indFl: string): K250Key {
  return `${employeeCode}|${departmentCode}|${period}|${indFl}`;
}

function parseValue(value: string): number {
  if (!value) return 0;
  return parseFloat(value.replace(',', '.')) || 0;
}

function sumK250Base(records: RecordK250[], field: 'vlBaseIRRF' | 'vlBasePS'): number {
  return records.reduce((sum, record) => sum + parseValue(record[field]), 0);
}

function hasIRRFBaseIndicator(indicator: string): boolean {
  return Boolean(indicator) && indicator !== '3';
}

function hasPSBaseIndicator(indicator: string): boolean {
  return Boolean(indicator) && indicator !== '3';
}

function getSignedK300Value(record: RecordK300): number {
  const value = parseValue(record.value);
  return record.indRubr === 'D' ? -value : value;
}

function summarizeK300Base(records: RecordK300[], predicate: (record: RecordK300) => boolean) {
  return records.reduce(
    (summary, record) => {
      if (!predicate(record)) return summary;

      summary.recordCount += 1;
      summary.total += getSignedK300Value(record);
      return summary;
    },
    { total: 0, recordCount: 0 },
  );
}

function getMismatchSeverity(referenceValue: number, difference: number): 'critical' | 'warning' {
  return difference > Math.max(referenceValue, 1) * 0.05 ? 'critical' : 'warning';
}

function createDiscrepancy(
  baseDiscrepancy: Omit<Discrepancy, 'employeeName'>,
  workerName: string,
): Discrepancy {
  return {
    ...baseDiscrepancy,
    employeeName: workerName,
  };
}

export function detectDiscrepancies(file: MANADFile): DiscrepancySummary {
  const workerMap = new Map<string, string>();
  file.workers.forEach((worker) => workerMap.set(worker.employeeCode, worker.name));

  const k250Map = new Map<K250Key, RecordK250[]>();
  for (const record of file.syntheticData) {
    const key = makeKey(record.employeeCode, record.departmentCode, record.period, record.indFl);
    const records = k250Map.get(key) || [];
    records.push(record);
    k250Map.set(key, records);
  }

  const k300Map = new Map<K250Key, RecordK300[]>();
  for (const record of file.analyticData) {
    const key = makeKey(record.employeeCode, record.departmentCode, record.period, record.indFl);
    const records = k300Map.get(key) || [];
    records.push(record);
    k300Map.set(key, records);
  }

  const discrepancies: Discrepancy[] = [];

  for (const [key, k250Records] of k250Map) {
    const [employeeCode, departmentCode, period, indFl] = key.split('|');
    const employeeName = workerMap.get(employeeCode) || employeeCode;
    const k300Records = k300Map.get(key) || [];

    const k250IRRF = sumK250Base(k250Records, 'vlBaseIRRF');
    const k250PS = sumK250Base(k250Records, 'vlBasePS');
    const k300IRRF = summarizeK300Base(k300Records, (record) => hasIRRFBaseIndicator(record.indBaseIRRF));
    const k300PS = summarizeK300Base(k300Records, (record) => hasPSBaseIndicator(record.indBasePS));

    if (k250IRRF > 0 && k300IRRF.recordCount === 0) {
      discrepancies.push(
        createDiscrepancy(
          {
            type: 'missing_k300_irrf',
            baseType: 'IRRF',
            severity: 'critical',
            employeeCode,
            departmentCode,
            period,
            indFl,
            description: 'Base IRRF do K250 sem itens K300 correspondentes.',
            k250Value: k250IRRF.toFixed(2),
          },
          employeeName,
        ),
      );
    } else if (k250IRRF > 0) {
      const difference = Math.abs(k250IRRF - k300IRRF.total);
      if (difference > 0.01) {
        discrepancies.push(
          createDiscrepancy(
            {
              type: 'sum_mismatch_irrf',
              baseType: 'IRRF',
              severity: getMismatchSeverity(k250IRRF, difference),
              employeeCode,
              departmentCode,
              period,
              indFl,
              description: 'Diferença entre a base IRRF do K250 e a soma dos itens K300 vinculados.',
              k250Value: k250IRRF.toFixed(2),
              k300Sum: k300IRRF.total.toFixed(2),
              difference: difference.toFixed(2),
            },
            employeeName,
          ),
        );
      }
    }

    if (k250PS > 0 && k300PS.recordCount === 0) {
      discrepancies.push(
        createDiscrepancy(
          {
            type: 'missing_k300_ps',
            baseType: 'PS',
            severity: 'critical',
            employeeCode,
            departmentCode,
            period,
            indFl,
            description: 'Base PS do K250 sem itens K300 correspondentes.',
            k250Value: k250PS.toFixed(2),
          },
          employeeName,
        ),
      );
    } else if (k250PS > 0) {
      const difference = Math.abs(k250PS - k300PS.total);
      if (difference > 0.01) {
        discrepancies.push(
          createDiscrepancy(
            {
              type: 'sum_mismatch_ps',
              baseType: 'PS',
              severity: getMismatchSeverity(k250PS, difference),
              employeeCode,
              departmentCode,
              period,
              indFl,
              description: 'Diferença entre a base PS do K250 e a soma dos itens K300 vinculados.',
              k250Value: k250PS.toFixed(2),
              k300Sum: k300PS.total.toFixed(2),
              difference: difference.toFixed(2),
            },
            employeeName,
          ),
        );
      }
    }
  }

  for (const [key, k300Records] of k300Map) {
    const [employeeCode, departmentCode, period, indFl] = key.split('|');
    const employeeName = workerMap.get(employeeCode) || employeeCode;
    const k250Records = k250Map.get(key) || [];

    const k250IRRF = sumK250Base(k250Records, 'vlBaseIRRF');
    const k250PS = sumK250Base(k250Records, 'vlBasePS');
    const k300IRRF = summarizeK300Base(k300Records, (record) => hasIRRFBaseIndicator(record.indBaseIRRF));
    const k300PS = summarizeK300Base(k300Records, (record) => hasPSBaseIndicator(record.indBasePS));

    if (k300IRRF.recordCount > 0 && k250IRRF <= 0) {
      discrepancies.push(
        createDiscrepancy(
          {
            type: 'missing_k250_irrf',
            baseType: 'IRRF',
            severity: 'warning',
            employeeCode,
            departmentCode,
            period,
            indFl,
            description: 'Itens K300 com base IRRF sem cabeçalho K250 correspondente.',
            k300Sum: k300IRRF.total.toFixed(2),
          },
          employeeName,
        ),
      );
    }

    if (k300PS.recordCount > 0 && k250PS <= 0) {
      discrepancies.push(
        createDiscrepancy(
          {
            type: 'missing_k250_ps',
            baseType: 'PS',
            severity: 'warning',
            employeeCode,
            departmentCode,
            period,
            indFl,
            description: 'Itens K300 com base PS sem cabeçalho K250 correspondente.',
            k300Sum: k300PS.total.toFixed(2),
          },
          employeeName,
        ),
      );
    }
  }

  const severityOrder = { critical: 0, warning: 1, info: 2 };
  discrepancies.sort((first, second) => severityOrder[first.severity] - severityOrder[second.severity]);

  return {
    total: discrepancies.length,
    critical: discrepancies.filter((discrepancy) => discrepancy.severity === 'critical').length,
    warnings: discrepancies.filter((discrepancy) => discrepancy.severity === 'warning').length,
    info: discrepancies.filter((discrepancy) => discrepancy.severity === 'info').length,
    discrepancies,
  };
}

// Cross-file comparison
export interface CrossFileComparison {
  file1Name: string;
  file2Name: string;
  workerDiff: { onlyIn1: string[]; onlyIn2: string[]; inBoth: number };
  departmentDiff: { onlyIn1: string[]; onlyIn2: string[]; inBoth: number };
  eventDiff: { onlyIn1: string[]; onlyIn2: string[]; inBoth: number };
  totalValuesDiff: {
    file1Total: number;
    file2Total: number;
    difference: number;
    percentChange: number;
  };
}

export function compareFiles(file1: MANADFile, file1Name: string, file2: MANADFile, file2Name: string): CrossFileComparison {
  const workers1 = new Set(file1.workers.map((worker) => worker.cpf));
  const workers2 = new Set(file2.workers.map((worker) => worker.cpf));

  const departments1 = new Set(file1.departments.map((department) => department.departmentCode));
  const departments2 = new Set(file2.departments.map((department) => department.departmentCode));

  const events1 = new Set(file1.events.map((event) => event.eventCode));
  const events2 = new Set(file2.events.map((event) => event.eventCode));

  const setDiff = (first: Set<string>, second: Set<string>) => ({
    onlyIn1: [...first].filter((value) => !second.has(value)),
    onlyIn2: [...second].filter((value) => !first.has(value)),
    inBoth: [...first].filter((value) => second.has(value)).length,
  });

  const total1 = file1.syntheticData.reduce((sum, record) => sum + parseValue(record.vlBasePS), 0);
  const total2 = file2.syntheticData.reduce((sum, record) => sum + parseValue(record.vlBasePS), 0);
  const difference = total2 - total1;

  return {
    file1Name,
    file2Name,
    workerDiff: setDiff(workers1, workers2),
    departmentDiff: setDiff(departments1, departments2),
    eventDiff: setDiff(events1, events2),
    totalValuesDiff: {
      file1Total: total1,
      file2Total: total2,
      difference,
      percentChange: total1 > 0 ? (difference / total1) * 100 : 0,
    },
  };
}

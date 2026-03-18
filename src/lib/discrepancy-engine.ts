// Engine for detecting discrepancies between K250 (synthetic bases) and K300 (analytic values)

import { MANADFile, RecordK250, RecordK300 } from './manad-parser';

export interface Discrepancy {
  type: 'missing_k300' | 'missing_k250' | 'value_mismatch' | 'sum_mismatch';
  severity: 'critical' | 'warning' | 'info';
  employeeCode: string;
  employeeName: string;
  departmentCode: string;
  period: string;
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

function makeKey(employeeCode: string, departmentCode: string, period: string): K250Key {
  return `${employeeCode}|${departmentCode}|${period}`;
}

function parseValue(v: string): number {
  if (!v) return 0;
  return parseFloat(v.replace(',', '.')) || 0;
}

export function detectDiscrepancies(file: MANADFile): DiscrepancySummary {
  const workerMap = new Map<string, string>();
  file.workers.forEach(w => workerMap.set(w.employeeCode, w.name));

  // Group K250 by employee+dept+period
  const k250Map = new Map<K250Key, RecordK250[]>();
  for (const r of file.syntheticData) {
    const key = makeKey(r.employeeCode, r.departmentCode, r.period);
    const arr = k250Map.get(key) || [];
    arr.push(r);
    k250Map.set(key, arr);
  }

  // Group K300 by employee+dept+period
  const k300Map = new Map<K250Key, RecordK300[]>();
  for (const r of file.analyticData) {
    const key = makeKey(r.employeeCode, r.departmentCode, r.period);
    const arr = k300Map.get(key) || [];
    arr.push(r);
    k300Map.set(key, arr);
  }

  const discrepancies: Discrepancy[] = [];

  // Check K250 records that have no K300 counterparts
  for (const [key, k250Records] of k250Map) {
    const [empCode, deptCode, period] = key.split('|');
    const k300Records = k300Map.get(key);

    if (!k300Records || k300Records.length === 0) {
      discrepancies.push({
        type: 'missing_k300',
        severity: 'critical',
        employeeCode: empCode,
        employeeName: workerMap.get(empCode) || empCode,
        departmentCode: deptCode,
        period,
        description: 'Base sintética (K250) sem valores analíticos (K300) correspondentes',
        k250Value: k250Records[0]?.totalValue,
      });
      continue;
    }

    // Compare total: sum of K300 proventos - descontos vs K250 totalValue
    for (const k250 of k250Records) {
      const totalK250 = parseValue(k250.totalValue);
      const sumK300Proventos = k300Records
        .filter(r => r.type_flag === 'P')
        .reduce((s, r) => s + parseValue(r.value), 0);
      const sumK300Descontos = k300Records
        .filter(r => r.type_flag === 'D')
        .reduce((s, r) => s + parseValue(r.value), 0);
      const sumK300 = sumK300Proventos + sumK300Descontos; // K300 values already include sign

      // Also check raw sum of all K300 values
      const rawSumK300 = k300Records.reduce((s, r) => s + parseValue(r.value), 0);

      const diff = Math.abs(totalK250 - rawSumK300);
      if (diff > 0.01 && totalK250 > 0) {
        discrepancies.push({
          type: 'sum_mismatch',
          severity: diff > totalK250 * 0.05 ? 'critical' : 'warning',
          employeeCode: empCode,
          employeeName: workerMap.get(empCode) || empCode,
          departmentCode: deptCode,
          period,
          description: `Diferença entre total K250 e soma K300: R$ ${diff.toFixed(2)}`,
          k250Value: totalK250.toFixed(2),
          k300Sum: rawSumK300.toFixed(2),
          difference: diff.toFixed(2),
        });
      }
    }
  }

  // Check K300 records that have no K250 counterpart
  for (const [key] of k300Map) {
    if (!k250Map.has(key)) {
      const [empCode, deptCode, period] = key.split('|');
      discrepancies.push({
        type: 'missing_k250',
        severity: 'warning',
        employeeCode: empCode,
        employeeName: workerMap.get(empCode) || empCode,
        departmentCode: deptCode,
        period,
        description: 'Valores analíticos (K300) sem base sintética (K250) correspondente',
      });
    }
  }

  // Sort: critical first
  const severityOrder = { critical: 0, warning: 1, info: 2 };
  discrepancies.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  return {
    total: discrepancies.length,
    critical: discrepancies.filter(d => d.severity === 'critical').length,
    warnings: discrepancies.filter(d => d.severity === 'warning').length,
    info: discrepancies.filter(d => d.severity === 'info').length,
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
  const workers1 = new Set(file1.workers.map(w => w.cpf));
  const workers2 = new Set(file2.workers.map(w => w.cpf));

  const depts1 = new Set(file1.departments.map(d => d.departmentCode));
  const depts2 = new Set(file2.departments.map(d => d.departmentCode));

  const events1 = new Set(file1.events.map(e => e.eventCode));
  const events2 = new Set(file2.events.map(e => e.eventCode));

  const setDiff = (a: Set<string>, b: Set<string>) => ({
    onlyIn1: [...a].filter(x => !b.has(x)),
    onlyIn2: [...b].filter(x => !a.has(x)),
    inBoth: [...a].filter(x => b.has(x)).length,
  });

  const total1 = file1.syntheticData.reduce((s, r) => s + parseValue(r.totalValue), 0);
  const total2 = file2.syntheticData.reduce((s, r) => s + parseValue(r.totalValue), 0);
  const diff = total2 - total1;

  return {
    file1Name,
    file2Name,
    workerDiff: setDiff(workers1, workers2),
    departmentDiff: setDiff(depts1, depts2),
    eventDiff: setDiff(events1, events2),
    totalValuesDiff: {
      file1Total: total1,
      file2Total: total2,
      difference: diff,
      percentChange: total1 > 0 ? (diff / total1) * 100 : 0,
    },
  };
}

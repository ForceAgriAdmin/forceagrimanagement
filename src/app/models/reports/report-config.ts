export interface ReportConfig {
  columns: { label: string }[];
  rows: any[];
  fileName: string;
  from: Date;
  to: Date;
  employeeNumber?: string;
  logoUrl?: string;
  reportName: string;
  isWorkerReport?: boolean;
  workerName?: string;
  operationName?: string;
}

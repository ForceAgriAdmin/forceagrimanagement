export interface ReportColumn {
  label: string;
}

export interface ReportConfig {
  reportName: string;
  from: Date;
  to: Date;
  logoUrl: string;
  columns: ReportColumn[];
  rows: any[];
  fileName: string;
  employeeNumber:  string;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error';
  message: string;
  module?: string;
}

export interface BuildSummary {
  id: string;
  projectName: string;
  status: 'success' | 'failed' | 'in_progress';
  durationSeconds: number;
  totalErrors: number;
  totalWarnings: number;
  timestamp: string;
  logs: LogEntry[];
}
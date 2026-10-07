export interface CompatIssue {
  ruleId : string
  severity: 'error' | 'warning'
  message: string
}
import { Timestamp } from "@angular/fire/firestore";
import { FieldConfig } from "./fieldconfig";
import { Association } from "./association";

export interface AppGenericReport {
  id: string;
  name: string;
  description: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  summary: Boolean;
  isWorkerReport: Boolean;
  isOperationReport: Boolean;
  isTransactionTypeReport: Boolean; 
}
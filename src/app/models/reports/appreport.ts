import { Timestamp } from "@angular/fire/firestore";
import { FieldConfig } from "./fieldconfig";
import { Association } from "./association";

export interface AppReport {
  id: string;
  name: string;
  description: string;
  associations: Association[];
  fields: FieldConfig[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
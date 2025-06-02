import { Timestamp } from "@angular/fire/firestore";

export interface PaymentGroupRecord {
  id: string;
  description: string;
  workerIds: string[];
  createdAt: Timestamp;
}
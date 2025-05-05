import { Timestamp } from "@angular/fire/firestore";

export interface TransactionModel {
    timestamp: Timestamp;
    amount: number;
    description: string;
    operationId: string;
    creatorId: string;
    transactionTypeId: string;
    workerId: string;
  }
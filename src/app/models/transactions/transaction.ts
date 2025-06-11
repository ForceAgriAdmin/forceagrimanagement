import { Timestamp } from "@angular/fire/firestore";

export interface TransactionModel {
    id: string;
    timestamp: Timestamp;
    amount: number;
    description: string;
    farmId: string;
    creatorId: string;
    transactionTypeId: string;
    function:string;
    workerTypesIds: string[];   
    operationIds: string[];
    workerIds: string[];
    paymentGroupIds: string[];
  }
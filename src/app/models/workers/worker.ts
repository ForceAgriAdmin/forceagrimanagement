import { Timestamp } from 'firebase/firestore';

export interface WorkerModel {
  id: string;
  firstName: string;
  lastName: string;
  farmId: string;
  currentBalance: number; 
  operationId: string;
  profileImageUrl: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

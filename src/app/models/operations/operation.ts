import { Timestamp } from 'firebase/firestore';

export interface OperationModel {
    id: string;
    description: string;
    name: string;
    createdAt: Timestamp;
      updatedAt: Timestamp;
}
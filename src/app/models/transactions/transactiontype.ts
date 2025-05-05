import { Timestamp } from 'firebase/firestore';
export interface TransactionTypeModel {
    id: string;
    name: string;
    description: string;
    isCredit: boolean;
    createdAt: Timestamp;
    updatedAt: Timestamp;

}
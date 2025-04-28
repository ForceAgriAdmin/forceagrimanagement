import { Timestamp } from 'firebase/firestore';

export interface FarmModel {
  id: string;
  name: string;
  location: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

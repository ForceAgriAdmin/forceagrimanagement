import { Timestamp } from "@angular/fire/firestore";

export interface AppUser {
    uid: string;
    email: string;
    displayName: string;
    createdAt: Timestamp;
    farmId:string;
    roles: string[];
  }
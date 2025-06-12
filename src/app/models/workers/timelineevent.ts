import { Timestamp } from "@google-cloud/firestore";

export interface TimelineEvent {
    id: string;
    workerId: string;
    actionDate: Timestamp;
    title: string;
    description: string;
    icon: string;
  }
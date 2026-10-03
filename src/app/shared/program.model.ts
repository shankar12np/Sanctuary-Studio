import { Timestamp } from '@angular/fire/firestore';

// A single program/course offering, managed entirely from the admin
// dashboard (Firestore collection "programs") so new offerings can be
// added without any code changes. `order` controls display order on
// both the Programs page and the home page teaser (lower = earlier).
export interface Program {
  id?: string;
  badge: string;
  title: string;
  description: string;
  bullets: string[];
  order: number;
  createdAt: Timestamp;
}

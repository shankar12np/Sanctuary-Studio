import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Meta } from '@angular/platform-browser';
import {
  Firestore,
  collection,
  collectionData,
  doc,
  docData,
  orderBy,
  query,
  limit,
  setDoc,
  serverTimestamp,
  Timestamp,
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { looksLikeSpam, isValidPhone } from '../../shared/spam-guard';

interface PublicEntry {
  id?: string;
  childName: string;
  school: string;
  grade: string;
  createdAt: Timestamp;
}

interface LatestWinner {
  entryId: string;
  childName: string;
  school: string;
  grade: string;
  writingTitle: string;
  writingText: string;
  announcedAt: Timestamp;
}

@Component({
  selector: 'app-competition',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './competition.html',
  styleUrl: './competition.scss',
})
export class Competition implements OnInit {
  private firestore = inject(Firestore);
  private meta = inject(Meta);

  recentEntries$: Observable<PublicEntry[]>;
  latestWinner$: Observable<LatestWinner | undefined>;

  childName = '';
  school = '';
  grade = '';
  writingTitle = '';
  writingText = '';
  parentName = '';
  parentPhone = '';
  parentEmail = '';
  honeypot = '';

  submitted = false;
  submitting = false;
  error = '';

  // Used for the "submitted too fast" spam check below.
  private readonly formRenderedAt = Date.now();

  constructor() {
    const entriesRef = collection(this.firestore, 'competition_entries');
    const entriesQuery = query(entriesRef, orderBy('createdAt', 'desc'), limit(20));
    this.recentEntries$ = collectionData(entriesQuery, { idField: 'id' }) as Observable<PublicEntry[]>;

    this.latestWinner$ = docData(doc(this.firestore, 'site_meta', 'latest_winner')) as Observable<LatestWinner | undefined>;
  }

  ngOnInit() {
    this.meta.updateTag({
      name: 'description',
      content: "Enter Sanctuary Studio's Kids' Writing Competition — held every 6 months, NPR 1,000 prize, open to Kindergarten through Middle School students in Kathmandu.",
    });
  }

  async onSubmit() {
    this.error = '';

    if (looksLikeSpam(this.honeypot, this.formRenderedAt)) {
      // Quietly treat this as a success without writing anything, rather
      // than showing an error that would tip off a bot that it was caught.
      this.submitted = true;
      return;
    }

    if (!this.childName.trim() || !this.school.trim() || !this.grade.trim() || !this.writingText.trim()) {
      this.error = "Please fill in your child's name, school, grade, and the writing entry.";
      return;
    }

    if (!this.parentName.trim() || !this.parentPhone.trim()) {
      this.error = "Please add a parent/guardian name and phone number so we can reach you if your child wins.";
      return;
    }

    if (!isValidPhone(this.parentPhone)) {
      this.error = 'Please enter a valid phone number for the parent/guardian.';
      return;
    }

    this.submitting = true;

    try {
      // Share one ID across a public doc (name + school, shown on this page)
      // and a private doc (parent contact details, admin-only).
      const publicRef = doc(collection(this.firestore, 'competition_entries'));
      const entryId = publicRef.id;

      await setDoc(publicRef, {
        childName: this.childName,
        school: this.school,
        grade: this.grade,
        writingTitle: this.writingTitle,
        writingText: this.writingText,
        createdAt: serverTimestamp(),
      });

      await setDoc(doc(this.firestore, 'competition_entries_private', entryId), {
        parentName: this.parentName,
        parentPhone: this.parentPhone,
        parentEmail: this.parentEmail,
        createdAt: serverTimestamp(),
      });

      this.submitted = true;
    } catch {
      this.error = 'Something went wrong submitting your entry. Please try again or contact us directly.';
    } finally {
      this.submitting = false;
    }
  }
}

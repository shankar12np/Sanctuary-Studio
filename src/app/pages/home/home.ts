import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Meta } from '@angular/platform-browser';
import { Firestore, collection, collectionData, doc, docData, orderBy, query, limit, Timestamp } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { Program } from '../../shared/program.model';

interface LivePhoto {
  id?: string;
  url: string;
  caption: string;
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
  selector: 'app-home',
  imports: [CommonModule, RouterLink],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home implements OnInit {
  private meta = inject(Meta);
  private firestore = inject(Firestore);

  recentPhotos$: Observable<LivePhoto[]>;
  latestWinner$: Observable<LatestWinner | undefined>;
  featuredPrograms$: Observable<Program[]>;

  constructor() {
    const photosRef = collection(this.firestore, 'gallery_photos');
    const photosQuery = query(photosRef, orderBy('createdAt', 'desc'), limit(3));
    this.recentPhotos$ = collectionData(photosQuery, { idField: 'id' }) as Observable<LivePhoto[]>;

    this.latestWinner$ = docData(doc(this.firestore, 'site_meta', 'latest_winner')) as Observable<LatestWinner | undefined>;

    const programsRef = collection(this.firestore, 'programs');
    const programsQuery = query(programsRef, orderBy('order', 'asc'), limit(3));
    this.featuredPrograms$ = collectionData(programsQuery, { idField: 'id' }) as Observable<Program[]>;
  }

  excerpt(text: string, maxLength = 220): string {
    if (!text) return '';
    return text.length <= maxLength ? text : text.slice(0, maxLength).trimEnd() + '…';
  }

  ngOnInit() {
    this.meta.updateTag({
      name: 'description',
      content: 'Sanctuary Studio is a bright, warm learning centre for Kindergarten to Middle School students in Kathmandu, Nepal. Admissions now open.',
    });
  }
}

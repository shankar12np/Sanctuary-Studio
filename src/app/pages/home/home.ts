import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Meta } from '@angular/platform-browser';
import { Firestore, collection, collectionData, orderBy, query, limit, Timestamp } from '@angular/fire/firestore';
import { Observable } from 'rxjs';

interface LivePhoto {
  id?: string;
  url: string;
  caption: string;
  createdAt: Timestamp;
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

  constructor() {
    const photosRef = collection(this.firestore, 'gallery_photos');
    const photosQuery = query(photosRef, orderBy('createdAt', 'desc'), limit(3));
    this.recentPhotos$ = collectionData(photosQuery, { idField: 'id' }) as Observable<LivePhoto[]>;
  }

  ngOnInit() {
    this.meta.updateTag({
      name: 'description',
      content: 'Sanctuary Studio is a bright, warm learning centre for Kindergarten to Middle School students in Kathmandu, Nepal. Admissions now open.',
    });
  }
}

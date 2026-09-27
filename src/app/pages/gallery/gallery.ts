import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Meta } from '@angular/platform-browser';
import { Firestore, collection, collectionData, orderBy, query, Timestamp } from '@angular/fire/firestore';
import { Observable } from 'rxjs';

interface GalleryPhoto {
  src: string;
  alt: string;
}

interface LivePhoto {
  id?: string;
  url: string;
  caption: string;
  createdAt: Timestamp;
}

@Component({
  selector: 'app-gallery',
  imports: [CommonModule],
  templateUrl: './gallery.html',
  styleUrl: './gallery.scss',
})
export class Gallery implements OnInit {
  private meta = inject(Meta);
  private firestore = inject(Firestore);

  photos: GalleryPhoto[] = [
    { src: 'images/gallery/sanctuary1.png', alt: 'Sanctuary Studio classroom' },
    { src: 'images/gallery/sanctuary2.jpeg', alt: 'Sanctuary Studio activity' },
    { src: 'images/gallery/walking.jpg', alt: 'Sanctuary Studio students' },
  ];

  recentPhotos$: Observable<LivePhoto[]>;

  constructor() {
    const photosRef = collection(this.firestore, 'gallery_photos');
    const photosQuery = query(photosRef, orderBy('createdAt', 'desc'));
    this.recentPhotos$ = collectionData(photosQuery, { idField: 'id' }) as Observable<LivePhoto[]>;
  }

  ngOnInit() {
    this.meta.updateTag({
      name: 'description',
      content: 'A look inside Sanctuary Studio — photos of our classrooms and recent student activities at our Kathmandu learning centre.',
    });
  }
}

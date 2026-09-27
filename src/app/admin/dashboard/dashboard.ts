import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Auth, signOut } from '@angular/fire/auth';
import {
  Firestore,
  collection,
  collectionData,
  orderBy,
  query,
  Timestamp,
  addDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';

interface Inquiry {
  id?: string;
  name: string;
  childAge: string;
  phone: string;
  email: string;
  message: string;
  createdAt: Timestamp;
}

interface GalleryPhoto {
  id?: string;
  url: string;
  caption: string;
  createdAt: Timestamp;
}

@Component({
  selector: 'app-admin-dashboard',
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class AdminDashboard {
  private auth = inject(Auth);
  private router = inject(Router);
  private firestore = inject(Firestore);

  private readonly CLOUDINARY_CLOUD_NAME = 'qej2aydz';
  private readonly CLOUDINARY_UPLOAD_PRESET = 'sanctuary_gallery';

  inquiries$: Observable<Inquiry[]>;
  photos$: Observable<GalleryPhoto[]>;

  selectedFile: File | null = null;
  caption = '';
  uploading = false;
  uploadError = '';

  constructor() {
    const inquiriesRef = collection(this.firestore, 'inquiries');
    const inquiriesQuery = query(inquiriesRef, orderBy('createdAt', 'desc'));
    this.inquiries$ = collectionData(inquiriesQuery, { idField: 'id' }) as Observable<Inquiry[]>;

    const photosRef = collection(this.firestore, 'gallery_photos');
    const photosQuery = query(photosRef, orderBy('createdAt', 'desc'));
    this.photos$ = collectionData(photosQuery, { idField: 'id' }) as Observable<GalleryPhoto[]>;
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    this.selectedFile = input.files && input.files.length > 0 ? input.files[0] : null;
  }

  async uploadPhoto() {
    this.uploadError = '';

    if (!this.selectedFile) {
      this.uploadError = 'Please choose a photo first.';
      return;
    }

    this.uploading = true;

    try {
      const formData = new FormData();
      formData.append('file', this.selectedFile);
      formData.append('upload_preset', this.CLOUDINARY_UPLOAD_PRESET);

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${this.CLOUDINARY_CLOUD_NAME}/image/upload`,
        { method: 'POST', body: formData }
      );

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();

      await addDoc(collection(this.firestore, 'gallery_photos'), {
        url: data.secure_url,
        caption: this.caption,
        createdAt: serverTimestamp(),
      });

      this.selectedFile = null;
      this.caption = '';
      const fileInput = document.getElementById('photo-file-input') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    } catch {
      this.uploadError = 'Something went wrong uploading that photo. Please try again.';
    } finally {
      this.uploading = false;
    }
  }

  async deletePhoto(photo: GalleryPhoto) {
    if (!photo.id) return;
    const confirmed = confirm('Remove this photo from the gallery?');
    if (!confirmed) return;
    await deleteDoc(doc(this.firestore, 'gallery_photos', photo.id));
  }

  async logout() {
    await signOut(this.auth);
    this.router.navigate(['/admin']);
  }
}

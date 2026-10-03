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
  docData,
  setDoc,
  updateDoc,
  serverTimestamp,
} from '@angular/fire/firestore';
import { Observable, combineLatest, map } from 'rxjs';
import { Program } from '../../shared/program.model';

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

interface CompetitionEntryPublic {
  id: string;
  childName: string;
  school: string;
  grade: string;
  writingTitle: string;
  writingText: string;
  createdAt: Timestamp;
}

interface CompetitionEntryPrivate {
  id: string;
  parentName: string;
  parentPhone: string;
  parentEmail: string;
}

interface CompetitionEntry extends CompetitionEntryPublic {
  parentName?: string;
  parentPhone?: string;
  parentEmail?: string;
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
  competitionEntries$: Observable<CompetitionEntry[]>;
  latestWinner$: Observable<LatestWinner | undefined>;
  programs$: Observable<Program[]>;

  selectedFile: File | null = null;
  caption = '';
  uploading = false;
  uploadError = '';

  // Programs admin form — same fields used for both adding a new program
  // and editing an existing one (editingProgramId tracks which).
  editingProgramId: string | null = null;
  programBadge = '';
  programTitle = '';
  programDescription = '';
  programBullets = '';
  programSaving = false;
  programError = '';

  constructor() {
    const inquiriesRef = collection(this.firestore, 'inquiries');
    const inquiriesQuery = query(inquiriesRef, orderBy('createdAt', 'desc'));
    this.inquiries$ = collectionData(inquiriesQuery, { idField: 'id' }) as Observable<Inquiry[]>;

    const photosRef = collection(this.firestore, 'gallery_photos');
    const photosQuery = query(photosRef, orderBy('createdAt', 'desc'));
    this.photos$ = collectionData(photosQuery, { idField: 'id' }) as Observable<GalleryPhoto[]>;

    const entriesRef = collection(this.firestore, 'competition_entries');
    const entriesQuery = query(entriesRef, orderBy('createdAt', 'desc'));
    const publicEntries$ = collectionData(entriesQuery, { idField: 'id' }) as Observable<CompetitionEntryPublic[]>;

    const privateRef = collection(this.firestore, 'competition_entries_private');
    const privateEntries$ = collectionData(privateRef, { idField: 'id' }) as Observable<CompetitionEntryPrivate[]>;

    // Public (name/school/writing) and private (parent contact) docs share
    // the same id, written together at submission time. Merge them here so
    // staff see the full picture; the public competition page only ever
    // reads the public collection.
    this.competitionEntries$ = combineLatest([publicEntries$, privateEntries$]).pipe(
      map(([publicEntries, privateEntries]) => {
        const privateById = new Map(privateEntries.map((p) => [p.id, p]));
        return publicEntries.map((entry) => ({
          ...entry,
          parentName: privateById.get(entry.id)?.parentName,
          parentPhone: privateById.get(entry.id)?.parentPhone,
          parentEmail: privateById.get(entry.id)?.parentEmail,
        }));
      })
    );

    this.latestWinner$ = docData(doc(this.firestore, 'site_meta', 'latest_winner')) as Observable<LatestWinner | undefined>;

    const programsRef = collection(this.firestore, 'programs');
    const programsQuery = query(programsRef, orderBy('order', 'asc'));
    this.programs$ = collectionData(programsQuery, { idField: 'id' }) as Observable<Program[]>;
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

  async deleteCompetitionEntry(entry: CompetitionEntry, currentWinner: LatestWinner | null | undefined) {
    const isFeaturedWinner = currentWinner?.entryId === entry.id;

    const confirmed = confirm(
      isFeaturedWinner
        ? `${entry.childName} is currently featured as the latest winner on the home page. Removing this entry will also clear that spotlight. Continue?`
        : `Remove ${entry.childName}'s competition entry? This also removes their parent contact info.`
    );
    if (!confirmed) return;

    await deleteDoc(doc(this.firestore, 'competition_entries', entry.id));
    await deleteDoc(doc(this.firestore, 'competition_entries_private', entry.id));

    if (isFeaturedWinner) {
      await deleteDoc(doc(this.firestore, 'site_meta', 'latest_winner'));
    }
  }

  async markAsWinner(entry: CompetitionEntry) {
    const confirmed = confirm(`Feature ${entry.childName} as the latest winner on the home page?`);
    if (!confirmed) return;

    await setDoc(doc(this.firestore, 'site_meta', 'latest_winner'), {
      entryId: entry.id,
      childName: entry.childName,
      school: entry.school,
      grade: entry.grade,
      writingTitle: entry.writingTitle,
      writingText: entry.writingText,
      announcedAt: serverTimestamp(),
    });
  }

  editProgram(program: Program) {
    this.editingProgramId = program.id ?? null;
    this.programBadge = program.badge;
    this.programTitle = program.title;
    this.programDescription = program.description;
    this.programBullets = (program.bullets || []).join('\n');
    this.programError = '';
  }

  cancelEditProgram() {
    this.editingProgramId = null;
    this.programBadge = '';
    this.programTitle = '';
    this.programDescription = '';
    this.programBullets = '';
    this.programError = '';
  }

  async saveProgram(existingPrograms: Program[]) {
    this.programError = '';

    if (!this.programBadge.trim() || !this.programTitle.trim() || !this.programDescription.trim()) {
      this.programError = 'Please fill in the badge, title, and description.';
      return;
    }

    this.programSaving = true;

    const bullets = this.programBullets
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    try {
      if (this.editingProgramId) {
        await updateDoc(doc(this.firestore, 'programs', this.editingProgramId), {
          badge: this.programBadge,
          title: this.programTitle,
          description: this.programDescription,
          bullets,
        });
      } else {
        const nextOrder = existingPrograms.length > 0
          ? Math.max(...existingPrograms.map((p) => p.order ?? 0)) + 1
          : 0;

        await addDoc(collection(this.firestore, 'programs'), {
          badge: this.programBadge,
          title: this.programTitle,
          description: this.programDescription,
          bullets,
          order: nextOrder,
          createdAt: serverTimestamp(),
        });
      }

      this.cancelEditProgram();
    } catch {
      this.programError = 'Something went wrong saving that program. Please try again.';
    } finally {
      this.programSaving = false;
    }
  }

  async deleteProgram(program: Program) {
    if (!program.id) return;
    const confirmed = confirm(`Remove "${program.title}" from the Programs page?`);
    if (!confirmed) return;
    await deleteDoc(doc(this.firestore, 'programs', program.id));
    if (this.editingProgramId === program.id) {
      this.cancelEditProgram();
    }
  }

  async moveProgram(program: Program, direction: 'up' | 'down', programs: Program[]) {
    const index = programs.findIndex((p) => p.id === program.id);
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    if (index === -1 || swapIndex < 0 || swapIndex >= programs.length) return;

    const neighbor = programs[swapIndex];
    if (!program.id || !neighbor.id) return;

    await updateDoc(doc(this.firestore, 'programs', program.id), { order: neighbor.order });
    await updateDoc(doc(this.firestore, 'programs', neighbor.id), { order: program.order });
  }

  async logout() {
    await signOut(this.auth);
    this.router.navigate(['/admin']);
  }
}

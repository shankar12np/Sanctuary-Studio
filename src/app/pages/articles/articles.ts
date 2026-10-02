import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Meta } from '@angular/platform-browser';
import { Firestore, collection, collectionData, orderBy, query, Timestamp } from '@angular/fire/firestore';
import { Observable, map } from 'rxjs';
import { roundKey, roundLabel, compareRoundsDesc } from '../../shared/competition-round';

interface Entry {
  id?: string;
  childName: string;
  school: string;
  grade: string;
  writingTitle: string;
  writingText: string;
  createdAt: Timestamp;
}

interface RoundGroup {
  key: string;
  label: string;
  entries: Entry[];
}

@Component({
  selector: 'app-articles',
  imports: [CommonModule],
  templateUrl: './articles.html',
  styleUrl: './articles.scss',
})
export class Articles implements OnInit {
  private firestore = inject(Firestore);
  private meta = inject(Meta);

  rounds$: Observable<RoundGroup[]>;
  selectedRound = '';

  ngOnInit() {
    this.meta.updateTag({
      name: 'description',
      content: "Read every entry submitted to Sanctuary Studio's Kids' Writing Competition, organized by round.",
    });
  }

  constructor() {
    const entriesRef = collection(this.firestore, 'competition_entries');
    const entriesQuery = query(entriesRef, orderBy('createdAt', 'desc'));
    const entries$ = collectionData(entriesQuery, { idField: 'id' }) as Observable<Entry[]>;

    this.rounds$ = entries$.pipe(
      map((entries) => {
        const byRound = new Map<string, Entry[]>();
        for (const entry of entries) {
          const key = entry.createdAt ? roundKey(entry.createdAt.toDate()) : roundKey(new Date());
          if (!byRound.has(key)) byRound.set(key, []);
          byRound.get(key)!.push(entry);
        }

        const groups: RoundGroup[] = Array.from(byRound.entries())
          .map(([key, groupEntries]) => ({ key, label: roundLabel(key), entries: groupEntries }))
          .sort((a, b) => compareRoundsDesc(a.key, b.key));

        if (!this.selectedRound && groups.length > 0) {
          this.selectedRound = groups[0].key;
        }

        return groups;
      })
    );
  }

  selectRound(key: string) {
    this.selectedRound = key;
  }
}

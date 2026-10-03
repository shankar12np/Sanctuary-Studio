import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Meta } from '@angular/platform-browser';
import { Firestore, collection, collectionData, orderBy, query } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { Program } from '../../shared/program.model';

@Component({
  selector: 'app-programs',
  imports: [CommonModule, RouterLink],
  templateUrl: './programs.html',
  styleUrl: './programs.scss'
})
export class Programs implements OnInit {
  private meta = inject(Meta);
  private firestore = inject(Firestore);

  programs$: Observable<Program[]>;

  constructor() {
    const programsRef = collection(this.firestore, 'programs');
    const programsQuery = query(programsRef, orderBy('order', 'asc'));
    this.programs$ = collectionData(programsQuery, { idField: 'id' }) as Observable<Program[]>;
  }

  ngOnInit() {
    this.meta.updateTag({
      name: 'description',
      content: 'Explore Sanctuary Studio\'s programs for Kindergarten, Primary, and Middle School students in Kathmandu — bright classrooms, caring teachers, a well-rounded curriculum.',
    });
  }
}

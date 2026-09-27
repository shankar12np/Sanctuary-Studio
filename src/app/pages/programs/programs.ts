import { Component, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Meta } from '@angular/platform-browser';

@Component({
  selector: 'app-programs',
  imports: [RouterLink],
  templateUrl: './programs.html',
  styleUrl: './programs.scss'
})
export class Programs implements OnInit {
  private meta = inject(Meta);

  ngOnInit() {
    this.meta.updateTag({
      name: 'description',
      content: 'Explore Sanctuary Studio\'s programs for Kindergarten, Primary, and Middle School students in Kathmandu — bright classrooms, caring teachers, a well-rounded curriculum.',
    });
  }
}

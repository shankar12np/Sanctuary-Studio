import { Component, inject, OnInit } from '@angular/core';
import { Meta } from '@angular/platform-browser';

@Component({
  selector: 'app-about',
  imports: [],
  templateUrl: './about.html',
  styleUrl: './about.scss',
})
export class About implements OnInit {
  private meta = inject(Meta);

  ngOnInit() {
    this.meta.updateTag({
      name: 'description',
      content: 'Learn about Sanctuary Studio\'s mission and values — a warm, safe learning centre for Kindergarten to Middle School students in Kathmandu, Nepal.',
    });
  }
}

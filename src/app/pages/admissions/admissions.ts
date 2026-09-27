import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Firestore, collection, addDoc, serverTimestamp } from '@angular/fire/firestore';
import { Meta } from '@angular/platform-browser';
import emailjs from '@emailjs/browser';

@Component({
  selector: 'app-admissions',
  imports: [CommonModule, FormsModule],
  templateUrl: './admissions.html',
  styleUrl: './admissions.scss',
})
export class Admissions implements OnInit {
  private firestore = inject(Firestore);
  private meta = inject(Meta);

  private readonly EMAILJS_SERVICE_ID = 'service_53lwcbr';
  private readonly EMAILJS_TEMPLATE_ID = 'template_4pw628t';
  private readonly EMAILJS_PUBLIC_KEY = 'r6ayBfVXz-Yvi6DYT';

  name = '';
  childAge = '';
  phone = '';
  email = '';
  message = '';
  submitted = false;
  error = '';
  submitting = false;

  ngOnInit() {
    this.meta.updateTag({
      name: 'description',
      content: 'Apply for admission at Sanctuary Studio in Kathmandu. Fill out our inquiry form and our team will reach out to guide you through enrollment.',
    });
  }

  async onSubmit() {
    this.error = '';

    if (!this.name.trim() || !this.phone.trim()) {
      this.error = 'Please enter your name and a phone number so we can reach you.';
      return;
    }

    this.submitting = true;

    try {
      await addDoc(collection(this.firestore, 'inquiries'), {
        name: this.name,
        childAge: this.childAge,
        phone: this.phone,
        email: this.email,
        message: this.message,
        status: 'new',
        createdAt: serverTimestamp(),
      });

      this.submitted = true;

      // Send an email notification too. If this fails, the inquiry is
      // still safely saved in Firestore above, so we don't show an error.
      try {
        await emailjs.send(
          this.EMAILJS_SERVICE_ID,
          this.EMAILJS_TEMPLATE_ID,
          {
            name: this.name,
            child_age: this.childAge,
            phone: this.phone,
            email: this.email,
            message: this.message,
          },
          { publicKey: this.EMAILJS_PUBLIC_KEY }
        );
      } catch (emailErr) {
        console.error('Email notification failed to send:', emailErr);
      }
    } catch {
      this.error = 'Something went wrong sending your inquiry. Please try again or contact us directly.';
    } finally {
      this.submitting = false;
    }
  }
}

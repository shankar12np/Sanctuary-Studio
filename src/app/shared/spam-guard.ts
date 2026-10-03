/**
 * Lightweight, client-side spam filtering for the public forms (admissions
 * inquiry, competition entry) that write straight to Firestore with no
 * backend in between. This only screens out unsophisticated/automated
 * bot traffic — it's not a substitute for real server-side protection —
 * but it keeps the admin inbox free of obvious junk at no cost to real
 * visitors.
 */

// Bots that auto-fill every field on a form will fill this one too; real
// visitors never see or reach it (visually hidden + skipped in the tab
// order — see the .hp-field class in styles.scss), so any value at all
// here means it wasn't a person.
export function honeypotTripped(honeypotValue: string): boolean {
  return honeypotValue.trim().length > 0;
}

// Bots fill and submit forms almost instantly after the page loads. A
// real person reading the form and typing answers will almost always
// take longer than this.
const MIN_SUBMIT_SECONDS = 3;

export function submittedTooFast(formRenderedAt: number): boolean {
  return (Date.now() - formRenderedAt) / 1000 < MIN_SUBMIT_SECONDS;
}

// True if either spam signal is tripped — the two forms call this once
// and quietly treat the submission as "successful" without writing
// anything, rather than showing an error that would tip off a bot that
// it was caught.
export function looksLikeSpam(honeypotValue: string, formRenderedAt: number): boolean {
  return honeypotTripped(honeypotValue) || submittedTooFast(formRenderedAt);
}

// Accepts digits with an optional leading "+" and spaces/dashes/
// parentheses as separators. Requires 7-15 digits, which comfortably
// covers Nepali mobile and landline numbers (with or without the +977
// country code) as well as international numbers, without being so
// strict that a real number gets rejected.
const PHONE_SHAPE = /^\+?[\d\s()-]{7,20}$/;

export function isValidPhone(phone: string): boolean {
  const trimmed = phone.trim();
  const digitCount = (trimmed.match(/\d/g) || []).length;
  return PHONE_SHAPE.test(trimmed) && digitCount >= 7 && digitCount <= 15;
}

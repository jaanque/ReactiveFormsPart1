import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors, AsyncValidatorFn } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Observable, of } from 'rxjs';
import { delay, map } from 'rxjs/operators';

export function phoneValidator(control: AbstractControl): ValidationErrors | null {
  const value = control.value;
  if (!value) return null;
  const phoneRegex = /^[679]\d{8}$/;
  return phoneRegex.test(value) ? null : { invalidPhone: true };
}

export function ageValidator(control: AbstractControl): ValidationErrors | null {
  const value = control.value;
  if (!value) return null;
  const birthDate = new Date(value);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age >= 18 ? null : { underAge: true };
}

export function futureDateValidator(control: AbstractControl): ValidationErrors | null {
  const value = control.value;
  if (!value) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const inputDate = new Date(value);
  return inputDate > today ? null : { notFutureDate: true };
}

export function dateRangeValidator(group: AbstractControl): ValidationErrors | null {
  const departure = group.get('departureDate')?.value;
  const returnDate = group.get('returnDate')?.value;
  if (!departure || !returnDate) return null;
  const d = new Date(departure);
  const r = new Date(returnDate);
  return r > d ? null : { invalidDateRange: true };
}

export function nameValidator(control: AbstractControl): ValidationErrors | null {
  const value = control.value;
  if (!value) return null;
  const nameRegex = /^[a-zA-ZàáâäãåąčćęèéêëėįìíîïłńòóôöõøùúûüųūÿýżźñçčšžÀÁÂÄÃÅĄĆČĖĘÈÉÊËÌÍÎÏĮŁŃÒÓÔÖÕØÙÚÛÜŲŪŸÝŻŹÑßÇŒÆČŠŽ∂ð\s]+$/;
  return nameRegex.test(value) ? null : { invalidName: true };
}

export function dniValidator(control: AbstractControl): ValidationErrors | null {
  const value = control.value;
  if (!value) return null;

  let dni = value.toUpperCase();
  const niePrefix = dni.charAt(0);
  
  if (['X', 'Y', 'Z'].includes(niePrefix)) {
    dni = dni.replace('X', '0').replace('Y', '1').replace('Z', '2');
  }

  const standardDniRegex = /^\d{8}[A-Z]$/;

  if (!standardDniRegex.test(dni)) {
      return { invalidDniFormat: true };
  }

  const number = parseInt(dni.substr(0, 8), 10);
  const letter = dni.substr(8, 1);
  const letters = 'TRWAGMYFPDXBNJZSQVHLCKE';
  
  if (letters.charAt(number % 23) === letter) {
    return null;
  } else {
    return { invalidDniLetter: true };
  }
}

export function emailAsyncValidator(): AsyncValidatorFn {
  return (control: AbstractControl): Observable<ValidationErrors | null> => {
    const forbiddenEmails = ['test@test.com', 'reserva@viajes.com', 'admin@travel.com'];
    return of(control.value).pipe(
      delay(1000),
      map(email => {
        return forbiddenEmails.includes(email) ? { emailTaken: true } : null;
      })
    );
  };
}

@Component({
  selector: 'app-booking-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './booking-form.component.html',
  styleUrl: './booking-form.component.css'
})
export class BookingFormComponent implements OnInit {
  bookingForm: FormGroup;
  destinations: string[] = ['Barcelona', 'Madrid', 'Valencia', 'Sevilla', 'Bilbao', 'Mallorca'];
  filteredDestinations: string[] = [...this.destinations];
  
  constructor(private fb: FormBuilder) {
    this.bookingForm = this.fb.group({
      fullName: ['', [Validators.required, Validators.minLength(3), nameValidator]],
      dni: ['', [Validators.required, dniValidator]],
      email: ['', [Validators.required, Validators.email], [emailAsyncValidator()]],
      phone: ['', [Validators.required, phoneValidator]],
      birthDate: ['', [Validators.required, ageValidator]],
      destination: ['', Validators.required],
      departureDate: ['', [Validators.required, futureDateValidator]],
      returnDate: ['', Validators.required],
      tripType: ['oneWay', Validators.required],
      travelClass: ['tourist', Validators.required],
      passengers: [1, [Validators.required, Validators.min(1), Validators.max(10)]],
      terms: [false, Validators.requiredTrue],
      newsletter: [false]
    }, { validators: dateRangeValidator });
  }

  ngOnInit(): void {
    this.bookingForm.get('passengers')?.valueChanges.subscribe(num => {
      this.adjustPassengers(num);
    });
  }

  filterDestinations(event: any): void {
    const query = event.target.value.toLowerCase();
    this.filteredDestinations = this.destinations.filter(d => d.toLowerCase().includes(query));
  }

  adjustPassengers(num: number): void {
    console.log('Passengers changed:', num);
  }

  onSubmit(): void {
    if (this.bookingForm.valid) {
      console.log('Form Submitted', this.bookingForm.value);
    } else {
      console.log('Form Invalid');
      this.bookingForm.markAllAsTouched();
    }
  }

  hasError(controlName: string, errorName: string): boolean {
    const control = this.bookingForm.get(controlName);
    return !!(control && control.touched && control.hasError(errorName));
  }

  isInvalid(controlName: string): boolean {
    const control = this.bookingForm.get(controlName);
    return !!(control && control.touched && control.invalid);
  }
  
  isValid(controlName: string): boolean {
    const control = this.bookingForm.get(controlName);
    return !!(control && control.touched && control.valid);
  }
}

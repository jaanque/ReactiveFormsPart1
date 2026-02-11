import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors, AsyncValidatorFn, FormControl, FormArray } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Observable, of } from 'rxjs';
import { delay, map } from 'rxjs/operators';

// Validadores personalizados

// Validar el telefon espanya
export function phoneValidator(control: AbstractControl): ValidationErrors | null {
  const value = control.value;
  if (!value) return null;
  const phoneRegex = /^[679]\d{8}$/;
  return phoneRegex.test(value) ? null : { invalidPhone: true };
}

// Validar la edat minima de 18 anys
export function ageValidator(control: AbstractControl): ValidationErrors | null {
  const value = control.value;
  if (!value) return null;
  const birthDate = new Date(value);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  return age >= 18 ? null : { underAge: true };
}

// Validar que la data d'anada sigui posterior a la data de'avui
export function futureDateValidator(control: AbstractControl): ValidationErrors | null {
  const value = control.value;
  if (!value) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const inputDate = new Date(value);
  return inputDate > today ? null : { notFutureDate: true };
}

// Validar que la data de tornada sigui posterior a la data de sortida
export function dateRangeValidator(group: AbstractControl): ValidationErrors | null {
  const departure = group.get('departureDate')?.value;
  const returnDate = group.get('returnDate')?.value;
  if (!departure || !returnDate) return null;
  const d = new Date(departure);
  const r = new Date(returnDate);
  return r > d ? null : { invalidDateRange: true };
}


// Validar el nom
export function nameValidator(control: AbstractControl): ValidationErrors | null {
  const value = control.value;
  if (!value) return null;
  const nameRegex = /^[a-zA-ZàáâäãåąčćęèéêëėįìíîïłńòóôöõøùúûüųūÿýżźñçčšžÀÁÂÄÃÅĄĆČĖĘÈÉÊËÌÍÎÏĮŁŃÒÓÔÖÕØÙÚÛÜŲŪŸÝŻŹÑßÇŒÆČŠŽ∂ð\s]+$/;
  return nameRegex.test(value) ? null : { invalidName: true };
}

// Validar el DNI/NIE
export function dniValidator(control: AbstractControl): ValidationErrors | null {
  const value = control.value;
  if (!value) return null;

  const dni = value.toUpperCase();

  const standardDniRegex = /^\d{8}[A-Z]$/;

  if (!standardDniRegex.test(dni)) {
    return { invalidDniFormat: true };
  }

  const number = parseInt(dni.substring(0, 8), 10);
  const letter = dni.substring(8, 9);
  const letters = 'TRWAGMYFPDXBNJZSQVHLCKE';

  if (letters.charAt(number % 23) === letter) {
    return null;
  } else {
    return { invalidDniLetter: true };
  }
}

// Veerificar que el correu no estigui registrat
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


// Component de formulari de reserva
@Component({
  selector: 'app-booking-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule // Active els formularis reactius
  ],
  templateUrl: './booking-form.component.html',
  styleUrl: './booking-form.component.css'
})

// Classe del component
export class BookingFormComponent implements OnInit {
  bookingForm: FormGroup;
  destinations: string[] = ['Barcelona', 'Madrid', 'Valencia', 'Sevilla', 'Bilbao', 'Mallorca'];
  filteredDestinations: string[] = [...this.destinations];
  searchControl = new FormControl('');
  totalPrice: number = 0;
  

  // Constructor on es defineix el formulari i els seus controls amb les validacions
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
      additionalPassengers: this.fb.array([]),
      terms: [false, Validators.requiredTrue],
      newsletter: [false]
    }, { validators: dateRangeValidator });


    // Conectaar el num de passatgers amb el FormArray d'informació dels passatgers addicionals
    this.setupPassengersSync();
    this.calculatePrice();
    this.bookingForm.valueChanges.subscribe(() => this.calculatePrice());
  }


  // Getter per accedir al FormArray d'informació dels passatgers addicionals
  get additionalPassengers(): FormArray {
    return this.bookingForm.get('additionalPassengers') as FormArray;
  }

  // Lopgica per a filtrar ell buscador de destinacions
  ngOnInit(): void {
    this.searchControl.valueChanges.subscribe(value => {
      const query = (value || '').toLowerCase();
      this.filteredDestinations = this.destinations.filter(d => d.toLowerCase().includes(query));
    });
  }

  // Sincronitzar num passatgers adicionals amb el FormArray
  setupPassengersSync(): void {
    this.bookingForm.get('passengers')?.valueChanges.subscribe(num => {
      this.adjustPassengers(num);
    });
  }

  // Calcular preu
  calculatePrice(): void {
    const basePrices: {[key: string]: number} = {
      tourist: 100,
      business: 250,
      firstClass: 500
    };
    
    // Obtenir la classe de viatge i el num de passatgers per calcular el preu total
    const travelClass = this.bookingForm.get('travelClass')?.value;
    const passengers = this.bookingForm.get('passengers')?.value;
    
    if (travelClass && passengers) {
      this.totalPrice = (basePrices[travelClass] || 0) * passengers;
    } else {
      this.totalPrice = 0;
    }
  }

  // Ajustar noms pasatgers adicioals
  adjustPassengers(num: number): void {
    const currentCount = this.additionalPassengers.length;
    const needed = num - 1;

    // ficar els camps per als nous passatgers o eliminar els que sobren
    if (needed > currentCount) {
      for (let i = currentCount; i < needed; i++) {
        this.additionalPassengers.push(this.fb.group({
          name: ['', Validators.required],
          age: ['', Validators.required],
          relation: ['', Validators.required]
        }));
      }
    } else if (needed < currentCount) {
      for (let i = currentCount; i > needed; i--) {
        this.additionalPassengers.removeAt(i - 1);
      }
    }
  }

  // Funció per a enviar el formulari
  onSubmit(): void {
    if (this.bookingForm.valid) {
      console.log('Form Submitted', this.bookingForm.value);
    } else {
      console.log('Form Invalid');
      this.bookingForm;
    }
  }

  // Funcio per a mostrar els errors
  hasError(controlName: string, errorName: string): boolean {
    const control = this.bookingForm.get(controlName);
    return !!(control && control.touched && control.hasError(errorName));
  }

  // Funcuio per mostrar si es valid o no un camp
  isInvalid(controlName: string): boolean {
    const control = this.bookingForm.get(controlName);
    return !!(control && control.touched && control.invalid);
  }
  
  // Funcio per mostrar si es valid o no un camp
  isValid(controlName: string): boolean {
    const control = this.bookingForm.get(controlName);
    return !!(control && control.touched && control.valid);
  }
}

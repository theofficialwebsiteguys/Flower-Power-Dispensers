import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { AuthService } from '../auth.service';
import { SettingsService } from '../settings.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
})
export class RegisterComponent {
  registerForm: FormGroup;
  loading = false;
  submitted = false;
  error = '';
  isFormTouched = false; // Tracks if any input has been entered

  countries = [
    { name: 'United States', dialCode: '+1', code: 'US' },
    { name: 'United Kingdom', dialCode: '+44', code: 'GB' },
    { name: 'France', dialCode: '+33', code: 'FR' },
    { name: 'Germany', dialCode: '+49', code: 'DE' },
    { name: 'Croatia', dialCode: '+385', code: 'HR' },
    { name: 'Canada', dialCode: '+1', code: 'CA' },
    { name: 'Australia', dialCode: '+61', code: 'AU' },
    { name: 'India', dialCode: '+91', code: 'IN' },
    { name: 'Japan', dialCode: '+81', code: 'JP' },
    { name: 'China', dialCode: '+86', code: 'CN' },
    { name: 'Italy', dialCode: '+39', code: 'IT' },
    { name: 'Spain', dialCode: '+34', code: 'ES' },
    { name: 'Mexico', dialCode: '+52', code: 'MX' },
    { name: 'Brazil', dialCode: '+55', code: 'BR' },
    { name: 'South Africa', dialCode: '+27', code: 'ZA' },
    { name: 'New Zealand', dialCode: '+64', code: 'NZ' },
    { name: 'Russia', dialCode: '+7', code: 'RU' },
    { name: 'South Korea', dialCode: '+82', code: 'KR' },
  ];

  selectedCountryCode = this.countries[0].dialCode; // Default country code

  dobEmptyError = false; // Error when DOB is incomplete
  dobInvalidError = false; // Error when DOB format is invalid
  underageError = false; // Error when user is under 21

  currentYear = new Date().getFullYear();
  darkModeEnabled: boolean = false;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private authService: AuthService,
    private settingsService: SettingsService
  ) {
    this.registerForm = this.fb.group({
      fname: ['', [Validators.required, Validators.minLength(2)]],
      lname: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      country: [this.countries[0].code, Validators.required], // Default to the first country
      phone: ['', [Validators.required, Validators.pattern(/^\d{7,15}$/)]], // 7-15 digits
      month: ['', [Validators.required, Validators.pattern(/^(0[1-9]|1[0-2])$/)]], // MM
      day: ['', [Validators.required, Validators.pattern(/^(0[1-9]|[12][0-9]|3[01])$/)]], // DD
      year: ['', [Validators.required, Validators.pattern(new RegExp(`^(19[0-9][0-9]|20[0-${this.currentYear % 10}][0-${Math.floor((this.currentYear % 100) / 10)}])$`))]], // YYYY
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]],     
    }, {
      validator: this.passwordMatchValidator, // Custom validator
    });
  }

  ngOnInit() {
    // Track changes in the form to determine if any input is entered
    this.registerForm.valueChanges.subscribe(() => {
      this.isFormTouched = true;
    });
    this.settingsService.isDarkModeEnabled$.subscribe((isDarkModeEnabled) => {
      this.darkModeEnabled = isDarkModeEnabled;
    });
  }

  onSubmit() {
    this.submitted = true;

    if (this.registerForm.invalid) {
      console.log(this.registerForm);
      this.dobInvalidError = true;
      this.loading = false;
      return;
    }

    this.loading = true;
    const month = this.registerForm.get('month')?.value;
    const day = this.registerForm.get('day')?.value;
    const year = this.registerForm.get('year')?.value;

    console.log(month);
    console.log(day);
    console.log(year);

    if (!month || !day || !year) {
      this.dobEmptyError = true;
      this.loading = false;
      return;
    } else {
      this.dobEmptyError = false;
    }

    // Create DOB and check if user is 21+
    const dobString = `${year}-${month}-${day}`;
    const dob = new Date(dobString);

    if (isNaN(dob.getTime())) {
      this.dobInvalidError = true;
      this.loading = false;
      return;
    } else {
      this.dobInvalidError = false;
    }

    const age = this.calculateAge(dob);
    if (age < 21) {
      this.underageError = true;
      this.loading = false;
      return;
    } else {
      this.underageError = false;
    }

    if (this.registerForm.invalid) {
      return;
    }

    this.loading = true;
    this.error = ''; // Clear previous error
  
    this.authService.register({...this.registerForm.value, dob}).subscribe({
      next: () => {
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.error = err.message;
      },
    });
  }

  onCountryCodeChange() {
    const country = this.registerForm.get('country')?.value;
    const phoneControl = this.registerForm.get('phone');
    if (phoneControl) {
      phoneControl.setValue(`${country}${phoneControl.value || ''}`);
    }
  }

  // Custom validator to check if password and confirmPassword match
  passwordMatchValidator(group: FormGroup) {
    const password = group.get('password')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;
    return password === confirmPassword ? null : { notMatching: true };
  }

  // Helper to calculate age
  calculateAge(dob: Date): number {
    const today = new Date();
    const age = today.getFullYear() - dob.getFullYear();
    const monthDifference = today.getMonth() - dob.getMonth();
    if (
      monthDifference < 0 ||
      (monthDifference === 0 && today.getDate() < dob.getDate())
    ) {
      return age - 1;
    }
    return age;
  }
}

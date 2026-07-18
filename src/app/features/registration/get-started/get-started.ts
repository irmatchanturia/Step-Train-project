import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-sign-up',
  imports: [FormsModule, RouterLink],
  templateUrl: './get-started.html',
  styleUrl: './get-started.css',
})
export class SignUp {
  firstName = '';
  lastName = '';
  email = '';
  password = '';

  signUp(): void {
    const userData = {
      firstName: this.firstName,
      lastName: this.lastName,
      email: this.email,
      password: this.password,
    };

  }
}

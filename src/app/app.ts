import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Header } from './shared/header/header';
import { SignUp } from './features/registration/get-started/registration';

@Component({
  selector: 'app-root',
  imports: [Header, SignUp],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected readonly title = signal('stepTrain');
}

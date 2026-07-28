import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Header } from './shared/header/header';
import { Footer } from "./shared/footer/footer/footer";
import { Toast } from './shared/toast/toast/toast';

@Component({
  selector: 'app-root',
  imports: [Header, RouterOutlet, Footer, Toast],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected readonly title = signal('stepTrain');
}

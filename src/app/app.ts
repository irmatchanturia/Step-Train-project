import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Header } from './shared/header/header';
import { Footer } from "./shared/footer/footer/footer";
import { Toast } from './shared/toast/toast/toast';
import { AiChat } from './shared/ai-chat/ai-chat';

@Component({
  selector: 'app-root',
  imports: [Header, RouterOutlet, Footer, Toast, AiChat],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected readonly title = signal('stepTrain');
}

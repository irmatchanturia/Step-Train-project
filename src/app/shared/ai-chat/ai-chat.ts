import { ChangeDetectorRef, Component, ElementRef, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { AiChatService, AiHistoryMessage, BookingProposal } from './ai-chat-service';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  bookingProposal?: BookingProposal;
  bookingConfirmed?: boolean;
}

@Component({
  selector: 'app-ai-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ai-chat.html',
  styleUrl: './ai-chat.css',
})
export class AiChat {
  private readonly aiChatService = inject(AiChatService);

  private readonly cdr = inject(ChangeDetectorRef);

  @ViewChild('messagesContainer')
  private messagesContainer?: ElementRef<HTMLDivElement>;

  isOpen = false;
  isSending = false;
  isBooking = false;

  message = '';

  messages: ChatMessage[] = [];

  toggleChat(): void {
    this.isOpen = !this.isOpen;

    if (this.isOpen) {
      this.scrollToBottom();
    }
  }

  sendMessage(): void {
    const userMessage = this.message.trim();

    if (!userMessage || this.isSending) {
      return;
    }

    const history: AiHistoryMessage[] = this.messages.map((chatMessage) => ({
      role: chatMessage.role,
      content: chatMessage.content,
    }));

    this.messages.push({
      role: 'user',
      content: userMessage,
    });

    this.message = '';
    this.isSending = true;

    this.cdr.detectChanges();
    this.scrollToBottom();

    this.aiChatService.sendMessage(userMessage, history).subscribe({
      next: (response) => {
        this.messages.push({
          role: 'assistant',
          content: response.answer,
          bookingProposal: response.bookingProposal,
        });

        this.isSending = false;

        this.cdr.detectChanges();
        this.scrollToBottom();
      },

      error: (error) => {
        console.error('AI chat error:', error);

        this.messages.push({
          role: 'assistant',
          content: 'დაფიქსირდა შეცდომა. გთხოვთ, სცადოთ თავიდან.',
        });

        this.isSending = false;

        this.cdr.detectChanges();
        this.scrollToBottom();
      },
    });
  }

  confirmBooking(chatMessage: ChatMessage): void {
    const proposal = chatMessage.bookingProposal;

    if (!proposal || this.isBooking || chatMessage.bookingConfirmed) {
      return;
    }

    this.isBooking = true;
    this.cdr.detectChanges();

    this.aiChatService.confirmBooking(proposal).subscribe({
      next: (response) => {
        chatMessage.bookingConfirmed = true;

        // დადასტურების ღილაკები აღარ გამოჩნდეს
        chatMessage.bookingProposal = undefined;

        this.isBooking = false;

        this.messages.push({
          role: 'assistant',
          content: `ჯავშანი წარმატებით შეიქმნა. Booking ID: ${response.data}`,
        });

        this.cdr.detectChanges();
        this.scrollToBottom();
      },

      error: (error) => {
        console.error('Booking error:', error);

        this.isBooking = false;

        if (error.status === 401 || error.status === 403) {
          this.messages.push({
            role: 'assistant',
            content:
              'დაჯავშნისთვის საჭიროა ავტორიზაცია. გთხოვთ, შეხვიდეთ ანგარიშზე და თავიდან სცადოთ.',
          });
        } else {
          this.messages.push({
            role: 'assistant',
            content: 'ჯავშნის შექმნა ვერ მოხერხდა. გთხოვთ, სცადოთ თავიდან.',
          });
        }

        this.cdr.detectChanges();
        this.scrollToBottom();
      },
    });
  }

  cancelBooking(chatMessage: ChatMessage): void {
    chatMessage.bookingProposal = undefined;

    this.messages.push({
      role: 'assistant',
      content: 'ჯავშანი გაუქმებულია.',
    });

    this.cdr.detectChanges();
    this.scrollToBottom();
  }

  private scrollToBottom(): void {
    setTimeout(() => {
      const element = this.messagesContainer?.nativeElement;

      if (!element) {
        return;
      }

      element.scrollTop = element.scrollHeight;
    });
  }
}

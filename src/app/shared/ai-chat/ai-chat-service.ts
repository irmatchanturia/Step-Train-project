import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { from, Observable } from 'rxjs';

export interface AiHistoryMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface BookingProposal {
  scheduleId: number;
  coachId: number;
  seatId: number[];
  travelDate: string;
}

export interface AiChatResponse {
  answer: string;
  bookingProposal?: BookingProposal;
}

export interface CreateBookingResponse {
  data: number;
  meta?: Record<string, string>;
}

@Injectable({
  providedIn: 'root',
})
export class AiChatService {
  private readonly http = inject(HttpClient);

  private readonly aiChatUrl = 'http://localhost:3000/ai/chat';
  private readonly bookingsUrl = 'https://trainsapi.stepacademy.ge/api/bookings';

  sendMessage(message: string, history: AiHistoryMessage[]): Observable<AiChatResponse> {
    return from(
      fetch(this.aiChatUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          history,
        }),
      }).then(async (response) => {
        if (!response.ok) {
          throw new Error(`AI request failed: ${response.status}`);
        }

        return (await response.json()) as AiChatResponse;
      }),
    );
  }

  confirmBooking(proposal: BookingProposal): Observable<CreateBookingResponse> {
    const travelDate = proposal.travelDate.includes('T')
      ? proposal.travelDate
      : `${proposal.travelDate}T00:00:00`;

    return this.http.post<CreateBookingResponse>(this.bookingsUrl, {
      scheduleId: proposal.scheduleId,
      seatId: proposal.seatId,
      travelDate,
    });
  }
}

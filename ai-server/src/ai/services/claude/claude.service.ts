import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';
import type { MessageParam } from '@anthropic-ai/sdk/resources';
import { z } from 'zod';

import { StepApiService } from '../step-api/step-api.service';

const searchTrainsInputSchema = z.object({
  origin: z.string().min(1),
  destination: z.string().min(1),
});

const getTrainDetailsInputSchema = z.object({
  trainId: z.number().int().positive(),
});

const getAvailableSeatsInputSchema = z.object({
  scheduleId: z.number().int().positive(),
  coachId: z.number().int().positive(),
  travelDate: z.string().min(1),
});

const prepareBookingInputSchema = z.object({
  scheduleId: z.number().int().positive(),
  coachId: z.number().int().positive(),
  seatId: z.array(z.number().int().positive()).min(1),
  travelDate: z.string().min(1),
});

export interface BookingProposal {
  scheduleId: number;
  coachId: number;
  seatId: number[];
  travelDate: string;
}

export interface AiChatResult {
  answer: string;
  bookingProposal?: BookingProposal;
}

@Injectable()
export class ClaudeService {
  private readonly anthropic: Anthropic;
  private readonly model: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly stepApiService: StepApiService,
  ) {
    const apiKey = this.configService.get<string>('ANTHROPIC_API_KEY');

    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY is not configured');
    }

    this.model =
      this.configService.get<string>('ANTHROPIC_MODEL') ?? 'claude-sonnet-5';

    this.anthropic = new Anthropic({
      apiKey,
    });
  }

  async sendMessage(
    message: string,
    history: Array<{
      role: 'user' | 'assistant';
      content: string;
    }> = [],
  ): Promise<AiChatResult> {
    const messages: MessageParam[] = [
      ...history.slice(-10).map((item): MessageParam => ({
        role: item.role,
        content: item.content,
      })),
      {
        role: 'user',
        content: message,
      },
    ];

    const systemPrompt = `
You are the AI assistant for STEP TRAINS.

Help users search for trains and prepare bookings.

Respond in the same language as the user.

Be concise, friendly, and accurate.

Never invent train, station, schedule, coach,
seat, price, availability, booking, or user
account information.

Always preserve exact train names, station names,
coach classes and seat numbers exactly as returned
by STEP TRAINS tools.

Never rename, translate, or invent entity names.

Whenever current STEP TRAINS data is needed,
use the available tools.

The search_trains tool only returns matching trains.

Use get_train_details to obtain schedules,
departure times, coaches and prices.

When checking seat availability, first identify
the exact schedule and coach.

Never guess a schedule ID or coach ID.

Seat availability depends on the travel date.

If the user has not provided a travel date,
ask for it before checking seats.

Before preparing a booking, you must know:
- exact schedule
- exact coach
- travel date
- exact selected available seat or seats

Use prepare_booking only after the requested seats
have been verified as available using
get_available_seats.

Even if the user directly asks you to book,
do not claim that the booking has been created.

prepare_booking only creates a proposal.

After preparing a booking proposal, clearly ask
the user to confirm the booking.

Never say a booking is successful until the
application itself confirms that the booking API
request succeeded.

search_trains returns both trainId and trainNumber.

For get_train_details, ALWAYS use trainId.
NEVER use trainNumber as trainId.
    `.trim();

    const tools = [
      {
        name: 'get_stations',
        description:
          'Get the current list of train stations available in STEP TRAINS.',
        input_schema: {
          type: 'object' as const,
          properties: {},
          required: [],
        },
      },

      {
        name: 'search_trains',
        description:
          'Search STEP TRAINS for trains matching an origin and destination.',
        input_schema: {
          type: 'object' as const,
          properties: {
            origin: {
              type: 'string',
              description: 'Origin city or station.',
            },
            destination: {
              type: 'string',
              description: 'Destination city or station.',
            },
          },
          required: ['origin', 'destination'],
        },
      },

      {
        name: 'get_train_details',
        description:
          'Get schedules, departure times, coaches, classes, prices and seat counts for a train.',
        input_schema: {
          type: 'object' as const,
          properties: {
            trainId: {
              type: 'number',
              description:
                'Use ONLY the trainId field returned by search_trains. Never use trainNumber. For example, if search_trains returns trainId: 1 and trainNumber: 101, pass 1.',
            },
          },
          required: ['trainId'],
        },
      },

      {
        name: 'get_available_seats',
        description:
          'Get currently available seats for a schedule, coach and travel date.',
        input_schema: {
          type: 'object' as const,
          properties: {
            scheduleId: {
              type: 'number',
            },
            coachId: {
              type: 'number',
            },
            travelDate: {
              type: 'string',
              description: 'Date in YYYY-MM-DD format.',
            },
          },
          required: ['scheduleId', 'coachId', 'travelDate'],
        },
      },

      {
        name: 'prepare_booking',
        description:
          'Prepare a booking proposal after the exact schedule, coach, date and available seat IDs have been verified. This does NOT create the booking.',
        input_schema: {
          type: 'object' as const,
          properties: {
            scheduleId: {
              type: 'number',
            },
            coachId: {
              type: 'number',
            },
            seatId: {
              type: 'array',
              items: {
                type: 'number',
              },
            },
            travelDate: {
              type: 'string',
              description: 'Date in YYYY-MM-DD format.',
            },
          },
          required: ['scheduleId', 'coachId', 'seatId', 'travelDate'],
        },
      },
    ];

    let bookingProposal: BookingProposal | undefined;

    let response = await this.anthropic.messages.create({
      model: this.model,
      max_tokens: 700,
      system: systemPrompt,
      tools,
      messages,
    });

    let toolIterations = 0;
    const maxToolIterations = 12;

    while (
      response.stop_reason === 'tool_use' &&
      toolIterations < maxToolIterations
    ) {
      toolIterations++;

      messages.push({
        role: 'assistant',
        content: response.content,
      });

      const toolResults: Array<{
        type: 'tool_result';
        tool_use_id: string;
        content: string;
        is_error?: boolean;
      }> = [];

      for (const block of response.content) {
        if (block.type !== 'tool_use') {
          continue;
        }

        if (block.name === 'get_stations') {
          try {
            const stations = await this.stepApiService.getStations();

            toolResults.push({
              type: 'tool_result',
              tool_use_id: block.id,
              content: JSON.stringify(stations),
            });
          } catch {
            toolResults.push({
              type: 'tool_result',
              tool_use_id: block.id,
              content: 'Failed to load stations from STEP API.',
              is_error: true,
            });
          }

          continue;
        }

        if (block.name === 'search_trains') {
          const parsed = searchTrainsInputSchema.safeParse(block.input);

          if (!parsed.success) {
            toolResults.push({
              type: 'tool_result',
              tool_use_id: block.id,
              content: 'Invalid origin or destination.',
              is_error: true,
            });

            continue;
          }

          try {
            const trains = await this.stepApiService.filterTrains(
              parsed.data.origin,
              parsed.data.destination,
            );

            toolResults.push({
              type: 'tool_result',
              tool_use_id: block.id,
              content: JSON.stringify(trains),
            });
          } catch {
            toolResults.push({
              type: 'tool_result',
              tool_use_id: block.id,
              content: 'Failed to search trains.',
              is_error: true,
            });
          }

          continue;
        }

        if (block.name === 'get_train_details') {
          const parsed = getTrainDetailsInputSchema.safeParse(block.input);

          if (!parsed.success) {
            toolResults.push({
              type: 'tool_result',
              tool_use_id: block.id,
              content: 'Invalid train ID.',
              is_error: true,
            });

            continue;
          }

          try {
            const train = await this.stepApiService.getTrainDetails(
              parsed.data.trainId,
            );

            toolResults.push({
              type: 'tool_result',
              tool_use_id: block.id,
              content: JSON.stringify(train),
            });
          } catch {
            toolResults.push({
              type: 'tool_result',
              tool_use_id: block.id,
              content: 'Failed to load train details.',
              is_error: true,
            });
          }

          continue;
        }

        if (block.name === 'get_available_seats') {
          const parsed = getAvailableSeatsInputSchema.safeParse(block.input);

          if (!parsed.success) {
            toolResults.push({
              type: 'tool_result',
              tool_use_id: block.id,
              content: 'Invalid schedule, coach, or travel date.',
              is_error: true,
            });

            continue;
          }

          try {
            const seats = await this.stepApiService.getAvailableSeats(
              parsed.data.scheduleId,
              parsed.data.coachId,
              parsed.data.travelDate,
            );

            toolResults.push({
              type: 'tool_result',
              tool_use_id: block.id,
              content: JSON.stringify(seats),
            });
          } catch {
            toolResults.push({
              type: 'tool_result',
              tool_use_id: block.id,
              content: 'Failed to load available seats.',
              is_error: true,
            });
          }

          continue;
        }

        if (block.name === 'prepare_booking') {
          const parsed = prepareBookingInputSchema.safeParse(block.input);

          if (!parsed.success) {
            toolResults.push({
              type: 'tool_result',
              tool_use_id: block.id,
              content: 'Invalid booking proposal.',
              is_error: true,
            });

            continue;
          }

          bookingProposal = {
            scheduleId: parsed.data.scheduleId,
            coachId: parsed.data.coachId,
            seatId: parsed.data.seatId,
            travelDate: parsed.data.travelDate,
          };

          toolResults.push({
            type: 'tool_result',
            tool_use_id: block.id,
            content:
              'Booking proposal prepared successfully. The booking has NOT been created. Ask the user for explicit confirmation.',
          });

          continue;
        }

        toolResults.push({
          type: 'tool_result',
          tool_use_id: block.id,
          content: `Unknown tool: ${block.name}`,
          is_error: true,
        });
      }

      messages.push({
        role: 'user',
        content: toolResults,
      });

      response = await this.anthropic.messages.create({
        model: this.model,
        max_tokens: 700,
        system: systemPrompt,
        tools,
        messages,
      });
    }

    let answer = response.content
      .filter((block) => block.type === 'text')
      .map((block) => block.text)
      .join('\n')
      .trim();

    if (!answer && bookingProposal) {
      answer =
        'ჯავშნის დეტალები მომზადებულია. გთხოვთ, გადაამოწმოთ ინფორმაცია და დაადასტუროთ ჯავშანი.';
    }

    if (!answer) {
      console.error('Claude returned no text response:', {
        stopReason: response.stop_reason,
        toolIterations,
        content: response.content,
      });

      answer =
        'მოთხოვნის დამუშავება ბოლომდე ვერ დასრულდა. გთხოვთ, სცადოთ კიდევ ერთხელ.';
    }

    return {
      answer,
      ...(bookingProposal ? { bookingProposal } : {}),
    };
  }
}

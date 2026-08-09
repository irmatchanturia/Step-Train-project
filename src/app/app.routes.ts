import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth-guard';
import { Home } from './features/home/home/home';
import { SignUp } from './features/registration/get-started/registration';
import { SignIn } from './features/registration/signIn/sign-in/sign-in';
import { TrainComponent } from './features/trains/train/train/train';
import { TrainDetails } from './features/trains/train-details/train-details';
import { ProfileLayout } from './features/profile/profile-layout/profile-layout';
import { MyProfile } from './features/profile/my-profile/my-profile';
import { MyBookings } from './features/profile/my-bookings/my-bookings';
import { Settings } from './features/profile/settings/settings';
import { BookingDetails } from './features/profile/booking-details/booking-details';
import { BookingLayout } from './features/booking/booking-layout/booking-layout';
import { SelectCoach } from './features/booking/select-coach/select-coach';
import { SelectDate } from './features/booking/select-date/select-date';
import { SelectSeats } from './features/booking/select-seats/select-seats';
import { Confirmation } from './features/booking/confirmation/confirmation';
import { ForgotPassword } from './features/registration/forgot-password/forgot-password';
import { resetTokenGuard } from './core/guards/reset-token-guard';
import { ResetPassword } from './features/registration/reset-password/reset-password';
import { VerifyEmail } from './features/registration/verify-email/verify-email';

export const routes: Routes = [
  {
    path: '',
    component: Home,
    canActivate: [resetTokenGuard],
  },
  {
    path: 'sign-up',
    component: SignUp,
  },
  {
    path: 'sign-in',
    component: SignIn,
  },
  {
    path: 'forgot-password',
    component: ForgotPassword,
  },
  {
    path: 'reset-password',
    component: ResetPassword,
  },
  {
    path: 'verify-email',
    component: VerifyEmail,
  },
  {
    path: 'trains',
    component: TrainComponent,
  },
  {
    path: 'trains/:trainId/book/:scheduleId',
    component: BookingLayout,
    canActivate: [authGuard],
    children: [
      {
        path: 'coach',
        component: SelectCoach,
      },
      {
        path: 'date',
        component: SelectDate,
      },
      {
        path: 'seats',
        component: SelectSeats,
      },
      {
        path: 'confirmation',
        component: Confirmation,
      },
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'coach',
      },
    ],
  },
  {
    path: 'trains/:id',
    component: TrainDetails,
  },

  {
    path: 'profile',
    component: ProfileLayout,
    canActivate: [authGuard],
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'my-profile',
      },
      {
        path: 'my-profile',
        component: MyProfile,
      },
      {
        path: 'my-bookings',
        component: MyBookings,
      },
      {
        path: 'my-bookings/:id',
        component: BookingDetails,
      },
      {
        path: 'settings',
        component: Settings,
      },
    ],
  },

  {
    path: '**',
    redirectTo: '',
  },
];

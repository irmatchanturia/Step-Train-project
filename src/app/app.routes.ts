import { Routes } from '@angular/router';

import { Home } from './features/home/home/home';
import { SignUp } from './features/registration/get-started/registration';
import { SignIn } from './features/registration/signIn/sign-in/sign-in';
import { TrainComponent } from './features/train/train/train';

import { ProfileLayout } from './features/profile/profile-layout/profile-layout';
import { MyProfile } from './features/profile/my-profile/my-profile';
import { MyBookings } from './features/profile/my-bookings/my-bookings';
import { Settings } from './features/profile/settings/settings';

import { authGuard } from '../app/core/guards/auth-guard';

export const routes: Routes = [
  {
    path: '',
    component: Home,
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
    path: 'trains',
    component: TrainComponent,
  },
  {
    path: 'profile',
    component: ProfileLayout,
    canActivate: [authGuard],
    children: [
      {
        path: '',
        redirectTo: 'my-profile',
        pathMatch: 'full',
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

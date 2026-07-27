import { Routes } from '@angular/router';
import { Home } from './features/home/home/home';
import { SignUp } from './features/registration/get-started/registration';
import { SignIn } from './features/registration/signIn/sign-in/sign-in';
import { TrainComponent } from './features/train/train/train';

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
    path: '**',
    redirectTo: '',
  },
];

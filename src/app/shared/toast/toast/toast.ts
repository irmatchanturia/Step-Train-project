import { Component, inject } from '@angular/core';

import { ToastService } from '../../service/toast-service';

@Component({
  selector: 'app-toast',
  imports: [],
  templateUrl: './toast.html',
  styleUrl: './toast.css',
})
export class Toast {
  readonly toastService = inject(ToastService);
}

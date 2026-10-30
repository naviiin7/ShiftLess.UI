import { Injectable, signal } from '@angular/core';

export interface ToastMessage {
  id: number;
  text: string;
  type: 'success' | 'error';
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {

  private readonly _toasts = signal<ToastMessage[]>([]);

  readonly toasts = this._toasts.asReadonly();

  private nextId = 1;

  private show(text: string, type: 'success' | 'error'): void {

    const id = this.nextId++;

    this._toasts.update(list => [...list, { id, text, type }]);

    setTimeout(() => this.dismiss(id), 3000);

  }

  success(text: string): void {

    this.show(text, 'success');

  }

  error(text: string): void {

    this.show(text, 'error');

  }

  dismiss(id: number): void {

    this._toasts.update(list => list.filter(t => t.id !== id));

  }

}
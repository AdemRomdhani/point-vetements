import { Injectable } from '@angular/core';
import { Observable, timer, map, shareReplay } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class SplashService {
  private _isReady = false;

  visible$: Observable<boolean> = timer(800).pipe(
    map(() => {
      this._isReady = true;
      return false;
    }),
    shareReplay(1)
  );

  hide() {
    this._isReady = true;
  }

  get isReady(): boolean {
    return this._isReady;
  }
}

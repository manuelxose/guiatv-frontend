import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, OnInit, OnDestroy, ChangeDetectorRef, OnChanges, SimpleChanges, NgZone } from '@angular/core';
import { InteractionButtonsComponent } from '../interaction-buttons/interaction-buttons.component';

@Component({
  selector: 'app-card-list',
  standalone: true,
  imports: [CommonModule, InteractionButtonsComponent],
  templateUrl: './card-list.component.html',
  styleUrls: ['./card-list.component.scss'],
})
export class CardListComponent implements OnInit, OnDestroy, OnChanges {
  @Input() title: string = '';
  @Input() subtitle: string = '';
  @Input() channelIcon: string = '';
  @Input() image: string = '';
  @Input() description: string = '';
  @Input() time: string = '';
  @Input() category: string = '';
  @Input() live: boolean = false;
  @Input() progress: number = 0;
  @Input() id: string = '';
  @Input() type: 'movie' | 'series' | 'program' = 'program';
  @Input() badge: string = '';
  @Input() badgeColor: 'red' | 'green' | 'blue' | 'gray' = 'gray';

  @Input() startTime: string | number | Date = '';
  @Input() endTime: string | number | Date = '';

  @Output() cardClick = new EventEmitter<void>();
  @Output() remindClick = new EventEmitter<void>();

  private intervalId: any;
  private _cachedProgress: number = 0;
  private _cachedTimeText: string = 'Emitiendo ahora';

  constructor(private cdr: ChangeDetectorRef, private ngZone: NgZone) {}

  get backgroundImage(): string {
    return this.image
      ? `url(${this.image})`
      : 'linear-gradient(to right, #2d3748, #1a202c)';
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['startTime'] || changes['endTime'] || changes['live']) {
      this.updateProgress();
    }
  }

  get progressPercentage(): number {
    return this._cachedProgress;
  }

  get timeText(): string {
    return this._cachedTimeText;
  }

  private updateProgress(): void {
    if (!this.startTime || !this.endTime) {
      this._cachedProgress = this.progress || 0;
      this._cachedTimeText = 'Emitiendo ahora';
      return;
    }
    
    const start = new Date(this.startTime).getTime();
    const end = new Date(this.endTime).getTime();
    const now = Date.now();

    // Commented out to reduce console spam - uncomment for debugging
    // console.log('[CardList] Progress Update:', {
    //   title: this.title,
    //   startTime: this.startTime,
    //   endTime: this.endTime,
    //   startDate: new Date(this.startTime).toLocaleString('es-ES'),
    //   endDate: new Date(this.endTime).toLocaleString('es-ES'),
    //   nowDate: new Date(now).toLocaleString('es-ES'),
    //   startMs: start,
    //   endMs: end,
    //   nowMs: now,
    //   isBeforeStart: now < start,
    //   isAfterEnd: now > end
    // });

    if (now < start) {
      this._cachedProgress = 0;
    } else if (now > end) {
      this._cachedProgress = 100;
    } else {
      const total = end - start;
      const elapsed = now - start;
      this._cachedProgress = Math.min(100, Math.max(0, (elapsed / total) * 100));
    }

    // Update time text
    const elapsedMs = Math.max(0, now - start);
    const elapsedMinutes = Math.floor(elapsedMs / (1000 * 60));
    this._cachedTimeText = `${elapsedMinutes} min`;
  }

  ngOnInit() {
    this.updateProgress();
    
    if (this.live) {
      this.ngZone.runOutsideAngular(() => {
        // Update every 5 minutes instead of every minute to reduce performance impact
        this.intervalId = setInterval(() => {
          this.updateProgress();
          this.ngZone.run(() => {
            this.cdr.detectChanges();
          });
        }, 300000); // 5 minutes = 300000ms
      });
    }
  }

  ngOnDestroy() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  onClick(): void {
    this.cardClick.emit();
  }

  onRemind(event: Event): void {
    event.stopPropagation();
    this.remindClick.emit();
  }
}

import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ModalService } from '../../services/modal.service';

@Component({
  selector: 'app-modal',
  templateUrl: './modal.component.html',
  styleUrls: ['./modal.component.scss'],
  standalone: true,
  imports: [CommonModule],
})
export class ModalComponent {
  public program_modal: any = {};
  public isVisible = false;
  constructor(private modalService: ModalService) {}

  ngOnInit(): void {
    this.isVisible = false;
    this.modalService.programa$.subscribe((program) => {
      this.program_modal = program;
      // si no esta vacio el objeto
      if (Object.keys(this.program_modal).length !== 0) {
        this.isVisible = true;
      }
    });
  }

  public closeModal() {
    this.isVisible = !this.isVisible;
    this.modalService.clearPrograma();
  }
}

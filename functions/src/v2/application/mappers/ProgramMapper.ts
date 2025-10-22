// src/v2/application/mappers/ProgramMapper.ts

import { Program } from '../../domain/entities/Program';
import { ProgramDTO } from '../dto/ProgramDTO';

export class ProgramMapper {
  static toDTO(program: Program): ProgramDTO {
    return {
      id: program.id,
      channelId: program.channelId,
      title: program.title,
      startTime: program.startTime.toISOString(),
      endTime: program.endTime.toISOString(),
      duration: program.duration,
      date: program.date,
      description: program.description,
      image: program.image,
      genre: program.genre,
    };
  }

  static toDTOList(programs: Program[]): ProgramDTO[] {
    return programs.map((p) => this.toDTO(p));
  }

  static toDomain(dto: ProgramDTO): Program {
    return Program.create({
      id: dto.id,
      channelId: dto.channelId,
      title: dto.title,
      startTime: new Date(dto.startTime),
      endTime: new Date(dto.endTime),
      description: dto.description,
      image: dto.image,
      genre: dto.genre,
    });
  }
}

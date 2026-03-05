// src/v2/application/mappers/ProgramMapper.ts

import { Program } from '../../domain/entities/Program';
import { ProgramDTO } from '../dto/ProgramDTO';

/**
 * Maps program entities to DTOs used in the presentation layer.
 */
export class ProgramMapper {
  /**
   * Serializes a single program.
   */
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

  /**
   * Normalized client-facing DTO for the unified Programs API.
   */
  static toClientDTO(
    program: Program,
    fields: 'minimal' | 'full' = 'full'
  ): {
    id: string;
    channelId: string;
    title: string;
    start: string;
    end: string;
    duration: number;
    category?: string;
    image?: string;
    rating?: string;
    description?: string;
  } {
    const base = {
      id: program.id,
      channelId: program.channelId,
      title: program.title,
      start: program.startTime.toISOString(),
      end: program.endTime.toISOString(),
      duration: program.duration,
      category: program.genre,
      image: program.image,
      description: program.description,
      rating: (program as any).rating,
    };

    if (fields === 'minimal') {
      const { description, ...rest } = base;
      return rest;
    }

    return {
      ...base,
      description: program.description,
    };
  }

  /**
   * Maps a list of programs into DTOs.
   */
  static toDTOList(programs: Program[]): ProgramDTO[] {
    return programs.map((p) => this.toDTO(p));
  }

  /**
   * Rehydrates a domain entity from a DTO payload.
   */
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

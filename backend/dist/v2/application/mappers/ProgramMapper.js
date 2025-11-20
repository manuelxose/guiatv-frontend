"use strict";
// src/v2/application/mappers/ProgramMapper.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProgramMapper = void 0;
const Program_1 = require("../../domain/entities/Program");
class ProgramMapper {
    static toDTO(program) {
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
    static toDTOList(programs) {
        return programs.map((p) => this.toDTO(p));
    }
    static toDomain(dto) {
        return Program_1.Program.create({
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
exports.ProgramMapper = ProgramMapper;
//# sourceMappingURL=ProgramMapper.js.map
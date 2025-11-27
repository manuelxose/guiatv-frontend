"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetProgramById = void 0;
const errors_1 = require("../../shared/errors");
const ProgramMapper_1 = require("../mappers/ProgramMapper");
class GetProgramById {
    constructor(programRepository) {
        this.programRepository = programRepository;
    }
    async execute(id) {
        const program = await this.programRepository.findById(id);
        if (!program) {
            throw new errors_1.NotFoundError('Program', id);
        }
        return { program: ProgramMapper_1.ProgramMapper.toClientDTO(program, 'full') };
    }
}
exports.GetProgramById = GetProgramById;
//# sourceMappingURL=GetProgramById.js.map
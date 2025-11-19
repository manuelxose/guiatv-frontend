"use strict";
// src/v2/application/use-cases/SyncProgramData.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.SyncProgramData = void 0;
const Program_1 = require("../../domain/entities/Program");
class SyncProgramData {
    constructor(programRepository, cacheRepository) {
        this.programRepository = programRepository;
        this.cacheRepository = cacheRepository;
    }
    async execute(request) {
        const programs = request.programs.map((p) => Program_1.Program.create(p));
        await this.programRepository.saveBatch(programs);
        if (request.clearCache) {
            await this.cacheRepository.clear('programs:*');
        }
    }
}
exports.SyncProgramData = SyncProgramData;
//# sourceMappingURL=SyncProgramData.js.map
import { IProgramRepository } from '../../domain/repositories/IProgramRepository';
import { NotFoundError } from '../../shared/errors';
import { ProgramMapper } from '../mappers/ProgramMapper';

export interface GetProgramByIdResponse {
  program: ReturnType<typeof ProgramMapper.toClientDTO>;
}

export class GetProgramById {
  constructor(private readonly programRepository: IProgramRepository) {}

  async execute(id: string): Promise<GetProgramByIdResponse> {
    const program = await this.programRepository.findById(id);
    if (!program) {
      throw new NotFoundError('Program', id);
    }
    return { program: ProgramMapper.toClientDTO(program, 'full') };
  }
}

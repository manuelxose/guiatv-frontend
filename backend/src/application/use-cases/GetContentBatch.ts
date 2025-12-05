import { IProgramRepository } from '@/domain/repositories/IProgramRepository';
import { IChannelRepository } from '@/domain/repositories/IChannelRepository';
import { MediaCardDTO } from '../dto/MediaDTO';
import { MediaMapper } from '../mappers/MediaMapper';
import { ChannelId } from '@/domain/value-objects/ChannelId';
import { Channel } from '@/domain/entities/Channel';

export interface GetContentBatchRequest {
  ids: string[];
}

export interface GetContentBatchResponse {
  items: MediaCardDTO[];
  notFound: string[];
}

/**
 * Retrieves multiple media cards by program ids, returning missing ids separately.
 */
export class GetContentBatch {
  constructor(
    private readonly programRepository: IProgramRepository,
    private readonly channelRepository: IChannelRepository
  ) {}

  /**
   * Fetches the requested items preserving the input order minus duplicates.
   */
  async execute(
    request: GetContentBatchRequest
  ): Promise<GetContentBatchResponse> {
    const uniqueIds = Array.from(new Set(request.ids.filter(Boolean)));
    const items: MediaCardDTO[] = [];
    const notFound: string[] = [];
    const channelCache = new Map<string, Channel | null>();

    for (const id of uniqueIds) {
      const program = await this.programRepository.findById(id);
      if (!program) {
        notFound.push(id);
        continue;
      }

      let channel = channelCache.get(program.channelId);
      if (channel === undefined) {
        channel = await this.channelRepository.findById(
          ChannelId.create(program.channelId)
        );
        channelCache.set(program.channelId, channel);
      }

      items.push(MediaMapper.fromProgram(program, channel));
    }

    return { items, notFound };
  }
}

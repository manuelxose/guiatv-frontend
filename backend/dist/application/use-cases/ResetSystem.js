"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResetSystem = void 0;
const dateUtils_1 = require("../../shared/utils/dateUtils");
const logger_1 = require("../../shared/utils/logger");
const Channel_model_1 = require("../../infrastructure/database/models/Channel.model");
const Program_model_1 = require("../../infrastructure/database/models/Program.model");
const Schedule_model_1 = require("../../infrastructure/database/models/Schedule.model");
class ResetSystem {
    constructor(cacheRepository, storageRepository, syncEPGData, precomputeSchedule) {
        this.cacheRepository = cacheRepository;
        this.storageRepository = storageRepository;
        this.syncEPGData = syncEPGData;
        this.precomputeSchedule = precomputeSchedule;
        this.resetLogger = logger_1.logger.child('ResetSystem');
        this.defaultSource = 'https://raw.githubusercontent.com/davidmuma/EPG_dobleM/master/guiatv_sincolor.xml.gz';
    }
    async execute(request = {}) {
        const syncedDates = [];
        // 1) Cache
        await this.cacheRepository.clear();
        this.resetLogger.info('Cache cleared');
        // 2) Mongo collections
        const channelDel = await Channel_model_1.ChannelModel.deleteMany({});
        const programDel = await Program_model_1.ProgramModel.deleteMany({});
        const scheduleDel = await Schedule_model_1.ScheduleModel.deleteMany({});
        this.resetLogger.info('Mongo collections truncated');
        // 3) Storage cleanup
        const storageStats = { epgXML: 0, schedules: 0, channelIcons: 0 };
        const prefixes = [
            { prefix: 'epg_xml/', key: 'epgXML' },
            { prefix: 'schedules/', key: 'schedules' },
            { prefix: 'channel_icons/', key: 'channelIcons' },
        ];
        for (const item of prefixes) {
            const files = await this.storageRepository.list(item.prefix);
            for (const file of files) {
                await this.storageRepository.delete(file);
                storageStats[item.key] += 1;
            }
        }
        this.resetLogger.info('Storage cleaned', storageStats);
        // 4) Re-synchronize EPG for canonical window
        const windowDates = ['yesterday', 'today', 'tomorrow', 'after_tomorrow'];
        for (const alias of windowDates) {
            const date = dateUtils_1.DateUtils.parseDateAlias(alias);
            await this.syncEPGData.execute({
                sourceUrl: request.sourceUrl || this.defaultSource,
                date,
                forceRefresh: true,
            });
            syncedDates.push(date);
        }
        // 5) Precompute
        await this.precomputeSchedule.precomputeCanonicalWindow(request.fields || 'full');
        return {
            cacheCleared: true,
            dbCleared: {
                channels: channelDel.deletedCount || 0,
                programs: programDel.deletedCount || 0,
                schedules: scheduleDel.deletedCount || 0,
            },
            storageCleared: storageStats,
            syncedDates,
            precomputed: true,
        };
    }
}
exports.ResetSystem = ResetSystem;
//# sourceMappingURL=ResetSystem.js.map
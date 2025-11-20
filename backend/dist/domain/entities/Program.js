"use strict";
// src/v2/domain/entities/Program.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.Program = void 0;
class Program {
    constructor(props) {
        this.props = props;
        this.validate();
    }
    static create(props) {
        return new Program(props);
    }
    validate() {
        if (!this.props.id?.trim()) {
            throw new Error('Program ID cannot be empty');
        }
        if (!this.props.channelId?.trim()) {
            throw new Error('Program channelId cannot be empty');
        }
        if (!this.props.title?.trim()) {
            throw new Error('Program title cannot be empty');
        }
        if (this.props.startTime >= this.props.endTime) {
            throw new Error('Start time must be before end time');
        }
        if (this.props.description && this.props.description.length > 500) {
            throw new Error('Description cannot exceed 500 characters');
        }
    }
    get id() {
        return this.props.id;
    }
    get channelId() {
        return this.props.channelId;
    }
    get title() {
        return this.props.title;
    }
    get startTime() {
        return this.props.startTime;
    }
    get endTime() {
        return this.props.endTime;
    }
    get duration() {
        return Math.round((this.props.endTime.getTime() - this.props.startTime.getTime()) /
            (1000 * 60));
    }
    get date() {
        const d = this.props.startTime;
        return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
    }
    get description() {
        return this.props.description;
    }
    get image() {
        return this.props.image;
    }
    get genre() {
        return this.props.genre;
    }
    toJSON() {
        return {
            ...this.props,
            startTime: this.props.startTime.toISOString(),
            endTime: this.props.endTime.toISOString(),
            duration: this.duration,
            date: this.date,
        };
    }
}
exports.Program = Program;
//# sourceMappingURL=Program.js.map
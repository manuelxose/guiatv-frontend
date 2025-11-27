"use strict";
// src/v2/domain/entities/Channel.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.Channel = void 0;
class Channel {
    constructor(props) {
        this.props = props;
        this.validate();
    }
    static create(props) {
        return new Channel(props);
    }
    validate() {
        if (!this.props.id || this.props.id.trim() === '') {
            throw new Error('Channel ID cannot be empty');
        }
        if (!this.props.name || this.props.name.trim() === '') {
            throw new Error('Channel name cannot be empty');
        }
        if (this.props.type === 'Autonomico' && !this.props.region) {
            throw new Error('Autonomico channels must have a region');
        }
        if (this.props.country && this.props.country.trim() === '') {
            throw new Error('Country, if provided, cannot be empty');
        }
    }
    get id() {
        return this.props.id;
    }
    get name() {
        return this.props.name;
    }
    get normalizedName() {
        return this.props.name
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');
    }
    get icon() {
        return this.props.icon;
    }
    get type() {
        return this.props.type;
    }
    get region() {
        return this.props.region;
    }
    get country() {
        return this.props.country;
    }
    get countryCode() {
        return this.props.countryCode;
    }
    get isActive() {
        return this.props.isActive;
    }
    toJSON() {
        return {
            ...this.props,
            normalizedName: this.normalizedName,
        };
    }
}
exports.Channel = Channel;
//# sourceMappingURL=Channel.js.map
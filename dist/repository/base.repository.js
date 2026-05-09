"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class BaseRepository {
    model;
    constructor(model) {
        this.model = model;
    }
    async create(data) {
        return this.model.create(data);
    }
    async findById(id) {
        return this.model.findById(id);
    }
    async findOne({ filter, projection, }) {
        return this.model.findOne(filter, projection);
    }
    async find({ filter, options, }) {
        return this.model
            .find(filter)
            .skip(options?.skip)
            .limit(options?.limit)
            .select(options?.select)
            .populate(options?.populate);
    }
    async findOneAndUpdate({ filter, update, options, }) {
        return this.model.findOneAndUpdate(filter, update, {
            new: true,
            ...options,
        });
    }
    async deleteOne({ filter }) {
        return this.model.deleteOne(filter);
    }
    async deleteMany({ filter }) {
        return this.model.deleteMany(filter);
    }
}
exports.default = BaseRepository;

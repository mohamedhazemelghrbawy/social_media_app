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
    async findOneAndDelete({ filter, options, }) {
        return this.model.findOneAndDelete(filter, {
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
    async paginate({ page, limit, sort, populate, search, }) {
        ((page = +page || 1), (limit = +limit || 1));
        if (page < 1) {
            page = 1;
        }
        if (limit < 1) {
            limit = 1;
        }
        const skip = (page - 1) * limit;
        const [data, totalDocs] = await Promise.all([
            await this.model
                .find({ ...(search ?? {}) })
                .limit(limit)
                .skip(skip)
                .sort(sort)
                .populate(populate),
            await this.model.countDocuments({ ...(search ?? {}) }),
        ]);
        const totalPages = Math.ceil(totalDocs / limit);
        return {
            meta: {
                currentPage: page,
                totalPages,
                limit,
                totalDocs,
            },
            data,
        };
    }
}
exports.default = BaseRepository;

import { QueryOptions, QueryFilter } from "mongoose";
import { HydratedDocument, Model, Types } from "mongoose";
import { AppError } from "../../common/utilts/global-error-handler";

abstract class BaseRepository<TDocument> {
  constructor(protected readonly model: Model<TDocument>) {}

  async create(data: Partial<TDocument>): Promise<HydratedDocument<TDocument>> {
    return this.model.create(data);
  }

  async findById(
    id: Types.ObjectId,
  ): Promise<HydratedDocument<TDocument> | null> {
    return this.model.findById(id);
  }

  async findOne({
    filter,
    options,
  }: {
    filter: QueryFilter<TDocument>;
    options?: QueryFilter<TDocument>;
  }): Promise<HydratedDocument<TDocument> | null> {
    return this.model
      .findOne(filter)
      .skip(options?.skip!)
      .limit(options?.limit!)
      .select(options?.select!)
      .populate(options?.populate as any);
  }

  async find({
    filter,
    options,
  }: {
    filter: QueryFilter<TDocument>;
    options?: QueryOptions;
  }): Promise<HydratedDocument<TDocument>[]> {
    return this.model
      .find(filter)
      .skip(options?.skip!)
      .limit(options?.limit!)
      .select(options?.select!)
      .populate(options?.populate as any);
  }

  async findOneAndUpdate({
    filter,
    update,
    options,
  }: {
    filter: QueryFilter<TDocument>;
    update: Partial<TDocument>;
    options?: QueryOptions;
  }): Promise<HydratedDocument<TDocument> | null> {
    return this.model.findOneAndUpdate(filter, update, {
      new: true,
      ...options,
    });
  }

  async findOneAndDelete({
    filter,
    options,
  }: {
    filter: QueryFilter<TDocument>;
    options?: QueryOptions;
  }): Promise<HydratedDocument<TDocument> | null> {
    return this.model.findOneAndDelete(filter, {
      new: true,
      ...options,
    });
  }

  async deleteOne({ filter }: { filter: QueryFilter<TDocument> }) {
    return this.model.deleteOne(filter);
  }

  async deleteMany({ filter }: { filter: QueryFilter<TDocument> }) {
    return this.model.deleteMany(filter);
  }

  async paginate<T>({
    page,
    limit,
    sort,
    populate,
    search,
  }: {
    page: number;
    limit: number;
    sort?: any;
    populate?: any;
    search?: QueryFilter<T>;
  }) {
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

export default BaseRepository;

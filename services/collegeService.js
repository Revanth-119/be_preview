//file that handles crud operations on colleges collection
import { College } from '../models/collegeModel.js';
import { ApiError } from '../utils/apiResponseWrappers.js';
import logger from '../utils/logger.js';

export class CollegeService {
  static async findEligibleColleges({ gender, seatType, rank, page = 1, pageSize = 10 }) {
    try {
      const query = {
        Gender: { $in: [gender, 'Gender-Neutral'] },
        'Seat Type': seatType,
        'Opening Rank': { $lte: rank },
        'Closing Rank': { $gte: rank },
        Year: 2022,
      };
      const [eligibleClgsResult, totalCountResult] = await Promise.allSettled([
        College.find(query)
          .select(['Institute', 'Academic Program Name'])
          .skip((page - 1) * pageSize)
          .limit(pageSize)
          .lean(),
        College.countDocuments(query),
      ]);
      if (eligibleClgsResult.status === 'rejected') {
        throw new ApiError(500, eligibleClgsResult.reason || 'error fetching college list');
      }
      if (totalCountResult.status === 'rejected') {
        throw new ApiError(500, totalCountResult.reason || 'error fetching total documents count');
      }
      return {
        colleges: eligibleClgsResult.value.map((c) => ({
          collegeName: c['Institute'],
          programName: c['Academic Program Name'],
          id: c['_id'],
        })),
        currentPage: page,
        totalDocuments: totalCountResult.value,
      };
    } catch (error) {
      logger.error(`error fetching college list ${error}`);
      throw new ApiError(500, 'error fetching college list', error);
    }
  }
  static async findComparedColleges(collegesArray) {
    try {
      const collegeIds = collegesArray.map((college) => college.id);

      const findPromises = collegeIds.map((id) =>
        College.findById(id)
          .select(['Institute', 'Academic Program Name', 'Opening Rank', 'Closing Rank'])
          .lean()
      );

      const results = await Promise.allSettled(findPromises);

      const errors = [];
      const foundColleges = [];

      results.forEach((result, idx) => {
        const collegeId = collegeIds[idx];
        if (result.status === 'fulfilled') {
          if (result.value) {
            foundColleges.push({
              id: result.value._id,
              collegeName: result.value.Institute,
              programName: result.value['Academic Program Name'],
              openingRank: result.value['Opening Rank'],
              closingRank: result.value['Closing Rank'],
            });
          } else {
            errors.push(`College with id ${collegeId} not found.`);
          }
        } else {
          errors.push(`Error fetching college with id ${collegeId}: ${result.reason}`);
        }
      });
      if (errors.length > 0) {
        throw new ApiError(404, 'Some colleges could not be found', errors);
      }
      return foundColleges;
    } catch (error) {
      logger.error(`Error in findComparedColleges: ${error}`);
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(500, 'Internal server error', error);
    }
  }
}

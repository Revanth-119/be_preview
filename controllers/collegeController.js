import { CollegeService } from '../services/collegeService.js';
import { ApiError, ApiResponse } from '../utils/apiResponseWrappers.js';
import asyncHandler from '../utils/asyncHandler.js';
import logger from '../utils/logger.js';

function isValidGender(g) {
  return ['Male', 'Female', 'Gender-Neutral'].includes(g);
}
function isPosInt(n) {
  return Number.isInteger(n) && n > 0;
}
function isValidPgSize(size) {
  return Number.isInteger(size) && size > 0 && size <= 100;
}
function validatePrefInput(body) {
  const errors = [];
  const { gender, seatType, rank, page = 1, pageSize = 10 } = body;
  if (!gender || !isValidGender(gender)) {
    errors.push({ field: 'gender', message: 'Invalid gender' });
  }
  if (!seatType || seatType.trim() === '') {
    errors.push({ field: 'seatType', message: 'Invalid SeatType' });
  }
  if (!rank || !isPosInt(Number(rank))) {
    errors.push({ field: 'rank', message: 'Rank must be positive integer' });
  }
  if (page && !isPosInt(Number(page))) {
    errors.push({ field: 'page', message: 'Page must be positive integer' });
  }
  if (pageSize && !isValidPgSize(Number(pageSize))) {
    errors.push({ field: 'pageSize', message: 'Page size must be between 1 & 100' });
  }
  if (errors.length > 0) {
    throw new ApiError(400, 'Invalid fields', errors);
  }
  return {
    gender,
    seatType,
    rank: Number(rank),
    page: Number(page),
    pageSize: Number(pageSize),
  };
}

function validateCompareInput(body) {
  const errors = [];
  const { data: colleges } = body;

  if (!colleges) {
    errors.push({ field: 'colleges', message: 'Colleges details are required' });
  } else {
    if (colleges.length === 0) {
      errors.push({ field: 'colleges', message: 'At least one college must be provided' });
    }
    if (colleges.length > 3) {
      errors.push({ field: 'colleges', message: 'Provide atmost 3 colleges for comparision' });
    }
    colleges.forEach((college, index) => {
      if (!college.id || typeof college.id !== 'string') {
        errors.push({
          field: `colleges[${index}].id`,
          message: 'College id is required and must be a string',
        });
      }
    });
  }
  if (errors.length > 0) {
    throw new ApiError(400, 'Invalid fields', errors);
  }
  return {
    colleges,
  };
}

const findEligibleColleges = asyncHandler(async (req, res) => {
  const validatedIp = validatePrefInput(req.body);
  const result = await CollegeService.findEligibleColleges(validatedIp);

  return res.status(200).json(new ApiResponse(200, result, 'colleges fetched successfully'));
});

const findComparedColleges = asyncHandler(async (req, res) => {
  const { colleges } = validateCompareInput(req.body);
  const comparedColleges = await CollegeService.findComparedColleges(colleges);

  return res
    .status(200)
    .json(new ApiResponse(200, comparedColleges, 'Compared colleges fetched successfully'));
});

export default { findEligibleColleges, findComparedColleges };

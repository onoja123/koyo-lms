const Course = require('../models/course');
const { getAllVideos } = require('../controller/lectureController');

jest.mock('../models/course');

describe('getAllVideos controller', () => {
  let req;
  let res;
  let mockCourse;

  beforeEach(() => {
    req = {
      params: { courseId: 'courseId123' },
    };
    res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };
    mockCourse = {
      _id: 'courseId123',
      getVideos: jest.fn(),
    };
  });

  it('should return all videos for a valid course', async () => {
    mockCourse.getVideos.mockResolvedValue(['video1', 'video2']);
    Course.findById.mockResolvedValue(mockCourse);

    await getAllVideos(req, res);

    expect(Course.findById).toHaveBeenCalledWith(req.params.courseId);
    expect(mockCourse.getVideos).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(['video1', 'video2']);
  });

  it('should return an empty array if there are no videos associated with the course', async () => {
    mockCourse.getVideos.mockResolvedValue([]);
    Course.findById.mockResolvedValue(mockCourse);

    await getAllVideos(req, res);

    expect(Course.findById).toHaveBeenCalledWith(req.params.courseId);
    expect(mockCourse.getVideos).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith([]);
  });

  it('should handle errors when retrieving videos', async () => {
    const errorMessage = 'Error retrieving videos';
    Course.findById.mockRejectedValue(new Error(errorMessage));

    await getAllVideos(req, res);

    expect(Course.findById).toHaveBeenCalledWith(req.params.courseId);
    expect(mockCourse.getVideos).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: errorMessage });
  });
});

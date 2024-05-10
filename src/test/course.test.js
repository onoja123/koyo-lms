console.log = jest.fn();
const Course = require('../models/course');
const { getAllCourses } = require('../controller/courseController');

jest.mock('../models/course');

describe('getAllCourses', () => {
  let req;
  let res;

  beforeEach(() => {
    req = {
      user: {
        _id: 'userId'
      },
      query: {
        filter: 'active'
      }
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
  });

  it('should return all courses if no filter is provided', async () => {
    const coursesMock = [
      { _id: 'courseId1', name: 'Course 1', status: 'active' },
      { _id: 'courseId2', name: 'Course 2', status: 'inactive' },
    ];
  
    const activeCoursesMock = [{ _id: 'courseId1', name: 'Course 1', status: 'active' }];
  
    Course.getCoursesWithPrivilege.mockResolvedValue(coursesMock);
  
    await getAllCourses(req, res);
  
    expect(Course.getCoursesWithPrivilege).toHaveBeenCalledWith('userId');
    expect(res.json).toHaveBeenCalledWith(activeCoursesMock); 
  });

  it('should return filtered courses if filter is provided', async () => {
    const coursesMock = [
      { _id: 'courseId1', name: 'Course 1', status: 'active' },
      { _id: 'courseId2', name: 'Course 2', status: 'inactive' },
    ];

    const filteredCoursesMock = [{ _id: 'courseId1', name: 'Course 1', status: 'active' }];

    Course.getCoursesWithPrivilege.mockResolvedValue(coursesMock);

    req.query.filter = 'active'; 

    await getAllCourses(req, res);

    expect(Course.getCoursesWithPrivilege).toHaveBeenCalledWith('userId');
    expect(res.json).toHaveBeenCalledWith(filteredCoursesMock);
  });

  it('should handle errors', async () => {
    const errorMock = new Error('Test error');

    Course.getCoursesWithPrivilege.mockRejectedValue(errorMock);

    await getAllCourses(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: errorMock.message });
  });
});

const Course = require('../models/course');
const { createModule } = require('../controller/moduleController');

jest.mock('../models/course');

describe('createModule controller', () => {
  let mockCourse;
  let req;
  let res;

  beforeEach(() => {
    mockCourse = {
      _id: 'courseId123',
      modules: {
        push: jest.fn(),
      },
      modulesJSON: jest.fn().mockReturnValue([]), 
      save: jest.fn().mockResolvedValue(mockCourse),
    };
    req = {
      params: { courseId: 'courseId123' },
      body: { title: 'Module Title' },
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  
    Course.findById = jest.fn().mockResolvedValue(mockCourse); 
    Course.findById.mockClear(); 
  });
  

  it('should create a new module for a valid course', async () => {
    await createModule(req, res);
    expect(mockCourse.modules.push).toHaveBeenCalledWith({ title: req.body.title });
  });

  it('should return 400 for missing title', async () => {
    req.body = {}; 
    await createModule(req, res);

    expect(Course.findById).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'missing Module title' });
  });

  it('should return 400 on Course.findById error', async () => {

    Course.findById.mockRejectedValue(new Error('Find by ID failed'));

    await createModule(req, res);

    expect(Course.findById).toHaveBeenCalled();
    expect(mockCourse.modules.push).not.toHaveBeenCalled();
    expect(mockCourse.save).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'Find by ID failed' }))
  });

  it('should return 400 on Course.save error', async () => {
    mockCourse.save.mockRejectedValue(new Error('Save failed'));
    await createModule(req, res);

    expect(Course.findById).toHaveBeenCalled();
    expect(mockCourse.modules.push).toHaveBeenCalled();
    expect(mockCourse.save).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'Save failed' }))
  });
});



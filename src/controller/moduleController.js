const Course = require('../models/course')

const getAllModules = async (request, response) => {
  try {
    const course = await Course.findById(request.params.courseId).orFail()
    return response.json(course.modulesJSON())
  } catch (err) {
    console.log(err)
    response.status(400).json({ error: err.message || err.toString() })
  }
}

const getOneModule = async (request, response) => {
  try {
    const course = await Course.findById(request.params.courseId).orFail()
    const result = course.modules.id(request.params.id)
    if (!result) return response.status(404).json({ error: 'module not found' })

    return response.json(result.toJSON())
  } catch (err) {
    console.log(err)
    response.status(400).json({ error: err.message || err.toString() })
  }
}

const createModule = async (request, response) => {
  const body = request.body
  if (!body.title)
    return response.status(400).json({ error: 'missing Module title' })

  try {
    const course = await Course.findById(request.params.courseId).orFail()
    await course.modules.push({ title: body.title })
    const updatedCourse = await course.save()

    return response.json(updatedCourse.modulesJSON())
  } catch (err) {
    console.log(err)
    response.status(400).json({ error: err.message || err.toString() })
  }
}

const updateModule = async (request, response) => {
  const body = request.body
  if (!body.title) return response.status(400).json({ error: 'missing title' })

  try {
    const course = await Course.findById(request.params.courseId).orFail()
    const updatedModule = course.modules.id(request.params.id)
    if (!updatedModule)
      return response.status(404).json({ error: 'module not found' })

    updatedModule.title = body.title
    updatedModule.markModified('modules')
    const result = await course.save()

    // return all modules with update
    return response.json(result.modulesJSON())
  } catch (err) {
    console.log(err)
    response.status(400).json({ error: err.message || err.toString() })
  }
}

const deleteModule = async (request, response) => {
  try {
    const { courseId, id } = request.params;

    const course = await Course.findByIdAndUpdate(
      courseId,
      { $pull: { modules: { _id: id } } },
      { new: true }
    );

    // if (!course)
    //   return response.status(404).json({ error: 'Course not found' });

    const deletedModule = course.modules.id(id);

    // if (!deletedModule)
    //   return response.status(404).json({ error: 'Module not found' });

    response.json(course.modulesJSON());
  } catch (err) {
    console.error(err);
    response.status(500).json({ error: 'Internal Server Error' });
  }
};



module.exports = {
  getAllModules,
  getOneModule,
  createModule,
  updateModule,
  deleteModule
}

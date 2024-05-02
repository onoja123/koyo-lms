const Course = require('../models/course')
const fs = require('fs')

// the return value for all endpoints is all the modules for the course

const createModuleItem = async (request, response) => {
  const body = request.body

  if (!body.title)
    return response.status(400).json({ error: 'missing module item title' })
  if (!body.type)
    return response.status(400).json({ error: 'missing module item type' })
  if (!body.url)
    return response.status(400).json({ error: 'missing module item url' })

  try {
    const course = await Course.findById(request.params.courseId).orFail()

    const updatedModule = course.modules.id(request.params.moduleId)
    if (!updatedModule)
      return response.status(404).json({ error: 'module not found' })

    await updatedModule.moduleItems.push({
      title: body.title,
      type: body.type,
      url: body.url
    })

    const updatedCourse = await course.save()

    return response.json(updatedCourse.modulesJSON())
  } catch (err) {
    console.log(err)
    response.status(400).json({ error: err.message || err.toString() })
  }
}

const updateModuleItem = async (request, response) => {
  const body = request.body

  try {
    const course = await Course.findById(request.params.courseId).orFail()

    const updatedModule = course.modules.id(request.params.moduleId)
    if (!updatedModule)
      return response.status(404).json({ error: 'module not found' })

    const updatedModuleItem = updatedModule.moduleItems.id(request.params.id)

    if (!updatedModuleItem)
      return response.status(404).json({ error: 'module item not found' })

    if (body.title) updatedModuleItem.title = body.title
    if (body.type) updatedModuleItem.type = body.type
    if (body.url) updatedModuleItem.url = body.url

    const updatedCourse = await course.save()

    return response.json(updatedCourse.modulesJSON())
  } catch (err) {
    console.log(err)
    response.status(400).json({ error: err.message || err.toString() })
  }
}

const deleteModuleItem = async (request, response) => {
  try {
    const { courseId, moduleId, id } = request.params;

    const course = await Course.findById(courseId);
    if (!course) {
      return response.status(404).json({ error: 'Course not found' });
    }

    const module = course.modules.id(moduleId);
    if (!module) {
      return response.status(404).json({ error: 'Module not found' });
    }

    const moduleItem = module.moduleItems.id(id);
    if (!moduleItem) {
      return response.status(404).json({ error: 'Module item not found' });
    }

    module.moduleItems.pull(id);

    const updatedCourse = await course.save();
    
    response.json(updatedCourse.modulesJSON());
  } catch (error) {
    console.error(error);
    response.status(500).json({ error: 'Internal server error' });
  }
}



module.exports = {
  createModuleItem,
  updateModuleItem,
  deleteModuleItem
}

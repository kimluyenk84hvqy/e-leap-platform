// E-LEAP Course Loader v1.0
// Load Course -> Unit -> Lesson structure

export async function loadJSON(path) {
  const response = await fetch(path);

  if (!response.ok) {
    throw new Error("Cannot load: " + path);
  }

  return await response.json();
}


export async function loadCourse(coursePath) {

  const course = await loadJSON(coursePath);

  const basePath = coursePath.replace("/course.json", "");

  for (const unit of course.units || []) {

    const unitPath = `${basePath}/${unit.path}`;

    unit.data = await loadJSON(unitPath);

    for (const lesson of unit.data.lessons || []) {

      const lessonPath = `${basePath}/${unit.path.replace("/unit.json","")}/${lesson.path}`;

      lesson.data = await loadJSON(lessonPath);

    }
  }

  return course;
}

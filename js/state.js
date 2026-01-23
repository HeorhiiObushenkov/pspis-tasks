export const state = {
    subjects: [],
    currentSubjectId: null,
    cache: {},
    tasks: JSON.parse(localStorage.getItem('semester_tasks') || '{}')
};

export function saveTasks(tasks) {
    localStorage.setItem('semester_tasks', JSON.stringify(tasks));
}

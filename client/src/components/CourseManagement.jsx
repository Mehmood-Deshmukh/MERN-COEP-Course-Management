import React, { useState, useEffect } from 'react';
import { ChevronDown, Check, AlertCircle, Info, RefreshCw, Save } from 'lucide-react';

const TeacherAssignmentSystem = () => {
  const [teachers, setTeachers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [assignments, setAssignments] = useState([]);

  // Fetch teachers on component mount
  useEffect(() => {
    fetchTeachers();
    fetchCourses(1);
  }, []);

  const fetchTeachers = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/teachers/all');
      const data = await response.json();
      
      if (data.success) {
        setTeachers(data.data);
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to fetch teachers' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to fetch teachers' });
      console.error('Error fetching teachers:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCourses = async (page) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/courses/?limit=10&page=${page}`);
      const data = await response.json();
      
      if (data.success) {
        setCourses(data.data);
        setCurrentPage(data.page);
        setTotalPages(data.totalPages);
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to fetch courses' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to fetch courses' });
      console.error('Error fetching courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignTeacher = (courseId, teacherId, type, value) => {
    // Find if there's an existing assignment for this course-teacher pair
    const existingAssignmentIndex = assignments.findIndex(
      a => a.courseId === courseId && a.teacherId === teacherId
    );

    // Get course info
    const course = courses.find(c => c._id === courseId);
    
    if (existingAssignmentIndex > -1) {
      // Update existing assignment
      const updatedAssignments = [...assignments];
      
      if (type === 'division') {
        updatedAssignments[existingAssignmentIndex].divisions = value;
      } else if (type === 'batch') {
        updatedAssignments[existingAssignmentIndex].batches = value;
      }
      
      setAssignments(updatedAssignments);
    } else {
      // Create new assignment
      const newAssignment = {
        teacherId,
        courseId,
        divisions: type === 'division' ? value : 0,
        batches: type === 'batch' ? value : 0,
      };
      
      setAssignments([...assignments, newAssignment]);
    }
  };

  const calculateAssignedLoad = (teacherId) => {
    return assignments
      .filter(a => a.teacherId === teacherId)
      .reduce((total, assignment) => {
        const course = courses.find(c => c._id === assignment.courseId);
        if (!course) return total;
        
        const lectLoad = assignment.divisions * course.lectHrs;
        const labLoad = assignment.batches * course.labHrs;
        
        return total + lectLoad + labLoad;
      }, 0);
  };

  const getRemainingLoad = (teacherId) => {
    const teacher = teachers.find(t => t._id === teacherId);
    if (!teacher) return 0;
    
    const assignedLoad = calculateAssignedLoad(teacherId);
    return teacher.loadLimit - assignedLoad;
  };

  const getRemainingDivisions = (courseId) => {
    const course = courses.find(c => c._id === courseId);
    if (!course) return 0;
    
    const assignedDivisions = assignments
      .filter(a => a.courseId === courseId)
      .reduce((total, assignment) => total + assignment.divisions, 0);
    
    return course.divisions - assignedDivisions;
  };

  const getRemainingBatches = (courseId) => {
    const course = courses.find(c => c._id === courseId);
    if (!course) return 0;
    
    const assignedBatches = assignments
      .filter(a => a.courseId === courseId)
      .reduce((total, assignment) => total + assignment.batches, 0);
    
    return course.batches - assignedBatches;
  };

  // Get the list of teachers already assigned to this course
  const getAssignedTeachers = (courseId) => {
    return assignments
      .filter(a => a.courseId === courseId)
      .map(a => a.teacherId);
  };

  const handleSubmitAssignments = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/assignments/assign/multiple', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ assignments }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setMessage({ type: 'success', text: data.message || 'Teachers assigned successfully!' });
        setAssignments([]);
        // Refresh teacher data to show updated loads
        fetchTeachers();
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to assign teachers' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to assign teachers' });
      console.error('Error assigning teachers:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-800">Teacher Assignment System</h1>
            <div className="flex space-x-3">
              <button 
                onClick={() => fetchCourses(currentPage)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded flex items-center border border-gray-300 hover:bg-gray-200 transition-colors"
              >
                <RefreshCw size={16} className="mr-2" />
                Refresh
              </button>
              <button 
                onClick={handleSubmitAssignments} 
                disabled={assignments.length === 0 || loading}
                className="px-4 py-2 bg-blue-600 text-white rounded flex items-center shadow-sm hover:bg-blue-700 transition-colors disabled:bg-blue-300"
              >
                <Save size={16} className="mr-2" />
                {loading ? 'Saving...' : 'Save All Assignments'}
              </button>
            </div>
          </div>
          
          {message && (
            <div className={`p-4 mb-6 rounded-md border ${message.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'} flex items-center`}>
              {message.type === 'success' ? <Check size={18} className="mr-2 flex-shrink-0" /> : <AlertCircle size={18} className="mr-2 flex-shrink-0" />}
              <span>{message.text}</span>
            </div>
          )}
          
          <div className="mb-4 flex justify-between items-center">
            <div className="text-sm text-gray-600 flex items-center">
              <Info size={14} className="mr-1" />
              <span>Showing {courses.length} course(s) from page {currentPage} of {totalPages}</span>
            </div>
            <div className="flex items-center space-x-1">
              <button 
                onClick={() => fetchCourses(currentPage - 1)} 
                disabled={currentPage <= 1 || loading}
                className="px-3 py-1 rounded-md border border-gray-300 text-gray-700 disabled:text-gray-400 disabled:bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                Previous
              </button>
              <div className="px-3 py-1 text-gray-700">Page {currentPage} of {totalPages}</div>
              <button 
                onClick={() => fetchCourses(currentPage + 1)} 
                disabled={currentPage >= totalPages || loading}
                className="px-3 py-1 rounded-md border border-gray-300 text-gray-700 disabled:text-gray-400 disabled:bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
          
          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Course</th>
                  <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Curriculum/Sem</th>
                  <th scope="col" className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Divisions</th>
                  <th scope="col" className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Batches</th>
                  <th scope="col" className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Lect. Load</th>
                  <th scope="col" className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Lab Load</th>
                  <th scope="col" className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Total Load</th>
                  <th scope="col" className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider" colSpan={6}>Teacher Assignments</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {courses.map((course) => {
                  const remainingDivisions = getRemainingDivisions(course._id);
                  const remainingBatches = getRemainingBatches(course._id);
                  const remainingLectLoad = remainingDivisions * course.lectHrs;
                  const remainingLabLoad = remainingBatches * course.labHrs;
                  const assignedTeachers = getAssignedTeachers(course._id);
                  
                  return (
                    <tr key={course._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-3 py-3 whitespace-normal text-sm text-gray-900">{course.subject}</td>
                      <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-900">{course.curriculum} / {course.sem}</td>
                      <td className="px-3 py-3 whitespace-nowrap text-sm text-center">
                        <span className={`font-medium ${remainingDivisions === 0 ? 'text-green-600' : 'text-gray-900'}`}>
                          {course.divisions - remainingDivisions}/{course.divisions}
                        </span>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap text-sm text-center">
                        <span className={`font-medium ${remainingBatches === 0 ? 'text-green-600' : 'text-gray-900'}`}>
                          {course.batches - remainingBatches}/{course.batches}
                        </span>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap text-sm text-center">
                        <span className={`font-medium ${remainingLectLoad === 0 ? 'text-green-600' : 'text-gray-900'}`}>
                          {course.reqLectLoad - remainingLectLoad}/{course.reqLectLoad}
                        </span>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap text-sm text-center">
                        <span className={`font-medium ${remainingLabLoad === 0 ? 'text-green-600' : 'text-gray-900'}`}>
                          {course.reqLabLoad - remainingLabLoad}/{course.reqLabLoad}
                        </span>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap text-sm text-center">
                        <span className={`font-medium ${remainingLectLoad + remainingLabLoad === 0 ? 'text-green-600' : 'text-gray-900'}`}>
                          {course.reqTotalLoad - (remainingLectLoad + remainingLabLoad)}/{course.reqTotalLoad}
                        </span>
                      </td>
                      
                      {Array.from({ length: 6 }).map((_, index) => (
                        <td key={index} className="px-1 py-3">
                          <TeacherSelector 
                            teachers={teachers}
                            courseId={course._id}
                            course={course}
                            remainingDivisions={remainingDivisions}
                            remainingBatches={remainingBatches}
                            onAssign={handleAssignTeacher}
                            getRemainingLoad={getRemainingLoad}
                            assignedTeachers={assignedTeachers}
                            disabled={remainingDivisions === 0 && remainingBatches === 0}
                            index={index}
                          />
                        </td>
                      ))}
                    </tr>
                  );
                })}
                
                {courses.length === 0 && (
                  <tr>
                    <td colSpan={13} className="px-3 py-4 text-center text-sm text-gray-500">
                      {loading ? 'Loading courses...' : 'No courses available'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          <div className="mt-4 flex justify-center">
            <div className="inline-flex rounded-md shadow-sm">
              <button 
                onClick={() => fetchCourses(1)} 
                disabled={currentPage <= 1 || loading}
                className="px-3 py-1 rounded-l-md border border-gray-300 text-gray-700 font-medium hover:bg-gray-100 disabled:bg-gray-50 disabled:text-gray-400"
              >
                First
              </button>
              <button 
                onClick={() => fetchCourses(currentPage - 1)} 
                disabled={currentPage <= 1 || loading}
                className="px-3 py-1 border-t border-b border-r border-gray-300 text-gray-700 font-medium hover:bg-gray-100 disabled:bg-gray-50 disabled:text-gray-400"
              >
                Previous
              </button>
              <span className="px-3 py-1 border-t border-b border-gray-300 text-gray-700 font-medium bg-gray-100">
                {currentPage} of {totalPages}
              </span>
              <button 
                onClick={() => fetchCourses(currentPage + 1)} 
                disabled={currentPage >= totalPages || loading}
                className="px-3 py-1 border-t border-b border-r border-gray-300 text-gray-700 font-medium hover:bg-gray-100 disabled:bg-gray-50 disabled:text-gray-400"
              >
                Next
              </button>
              <button 
                onClick={() => fetchCourses(totalPages)} 
                disabled={currentPage >= totalPages || loading}
                className="px-3 py-1 rounded-r-md border-t border-b border-r border-gray-300 text-gray-700 font-medium hover:bg-gray-100 disabled:bg-gray-50 disabled:text-gray-400"
              >
                Last
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Teacher selector component with division and batch assignment options
const TeacherSelector = ({ teachers, courseId, course, remainingDivisions, remainingBatches, onAssign, getRemainingLoad, assignedTeachers, disabled, index }) => {
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [divisions, setDivisions] = useState(0);
  const [batches, setBatches] = useState(0);
  const [showAssignmentOptions, setShowAssignmentOptions] = useState(false);

  const handleSelectTeacher = (teacher) => {
    setSelectedTeacher(teacher);
    setIsOpen(false);
    setShowAssignmentOptions(true);
  };

  const handleAssign = () => {
    if (selectedTeacher && (divisions > 0 || batches > 0)) {
      onAssign(courseId, selectedTeacher._id, 'division', divisions);
      onAssign(courseId, selectedTeacher._id, 'batch', batches);
      setShowAssignmentOptions(false);
    }
  };

  // Calculate required load
  const requiredLoad = (divisions * course.lectHrs) + (batches * course.labHrs);

  // Filter teachers that:
  // 1. Have enough remaining load
  // 2. Are not already assigned to this course
  const availableTeachers = teachers.filter(teacher => {
    const hasEnoughLoad = getRemainingLoad(teacher._id) >= requiredLoad;
    const isAlreadyAssigned = assignedTeachers.includes(teacher._id);
    return hasEnoughLoad && !isAlreadyAssigned && teacher.loadLimit > 0;
  });

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled || assignedTeachers.length >= 6}
        className={`w-full flex items-center justify-between px-2 py-1 text-sm border rounded-md shadow-sm
        ${(disabled || assignedTeachers.length >= 6) ? 'bg-gray-50 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50'}
        ${selectedTeacher ? 'border-blue-300' : 'border-gray-300'}`}
      >
        <span className="truncate max-w-full">
          {selectedTeacher ? selectedTeacher.name : index < assignedTeachers.length ? 'Assigned' : 'Assign'}
        </span>
        <ChevronDown size={14} className="flex-shrink-0 ml-1" />
      </button>

      {isOpen && (
        <div className="absolute z-10 mt-1 w-64 bg-white rounded-md shadow-lg border border-gray-200 max-h-64 overflow-y-auto">
          <div className="py-1">
            {availableTeachers.map(teacher => {
              const remainingLoad = getRemainingLoad(teacher._id);
              const loadPercentage = (remainingLoad / teacher.loadLimit) * 100;
              
              return (
                <div 
                  key={teacher._id}
                  className="px-3 py-2 hover:bg-blue-50 cursor-pointer transition-colors"
                  onClick={() => handleSelectTeacher(teacher)}
                >
                  <div className="flex justify-between items-center">
                    <div className="font-medium text-gray-900">{teacher.name}</div>
                    <div className="text-xs text-gray-500">{teacher.position}</div>
                  </div>
                  <div className="mt-1">
                    <div className="flex justify-between text-xs text-gray-600 mb-1">
                      <span>Load: {teacher.loadLimit - remainingLoad}/{teacher.loadLimit}</span>
                      <span>{Math.round(100 - loadPercentage)}% used</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div 
                        className={`h-1.5 rounded-full ${loadPercentage > 50 ? 'bg-green-500' : loadPercentage > 25 ? 'bg-yellow-500' : 'bg-red-500'}`}
                        style={{ width: `${100 - loadPercentage}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              );
            })}
            
            {availableTeachers.length === 0 && (
              <div className="px-3 py-3 text-sm text-gray-500 text-center">
                {assignedTeachers.length >= 6 
                  ? "Maximum of 6 teachers already assigned to this course" 
                  : "No available teachers with sufficient load capacity"}
              </div>
            )}
          </div>
        </div>
      )}

      {showAssignmentOptions && selectedTeacher && (
        <div className="absolute z-10 mt-1 w-64 bg-white rounded-md shadow-lg border border-blue-200 p-3">
          <div className="text-sm font-medium text-gray-900 mb-2">{selectedTeacher.name}</div>
          
          <div className="mb-3">
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Divisions ({course.lectHrs} hr/div)
            </label>
            <div className="flex items-center">
              <input 
                type="number" 
                min="0" 
                max={remainingDivisions}
                value={divisions} 
                onChange={(e) => {
                  const value = Math.min(parseInt(e.target.value) || 0, remainingDivisions);
                  setDivisions(value);
                }}
                className="block w-full px-2 py-1 text-sm border rounded shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
              <span className="ml-2 text-xs text-gray-500">Max: {remainingDivisions}</span>
            </div>
          </div>
          
          <div className="mb-3">
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Batches ({course.labHrs} hr/batch)
            </label>
            <div className="flex items-center">
              <input 
                type="number" 
                min="0" 
                max={remainingBatches}
                value={batches} 
                onChange={(e) => {
                  const value = Math.min(parseInt(e.target.value) || 0, remainingBatches);
                  setBatches(value);
                }}
                className="block w-full px-2 py-1 text-sm border rounded shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
              <span className="ml-2 text-xs text-gray-500">Max: {remainingBatches}</span>
            </div>
          </div>
          
          <div className="flex items-center text-xs text-gray-600 mb-3">
            <span>Total load: </span>
            <span className="ml-1 font-medium">
              {(divisions * course.lectHrs) + (batches * course.labHrs)}
            </span>
            <span className="ml-1">hrs</span>
            <span className="ml-auto">
              Remaining: {getRemainingLoad(selectedTeacher._id)} hrs
            </span>
          </div>

          {getRemainingLoad(selectedTeacher._id) < requiredLoad && (
            <div className="mb-3 p-2 bg-red-50 text-red-700 text-xs rounded border border-red-200">
              <AlertCircle size={12} className="inline mr-1" />
              Not enough remaining load capacity
            </div>
          )}
          
          <div className="flex justify-between">
            <button 
              onClick={handleAssign}
              disabled={(divisions === 0 && batches === 0) || getRemainingLoad(selectedTeacher._id) < requiredLoad}
              className="px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:bg-blue-300 shadow-sm transition-colors"
            >
              Assign
            </button>
            <button 
              onClick={() => setShowAssignmentOptions(false)}
              className="px-3 py-1 bg-gray-100 text-gray-700 text-sm border border-gray-300 rounded-md hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherAssignmentSystem;
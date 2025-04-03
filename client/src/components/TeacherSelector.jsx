import React, { useState, useEffect, useRef } from "react";
import { Plus, Minus, Edit, ChevronDown, X, AlertCircle } from "lucide-react";

const TeacherSelector = ({
  teachers,
  courseId,
  course,
  remainingDivisions,
  remainingBatches,
  onAssign,
  getRemainingLoad,
  assignedTeachers,
  disabled,
  index,
  assignments,
  setAssignments,
}) => {
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [divisions, setDivisions] = useState(0);
  const [batches, setBatches] = useState(0);
  const [showAssignmentOptions, setShowAssignmentOptions] = useState(false);
  const [assignmentPreview, setAssignmentPreview] = useState(null);
  const dropdownRef = useRef(null);
  const [assignment, setAssignment] = useState(null);

  useEffect(() => {
    const _assignments = assignments.filter((a) => a.courseId === courseId);
    if (index < _assignments.length) {
      const _assignment = _assignments[index];
      setAssignment(_assignment);
      setDivisions(_assignment.divisions);
      setBatches(_assignment.batches);
      const teacher = teachers.find((t) => t._id === _assignment.teacherId);
      if (teacher) {
        setSelectedTeacher(teacher);
        setAssignmentPreview({
          teacherId: teacher._id,
          teacherName: teacher.name,
          divisions: _assignment.divisions,
          batches: _assignment.batches,
        });
      }
    }

    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const _assignment = assignments.find(
      (assignment) =>
        assignment.courseId === courseId &&
        assignment.teacherId === selectedTeacher?._id
    );
    if (_assignment) {
      setAssignment(_assignment);
    }
  }, [selectedTeacher, assignments, courseId]);

  useEffect(() => {
    if (index < assignedTeachers.length) {
      const assignedTeacherId = assignedTeachers[index];
      const teacher = teachers.find((t) => t._id === assignedTeacherId);
      
      if (assignment?.divisions === 0 && assignment?.batches === 0) {
        setAssignmentPreview(null);
        setSelectedTeacher(null);
      } else if (
        teacher &&
        (assignment?.divisions > 0 || assignment?.batches > 0)
      ) {
        setSelectedTeacher(teacher);
        setAssignmentPreview({
          teacherId: teacher._id,
          teacherName: teacher.name,
          divisions: assignment?.divisions || 0,
          batches: assignment?.batches || 0,
        });
      }
    }
  }, [
    assignedTeachers,
    index,
    teachers,
    assignment?.divisions,
    assignment?.batches,
  ]);

  const handleSelectTeacher = (teacher) => {
    setSelectedTeacher(teacher);
    setIsOpen(false);
    setShowAssignmentOptions(true);
  };

  const handleAssign = () => {
    if (selectedTeacher) {
      setAssignmentPreview({
        teacherId: selectedTeacher._id,
        teacherName: selectedTeacher.name,
        divisions,
        batches,
      });
      onAssign(courseId, selectedTeacher._id, divisions, batches);
      setShowAssignmentOptions(false);
    }
  };

  const handleEditAssignment = () => {
    setShowAssignmentOptions(true);
    if (assignmentPreview) {
      setDivisions(assignmentPreview.divisions);
      setBatches(assignmentPreview.batches);
    }
  };

  // Calculate required load
  const requiredLoad = divisions * course.lectHrs + batches * course.labHrs;
  
  // Filter teachers that have enough remaining load and are not already assigned
  const availableTeachers = teachers.filter((teacher) => {
    const hasEnoughLoad = getRemainingLoad(teacher._id) >= requiredLoad;
    
    // Allow the currently selected teacher to appear in the dropdown
    if (selectedTeacher && teacher._id === selectedTeacher._id) {
      return true;
    }
    
    const isAlreadyAssigned = assignedTeachers
      .filter((id) => id !== (selectedTeacher?._id || ""))
      .includes(teacher._id);
      
    return hasEnoughLoad && !isAlreadyAssigned && teacher.loadLimit > 0;
  });

  const disableAssignButton = divisions === 0 && batches === 0;
  const isFullyAssigned = remainingDivisions === 0 && remainingBatches === 0;

  return (
    <div className="relative w-full">
      {assignmentPreview ? (
        <div className="w-full bg-white border rounded-md shadow-sm p-2 space-y-2">
          <div className="flex justify-between items-center">
            <span className="font-medium text-sm text-gray-800 truncate">
              {assignmentPreview.teacherName}
            </span>
            <button
              onClick={handleEditAssignment}
              disabled={isFullyAssigned && !assignmentPreview.divisions && !assignmentPreview.batches}
              className={`p-1 rounded-md hover:bg-gray-100 ${
                isFullyAssigned && !assignmentPreview.divisions && !assignmentPreview.batches
                  ? "text-gray-300 cursor-not-allowed"
                  : "text-blue-600"
              }`}
            >
              <Edit size={14} />
            </button>
          </div>
          <div className="flex flex-wrap gap-1 text-xs text-gray-600">
            {assignmentPreview.divisions > 0 && (
              <div className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full border border-blue-100">
                {assignmentPreview.divisions} div
              </div>
            )}
            {assignmentPreview.batches > 0 && (
              <div className="px-2 py-0.5 bg-green-50 text-green-700 rounded-full border border-green-100">
                {assignmentPreview.batches} batch
              </div>
            )}
          </div>
          <div className="text-xs font-medium text-gray-500">
            Load: {assignmentPreview.divisions * course.lectHrs +
              assignmentPreview.batches * course.labHrs}{" "}
            hrs
          </div>
        </div>
      ) : (
        <button
          onClick={() => setIsOpen(!isOpen)}
          disabled={disabled || assignedTeachers.length >= 6}
          className={`w-full flex items-center justify-between px-3 py-2 text-sm border rounded-md shadow-sm transition-colors
            ${
              disabled || assignedTeachers.length >= 6
                ? "bg-gray-50 text-gray-400 cursor-not-allowed"
                : "bg-white text-gray-700 hover:bg-gray-50"
            }
            ${selectedTeacher ? "border-blue-300" : "border-gray-300"}`}
        >
          <span className="truncate">
            {selectedTeacher ? selectedTeacher.name : "Assign"}
          </span>
          <ChevronDown size={16} />
        </button>
      )}

      {isOpen && (
        <div
          ref={dropdownRef}
          className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto"
        >
          <div className="py-1 divide-y divide-gray-100">
            {availableTeachers.map((teacher) => {
              const loadPercentage =
                (1 - teacher.assignedLoad / teacher.loadLimit) * 100;
              return (
                <button
                  key={teacher._id}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 relative"
                  onClick={() => handleSelectTeacher(teacher)}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-gray-800">
                      {teacher.name}
                    </span>
                    <span className="text-xs text-gray-500">
                      {teacher.position}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-gray-600">
                      Load: {teacher.assignedLoad}/{teacher.loadLimit}
                    </span>
                    <span className="text-xs text-gray-500">
                      {Math.round(100 - loadPercentage)}% used
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-gray-100 rounded-full mt-1 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        loadPercentage > 50
                          ? "bg-green-500"
                          : loadPercentage > 25
                          ? "bg-yellow-500"
                          : "bg-red-500"
                      }`}
                      style={{
                        width: `${100 - loadPercentage}%`,
                      }}
                    />
                  </div>
                </button>
              );
            })}
            {availableTeachers.length === 0 && (
              <div className="px-3 py-2 text-sm text-gray-500 text-center">
                {assignedTeachers.length >= 6
                  ? "Maximum of 6 teachers already assigned to this course"
                  : "No available teachers with sufficient load capacity"}
              </div>
            )}
          </div>
        </div>
      )}

      {showAssignmentOptions && selectedTeacher && (
        <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg p-3 space-y-3">
          <div className="flex justify-between items-center border-b pb-2">
            <span className="font-medium text-gray-800">
              {selectedTeacher.name}
            </span>
            <button
              onClick={() => setShowAssignmentOptions(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X size={16} />
            </button>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Divisions ({course.lectHrs} hr/div)
            </label>
            <div className="flex rounded-md shadow-sm">
              <button
                onClick={() => setDivisions(Math.max(0, divisions - 1))}
                className="px-3 py-1 bg-gray-100 border-l border-y border-gray-300 rounded-l-md text-gray-700 hover:bg-gray-200"
              >
                <Minus size={14} />
              </button>
              <input
                type="number"
                min="0"
                max={remainingDivisions}
                value={divisions}
                onChange={(e) => {
                  const value = Math.min(
                    parseInt(e.target.value) || 0,
                    remainingDivisions
                  );
                  setDivisions(value);
                }}
                className="block w-full px-3 py-1 text-sm text-center border-y border-gray-300 focus:ring-blue-500 focus:border-blue-500"
              />
              <button
                onClick={() =>
                  setDivisions(Math.min(remainingDivisions, divisions + 1))
                }
                className="px-3 py-1 bg-gray-100 border-r border-y border-gray-300 rounded-r-md text-gray-700 hover:bg-gray-200"
              >
                <Plus size={14} />
              </button>
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Max: {remainingDivisions}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Batches ({course.labHrs} hr/batch)
            </label>
            <div className="flex rounded-md shadow-sm">
              <button
                onClick={() => setBatches(Math.max(0, batches - 1))}
                className="px-3 py-1 bg-gray-100 border-l border-y border-gray-300 rounded-l-md text-gray-700 hover:bg-gray-200"
              >
                <Minus size={14} />
              </button>
              <input
                type="number"
                min="0"
                max={remainingBatches}
                value={batches}
                onChange={(e) => {
                  const value = Math.min(
                    parseInt(e.target.value) || 0,
                    remainingBatches
                  );
                  setBatches(value);
                }}
                className="block w-full px-3 py-1 text-sm text-center border-y border-gray-300 focus:ring-blue-500 focus:border-blue-500"
              />
              <button
                onClick={() =>
                  setBatches(Math.min(remainingBatches, batches + 1))
                }
                className="px-3 py-1 bg-gray-100 border-r border-y border-gray-300 rounded-r-md text-gray-700 hover:bg-gray-200"
              >
                <Plus size={14} />
              </button>
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Max: {remainingBatches}
            </div>
          </div>

          <div className="border-t pt-2 space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-gray-600">Total load: </span>
              <span className="font-medium text-gray-800">
                {divisions * course.lectHrs + batches * course.labHrs} hrs
              </span>
            </div>

            <div className="flex justify-between text-xs">
              <span className="text-gray-600">Teacher remaining: </span>
              <span 
                className={`font-medium ${
                  getRemainingLoad(selectedTeacher._id) < requiredLoad 
                  ? "text-red-600" 
                  : "text-gray-800"
                }`}
              >
                {getRemainingLoad(selectedTeacher._id)} hrs
              </span>
            </div>

            {getRemainingLoad(selectedTeacher._id) < requiredLoad && (
              <div className="flex items-center text-xs text-red-600 mt-1">
                <AlertCircle size={12} className="mr-1" />
                <span>Not enough remaining load capacity</span>
              </div>
            )}

            <div className="flex justify-end space-x-2 pt-1">
              <button
                onClick={() => setShowAssignmentOptions(false)}
                className="px-3 py-1.5 bg-gray-100 text-gray-700 text-sm border border-gray-300 rounded-md hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAssign}
                disabled={
                  disableAssignButton ||
                  getRemainingLoad(selectedTeacher._id) < requiredLoad
                }
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  disableAssignButton ||
                  getRemainingLoad(selectedTeacher._id) < requiredLoad
                    ? "bg-blue-300 text-white cursor-not-allowed"
                    : "bg-blue-600 text-white hover:bg-blue-700"
                }`}
              >
                Assign
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherSelector;
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
        const _assignmets = assignments.filter((a) => a.courseId === courseId);
        if (index < _assignmets.length) {
            const _assignment = _assignmets[index];
            setAssignment(_assignment);
            setDivisions(_assignment.divisions);
            setBatches(_assignment.batches);

            const teacher = teachers.find(
                (t) => t._id === _assignment.teacherId
            );
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
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target)
            ) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    useEffect(() => {
        // console.log(assignments);
        const _assignmet = assignments.find(
            (assignment) =>
                assignment.courseId === courseId &&
                assignment.teacherId === selectedTeacher?._id
        );
        if (_assignmet) {
            setAssignment(_assignmet);
            console.log("found");
            // setDivisions(_assignmet.divisions);
            // setBatches(_assignmet.batches);
        }
    }, [selectedTeacher, assignments, courseId]);

    useEffect(() => {
        // if(assignedTeachers.length){
        //     console.log(assignedTeachers, index);}
        if (index < assignedTeachers.length) {
            console.log("yes");
            const assignedTeacherId = assignedTeachers[index];
            const teacher = teachers.find((t) => t._id === assignedTeacherId);
            console.log(teacher);
            if (assignment?.divisions == 0 && assignment?.batches == 0) {
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
        if (selectedTeacher) {// && (divisions > 0 || batches > 0)) {
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

    // Filter teachers that:
    // 1. Have enough remaining load
    // 2. Are not already assigned to this course (except the current selected teacher)
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

    function disableAssign(teacherId, divisions, batches) {
        const assigned = assignments.find(
            (assignment) =>
                assignment.teacherId === teacherId &&
                assignment.courseId === courseId
        );
        if (!assigned && divisions == 0 && batches == 0) {
            return true;
        } else {
            return false;
        }
    }

    return (
        <div className="relative" ref={dropdownRef}>
            {assignmentPreview ? (
                <div className="w-full border rounded-md shadow-sm bg-blue-50 border-blue-300 p-2 text-sm">
                    <div className="flex justify-between items-center">
                        <div className="font-medium text-blue-800 truncate max-w-32">
                            {assignmentPreview.teacherName}
                        </div>
                        <button
                            onClick={handleEditAssignment}
                            className="text-blue-600 hover:text-blue-800 p-1 rounded-full hover:bg-blue-100"
                        >
                            <Edit size={14} />
                        </button>
                    </div>
                    <div className="flex flex-wrap text-xs mt-1 text-gray-600">
                        {assignmentPreview.divisions > 0 && (
                            <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full mr-1 mb-1">
                                {assignmentPreview.divisions} div
                            </span>
                        )}
                        {assignmentPreview.batches > 0 && (
                            <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full mr-1 mb-1">
                                {assignmentPreview.batches} batch
                            </span>
                        )}
                        <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full mb-1">
                            {assignmentPreview.divisions * course.lectHrs +
                                assignmentPreview.batches * course.labHrs}{" "}
                            hrs
                        </span>
                    </div>
                </div>
            ) : (
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    disabled={disabled || assignedTeachers.length >= 6}
                    className={`w-full flex items-center justify-between px-2 py-2 text-sm border rounded-md shadow-sm
              ${
                    disabled || assignedTeachers.length >= 6
                        ? "bg-gray-50 text-gray-400 cursor-not-allowed"
                        : "bg-white text-gray-700 hover:bg-gray-50"
                }
              ${selectedTeacher ? "border-blue-300" : "border-gray-300"}`}
                >
                    <span className="truncate max-w-full">
                        {selectedTeacher
                            ? selectedTeacher.name
                            : // : index < assignedTeachers.length
                              // ? "Assigned"
                              "Assign"}
                    </span>
                    <ChevronDown size={14} className="flex-shrink-0 ml-1" />
                </button>
            )}

            {isOpen && (
                <div className="absolute z-10 mt-1 w-64 bg-white rounded-md shadow-lg border border-gray-200 max-h-64 overflow-y-auto">
                    <div className="sticky top-0 bg-white border-b border-gray-200 p-2">
                        <input
                            type="text"
                            placeholder="Search teachers..."
                            className="w-full px-2 py-1 text-sm border rounded focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                    <div className="py-1">
                        {availableTeachers.map((teacher) => {
                            const loadPercentage =
                                (1 - teacher.assignedLoad / teacher.loadLimit) *
                                100;
                            return (
                                <div
                                    key={teacher._id}
                                    className="px-3 py-2 hover:bg-blue-50 cursor-pointer transition-colors"
                                    onClick={() => handleSelectTeacher(teacher)}
                                >
                                    <div className="flex justify-between items-center">
                                        <div className="font-medium text-gray-900 truncate max-w-40">
                                            {teacher.name}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            {teacher.position}
                                        </div>
                                    </div>
                                    <div className="mt-1">
                                        <div className="flex justify-between text-xs text-gray-600 mb-1">
                                            <span>
                                                Load: {teacher.assignedLoad}/
                                                {teacher.loadLimit}
                                            </span>
                                            <span>
                                                {Math.round(
                                                    100 - loadPercentage
                                                )}
                                                % used
                                            </span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                                            <div
                                                className={`h-1.5 rounded-full ${
                                                    loadPercentage > 50
                                                        ? "bg-green-500"
                                                        : loadPercentage > 25
                                                        ? "bg-yellow-500"
                                                        : "bg-red-500"
                                                }`}
                                                style={{
                                                    width: `${
                                                        100 - loadPercentage
                                                    }%`,
                                                }}
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
                    <div className="flex justify-between items-center mb-2">
                        <div className="text-sm font-medium text-gray-900 truncate max-w-40">
                            {selectedTeacher.name}
                        </div>
                        <button
                            onClick={() => setShowAssignmentOptions(false)}
                            className="text-gray-400 hover:text-gray-600"
                        >
                            <X size={16} />
                        </button>
                    </div>

                    <div className="mb-3">
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                            Divisions ({course.lectHrs} hr/div)
                        </label>
                        <div className="flex items-center">
                            <div className="flex-1 flex items-center border rounded overflow-hidden">
                                <button
                                    onClick={() =>
                                        setDivisions(Math.max(0, divisions - 1))
                                    }
                                    className="px-2 py-1 bg-gray-100 border-r text-gray-700 hover:bg-gray-200"
                                >
                                    <Minus size={14} />
                                </button>
                                <input
                                    type="number"
                                    min="0"
                                    max={course.divisions - divisions}
                                    value={divisions}
                                    disabled={course.lectHrs === 0}
                                    onChange={(e) => {
                                        const value = Math.min(
                                            parseInt(e.target.value) || 0,
                                            course.divisions - divisions
                                        );
                                        setDivisions(value);
                                    }}
                                    className="block w-full px-2 py-1 text-sm text-center focus:ring-blue-500 focus:border-blue-500 border-0"
                                />
                                <button
                                    onClick={() =>
                                        setDivisions(
                                            Math.min(
                                                course.divisions - divisions ||
                                                    0,
                                                divisions + 1
                                            )
                                        )
                                    }
                                    className="px-2 py-1 bg-gray-100 border-l text-gray-700 hover:bg-gray-200"
                                >
                                    <Plus size={14} />
                                </button>
                            </div>
                            <span className="ml-2 text-xs text-gray-500">
                                Max: {course.divisions - divisions}
                            </span>
                        </div>
                    </div>

                    <div className="mb-3">
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                            Batches ({course.labHrs} hr/batch)
                        </label>
                        <div className="flex items-center">
                            <div className="flex-1 flex items-center border rounded overflow-hidden">
                                <button
                                    onClick={() =>
                                        setBatches(Math.max(0, batches - 1))
                                    }
                                    className="px-2 py-1 bg-gray-100 border-r text-gray-700 hover:bg-gray-200"
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
                                    className="block w-full px-2 py-1 text-sm text-center focus:ring-blue-500 focus:border-blue-500 border-0"
                                />
                                <button
                                    onClick={() =>
                                        setBatches(
                                            Math.min(
                                                remainingBatches,
                                                batches + 1
                                            )
                                        )
                                    }
                                    className="px-2 py-1 bg-gray-100 border-l text-gray-700 hover:bg-gray-200"
                                >
                                    <Plus size={14} />
                                </button>
                            </div>
                            <span className="ml-2 text-xs text-gray-500">
                                Max: {remainingBatches}
                            </span>
                        </div>
                    </div>

                    <div className="p-2 bg-blue-50 rounded mb-3">
                        <div className="flex justify-between items-center text-xs text-gray-600">
                            <span>Total load: </span>
                            <span className="font-medium text-sm text-blue-700">
                                {divisions * course.lectHrs +
                                    batches * course.labHrs}{" "}
                                hrs
                            </span>
                        </div>
                        <div className="flex justify-between items-center text-xs text-gray-600 mt-1">
                            <span>Teacher remaining: </span>
                            <span
                                className={`font-medium text-sm ${
                                    getRemainingLoad(selectedTeacher._id) <
                                    requiredLoad
                                        ? "text-red-600"
                                        : "text-green-600"
                                }`}
                            >
                                {getRemainingLoad(selectedTeacher._id)} hrs
                            </span>
                        </div>
                    </div>

                    {getRemainingLoad(selectedTeacher._id) < requiredLoad && (
                        <div className="mb-3 p-2 bg-red-50 text-red-700 text-xs rounded border border-red-200 flex items-center">
                            <AlertCircle
                                size={12}
                                className="mr-1 flex-shrink-0"
                            />
                            <span>Not enough remaining load capacity</span>
                        </div>
                    )}

                    <div className="flex justify-between">
                        <button
                            onClick={handleAssign}
                            // disabled={
                            // 	(divisions === 0 && batches === 0) ||
                            // 	getRemainingLoad(selectedTeacher._id) <
                            // 		requiredLoad
                            // }
                            disabled={disableAssign(
                                selectedTeacher._id,
                                divisions,
                                batches
                            )}
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

export default TeacherSelector;
import React, { useState, useEffect, useRef } from "react";
import { Plus, Minus, Edit, X, AlertCircle } from "lucide-react";


/*
* onAssign: takes care of the parent component's logic for assigning a teacher so we should stop caring about the parent component's logic here

* Now things like reamainingDivisions, remainingBatches which are used for clamping the number of divisions and batches that can be assigned to a teacher
* are passed as props to this component. but we should i think create component specific state for these values because changing the assigned divisions
* changes the remaining divisions and batches for the teacher, so we should not depend on the parent component's state for these values.

* and functions like getRemainingLoad which is used to get the remaining load of a teacher pulls data from the parent component's state, 
* but the parent components state is practically static for this component, reason being we aren't passing the setter function for the state
* so we should also create a component specific function for this
* 
* still little skeptical about the parent component's state but let's try this approach first
*/
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
	onDelete
}) => {
	const [selectedTeacher, setSelectedTeacher] = useState(null);
	const [showModal, setShowModal] = useState(false);
	const [divisions, setDivisions] = useState(0);
	const [batches, setBatches] = useState(0);
	const [assignmentPreview, setAssignmentPreview] = useState(null);
	const [assignment, setAssignment] = useState(null);
	const [isAssignMode, setIsAssignMode] = useState(true);

	// remaining divisions and batches state
	const [remainingDivisionsState, setRemainingDivisionsState] = useState(remainingDivisions);
	const [remainingBatchesState, setRemainingBatchesState] = useState(remainingBatches);
	const [requiredLoad, setRequiredLoad] = useState(0);

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

		// console.log(remainingDivisions, "remainingDivisions");
		// console.log(remainingBatches, "remainingBatches");

		// setRequiredLoad(remainingDivisions * course.lectHrs + remainingBatches * course.labHrs);
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

	const openAssignModal = () => {
		setIsAssignMode(true);
		setDivisions(0);
		setBatches(0);
		setSelectedTeacher(null);
		setShowModal(true);
	};

	const openEditModal = () => {
		setIsAssignMode(false);
		if (assignmentPreview) {
			setDivisions(assignmentPreview.divisions);
			setBatches(assignmentPreview.batches);
			const teacher = teachers.find((t) => t._id === assignmentPreview.teacherId);
			setSelectedTeacher(teacher);
		}
		setShowModal(true);
	};

	const handleSelectTeacher = (teacher) => {
		setSelectedTeacher(teacher);
	};

	const handleConfirmAssignment = () => {
		if (selectedTeacher) {
			setAssignmentPreview({
				teacherId: selectedTeacher._id,
				teacherName: selectedTeacher.name,
				divisions,
				batches,
			});
			console.log("onAssign called with:", courseId, selectedTeacher._id, divisions, batches);
			onAssign(courseId, selectedTeacher._id, divisions, batches);
			setShowModal(false);
		}
	};

	useEffect(() => {
		console.log("Remaining Divisions State:", remainingDivisionsState);
		console.log("Remaining Batches State:", remainingBatchesState);
		setRequiredLoad(remainingDivisionsState * course.lectHrs + remainingBatchesState * course.labHrs);
	}, [divisions, batches, remainingDivisionsState, remainingBatchesState]);

	const availableTeachers = teachers.filter((teacher) => {
		const hasEnoughLoad = getRemainingLoad(teacher._id) != 0;

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


	const onChangeDivisions = (value) => {

		// here divisions state is essentially denoting the assigned divisions
		// so if we change the assigned divisions naturally the remaining divisions will change
		setDivisions(value);
		setRemainingDivisionsState(course.divisions - value);
	}

	const onChangeBatches = (value) => {
		// here batches state is essentially denoting the assigned batches
		// so if we change the assigned batches naturally the remaining batches will change
		setBatches(value);
		setRemainingBatchesState(course.batches - value);
	}

	const calculateRemainingLoad = () => {
		const loadLimit = selectedTeacher.loadLimit;
		// console.log(selectedTeacher);

		// // calculate assigned load excluding the current course assignment
		// let assignedLectLoad = 0;
		// let assignedLabLoad = 0;

		// assignments.forEach((assignment) => {
		// 	if (assignment.teacherId === selectedTeacher._id && assignment.courseId !== courseId) {
		// 		console.log(assignment, "assignment");
		// 		assignedLectLoad += assignment.divisions * course.lectHrs;
		// 		assignedLabLoad += assignment.batches * course.labHrs;
		// 	}
		// });

		// const totalAssignedLoad = assignedLectLoad + assignedLabLoad;
		// console.log(loadLimit - (totalAssignedLoad + divisions * course.lectHrs + batches * course.labHrs), "remaining load");
		// return (loadLimit - (totalAssignedLoad + divisions * course.lectHrs + batches * course.labHrs));

		let totalAssignedLoad = selectedTeacher.assignedLoad;

		if (assignment) {
			totalAssignedLoad -= (assignment.divisions * course.lectHrs + assignment.batches * course.labHrs);
		}

		return loadLimit - (totalAssignedLoad + divisions * course.lectHrs + batches * course.labHrs);
	}


	const getMaxDivisions = () => {
		if (isAssignMode) {
			return remainingDivisions;
		} else {
			// in edit mode, add back the currently assigned divisions to the remaining
			console.log(assignmentPreview, "assignmentPreview");
			const currentAssignedDivisions = assignmentPreview?.divisions || 0;
			return remainingDivisions + currentAssignedDivisions;
		}
	};

	const getMaxBatches = () => {
		if (isAssignMode) {
			return remainingBatches;
		} else {
			// in edit mode, add back the currently assigned batches to the remaining
			const currentAssignedBatches = assignmentPreview?.batches || 0;
			return remainingBatches + currentAssignedBatches;
		}
	};
	return (
		<div className="relative w-full">
			{assignmentPreview ? (
				<div className="w-full bg-white border rounded-md shadow-sm p-2 space-y-2">
					<div className="flex justify-between items-center">
						<span className="font-medium text-sm text-gray-800 truncate">
							{assignmentPreview.teacherName}
						</span>
						<button
							onClick={openEditModal}
							disabled={isFullyAssigned && !assignmentPreview.divisions && !assignmentPreview.batches}
							className={`p-1 rounded-md hover:bg-gray-100 ${isFullyAssigned && !assignmentPreview.divisions && !assignmentPreview.batches
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
					onClick={openAssignModal}
					disabled={disabled || assignedTeachers.length >= 6}
					className={`w-full flex items-center justify-center px-3 py-2 text-sm border rounded-md shadow-sm transition-colors
            ${disabled || assignedTeachers.length >= 6
							? "bg-gray-50 text-gray-400 cursor-not-allowed"
							: "bg-white text-gray-700 hover:bg-gray-50"
						}
            ${selectedTeacher ? "border-blue-300" : "border-gray-300"}`}
				>
					<span className="truncate">Assign Teacher</span>
				</button>
			)}

			{/* Modal */}
			{showModal && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 bg-opacity-50">
					<div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
						<div className="flex justify-between items-center px-6 py-4 border-b">
							<h3 className="text-lg font-medium text-gray-900">
								{isAssignMode ? "Assign Teacher" : "Edit Assignment"}
							</h3>
							<button
								onClick={() => setShowModal(false)}
								className="text-gray-400 hover:text-gray-600 focus:outline-none"
							>
								<X size={20} />
							</button>
						</div>

						<div className="px-6 py-4 max-h-[70vh] overflow-y-auto">
							{/* Teacher Selection Section */}
							<div className="mb-4">
								<label className="block text-sm font-medium text-gray-700 mb-2">
									Select Teacher
								</label>
								<div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto border rounded-md p-2">
									{availableTeachers.map((teacher) => {
										const loadPercentage = (1 - teacher.assignedLoad / teacher.loadLimit) * 100;
										const isActive = selectedTeacher?._id === teacher._id;

										return (
											<button
												key={teacher._id}
												className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors ${isActive
													? "bg-blue-50 border border-blue-200"
													: "hover:bg-gray-50 border border-gray-200"
													}`}
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
														className={`h-full rounded-full ${loadPercentage > 50
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
										<div className="px-3 py-4 text-sm text-gray-500 text-center">
											{assignedTeachers.length >= 6
												? "Maximum of 6 teachers already assigned to this course"
												: "No available teachers with sufficient load capacity"}
										</div>
									)}
								</div>
							</div>

							<div className="grid grid-cols-2 gap-4 mb-6">
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-2">
										Divisions ({course.lectHrs} hr/div)
									</label>
									<div className="flex rounded-md shadow-sm">
										<button
											onClick={() => {
												onChangeDivisions(Math.max(0, divisions - 1));
											}}
											className="px-3 py-1 bg-gray-100 border-l border-y border-gray-300 rounded-l-md text-gray-700 hover:bg-gray-200"
										>
											<Minus size={14} />
										</button>
										<input
											type="number"
											min="0"
											max={getMaxDivisions()}
											value={divisions}
											onChange={(e) => {
												// const value = Math.min(
												// 	parseInt(e.target.value) || 0,
												// 	remainingDivisions
												// );
												// setDivisions(value);

												onChangeDivisions(parseInt(e.target.value));
											}}
											className="block w-full px-3 py-1 text-sm text-center border-y border-gray-300 focus:ring-blue-500 focus:border-blue-500"
										/>
										<button
											onClick={() =>
												onChangeDivisions(Math.min(getMaxDivisions(), divisions + 1))
											}
											className="px-3 py-1 bg-gray-100 border-r border-y border-gray-300 rounded-r-md text-gray-700 hover:bg-gray-200"
										>
											<Plus size={14} />
										</button>
									</div>
									<div className="text-xs text-gray-500 mt-1">
										Max: {getMaxDivisions()}
									</div>
								</div>

								<div>
									<label className="block text-sm font-medium text-gray-700 mb-2">
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
											max={getMaxBatches()}
											value={batches}
											onChange={(e) => {
												// const value = Math.min(
												// 	parseInt(e.target.value) || 0,
												// 	remainingBatches
												// );
												// setBatches(value);

												onChangeBatches(Math.min(
													parseInt(e.target.value) || 0, getMaxBatches()
												));
											}}
											className="block w-full px-3 py-1 text-sm text-center border-y border-gray-300 focus:ring-blue-500 focus:border-blue-500"
										/>
										<button
											onClick={() =>
												setBatches(Math.min(getMaxBatches(), batches + 1))
											}
											className="px-3 py-1 bg-gray-100 border-r border-y border-gray-300 rounded-r-md text-gray-700 hover:bg-gray-200"
										>
											<Plus size={14} />
										</button>
									</div>
									<div className="text-xs text-gray-500 mt-1">
										Max: {getMaxBatches()}
									</div>
								</div>
							</div>

							{/* Load Calculation Section */}
							<div className="border-t pt-4 space-y-2">
								<div className="flex justify-between text-sm">
									<span className="text-gray-600">Total pending load: </span>
									<span className="font-medium text-gray-800">
										{remainingDivisions * course.lectHrs + remainingBatches * course.labHrs} hrs
									</span>
								</div>
								<div className="flex justify-between text-sm">
									<span className="text-gray-600">Total assigned load to this teacher: </span>
									<span className="font-medium text-gray-800">
										{divisions * course.lectHrs + batches * course.labHrs} hrs
									</span>
								</div>


								{selectedTeacher && (
									<div className="flex justify-between text-sm">
										<span className="text-gray-600">Teacher remaining: </span>
										<span
											className={`font-medium ${calculateRemainingLoad() < 0
												? "text-red-600"
												: "text-gray-800"
												}`}
										>
											{calculateRemainingLoad()} hrs
										</span>
									</div>
								)}

								{selectedTeacher && (calculateRemainingLoad() < 0) && (
									<div className="flex items-center text-xs text-red-600 mt-1">
										<AlertCircle size={12} className="mr-1" />
										<span>Not enough remaining load capacity</span>
									</div>
								)}
							</div>
						</div>

						<div className="px-6 py-4 border-t bg-gray-50 flex justify-end space-x-3">
							{
								!isAssignMode && (
									<button
										onClick={() => {
											setAssignmentPreview(null);
											setSelectedTeacher(null);
											setDivisions(0);
											setBatches(0);
											onDelete(courseId, selectedTeacher?._id);
											setShowModal(false);
										}}
										className="px-4 py-2 bg-red-600 text-white text-sm border border-red-600 rounded-md hover:bg-red-700 transition-colors"
									>
										Delete
									</button>
								)
							}

							<button
								onClick={() => setShowModal(false)}
								className="px-4 py-2 bg-white text-gray-700 text-sm border border-gray-300 rounded-md hover:bg-gray-100 transition-colors"
							>
								Cancel
							</button>
							<button
								onClick={handleConfirmAssignment}
								disabled={
									!selectedTeacher ||
									disableAssignButton ||
									(selectedTeacher && calculateRemainingLoad() < 0)
								}
								className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${!selectedTeacher ||
									disableAssignButton ||
									(selectedTeacher && calculateRemainingLoad() < 0)
									? "bg-blue-300 text-white cursor-not-allowed"
									: "bg-blue-600 text-white hover:bg-blue-700"
									}`}
							>
								{isAssignMode ? "Assign" : "Update"}
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
};

export default TeacherSelector;
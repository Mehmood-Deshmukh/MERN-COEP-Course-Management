import React, { useState, useRef, useEffect } from "react";
import {
  ChevronDown,
  Check,
  AlertCircle,
  Info,
  RefreshCw,
  Save,
  X,
  Minus,
  Edit,
  Plus,
  Search,
  Filter,
  Loader,
  User,
} from "lucide-react";
import TeacherSelector from "./TeacherSelector";
import { useNavigate } from "react-router-dom";

const TeacherAssignment = () => {
  const [teachers, setTeachers] = useState([]);
  const [allCourses, setAllCourses] = useState([]);
  const [courses, setCourses] = useState([]);
  const [filteredCourses, setFilteredCourses] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [message, setMessage] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalCourses, setTotalCourses] = useState(0);
  const [isSaveDisabled, setIsSaveDisabled] = useState(true);
  const [deletedAssignments, setDeletedAssignments] = useState([]);

  const navigate = useNavigate();


  const [yearOptions] = useState([
    "1st Year",
    "2nd Year",
    "3rd Year",
    "4th Year",
    "MTech 1st Year",
    "MTech 2nd Year",
  ]);
  const [semOptions] = useState([
    "I",
    "II",
    "III",
    "IV",
    "V",
    "VI",
    "VII",
    "VIII",
    "MTDS-I",
    "MTDS-II",
    "MTCE-I",
    "MTCE-II",
    "MTIS-I",
    "MTIS-II",
  ]);

  // filter options
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedSem, setSelectedSem] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchTimeout, setSearchTimeout] = useState(null);
  const [itemsPerPage] = useState(20);

  // =========================================FETCH DATA FUNCTIONS ===============================================
  const fetchTeachers = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/teachers/all");
      const data = await response.json();

      if (data.success) {
        setTeachers(data.data);
      } else {
        setMessage({
          type: "error",
          text: data.message || "Failed to fetch teachers",
        });
      }
    } catch (error) {
      setMessage({ type: "error", text: "Failed to fetch teachers" });
      console.error("Error fetching teachers:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCourses = async () => {
    setLoading(true);
    try {
      let url = `/api/courses?limit=200&page=1`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.success) {
        const coursesData = data.data;
        setAllCourses(coursesData);
        setTotalCourses(coursesData.length);

        applyFiltersAndPagination(coursesData);

        let _assignments = [];
        coursesData.forEach((course) => {
          if (course.assignments && Array.isArray(course.assignments)) {
            _assignments = [
              ..._assignments,
              ...course.assignments.map((a) => ({
                _id: a._id,
                courseId: course._id,
                teacherId: a.teacherId._id,
                divisions: a.divisions,
                batches: a.batches,
                original: true,
              })),
            ];
          }
        });

        setAssignments(_assignments);
      } else {
        setMessage({
          type: "error",
          text: data.message || "Failed to fetch courses",
        });
      }
    } catch (error) {
      setMessage({ type: "error", text: "Failed to fetch courses" });
      console.error("Error fetching courses:", error);
    } finally {
      setLoading(false);
    }
  };

  const applyFiltersAndPagination = (
    sourceCourses = allCourses,
    page = 1,
    year = selectedYear,
    query = searchQuery,
    sem = selectedSem
  ) => {
    let filtered = [...sourceCourses];

    if (year) {
      filtered = filtered.filter((course) => course.year === year);
    }
    if (sem) {
      filtered = filtered.filter((course) => course.sem === sem);
    }

    if (query) {
      const lowerQuery = query.toLowerCase();
      filtered = filtered.filter(
        (course) =>
          course.subject.toLowerCase().includes(lowerQuery) ||
          course._id.toLowerCase().includes(lowerQuery) ||
          (course.curriculum &&
            course.curriculum.toLowerCase().includes(lowerQuery))
      );
    }

    setTotalCourses(filtered.length);

    const endIndex = page * itemsPerPage;
    const paginatedCourses = filtered.slice(0, endIndex);

    setCourses(paginatedCourses);
    setFilteredCourses(paginatedCourses);
    setCurrentPage(page);
    setHasMore(endIndex < filtered.length);
  };

  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    const timeout = setTimeout(() => {
      applyFiltersAndPagination(allCourses, 1, selectedYear, query);
    }, 300);
    setSearchTimeout(timeout);
  };

  const handleYearChange = (e) => {
    const year = e.target.value;
    setSelectedYear(year);
    applyFiltersAndPagination(allCourses, 1, year, searchQuery);
  };

  const handleSemChange = (e) => {
    const sem = e.target.value;
    setSelectedSem(sem);
    applyFiltersAndPagination(allCourses, 1, selectedYear, searchQuery, sem);
  };

  const handleLoadMore = () => {
    const nextPage = currentPage + 1;
    applyFiltersAndPagination(allCourses, nextPage, selectedYear, searchQuery);
  };

  const clearFilters = () => {
    setSelectedYear("");
    setSearchQuery("");
    applyFiltersAndPagination(allCourses, 1, "", "");
  };

  useEffect(() => {
    fetchTeachers();
    fetchCourses();
  }, []);

  // ==================================================================================================
  // ================================= VERY IMPORTANT FUNCTION ========================================
  // ==================================================================================================
  const handleAssignTeacher = (courseId, teacherId, divisions, batches) => {
    setLoading(true);

    try {
      // try to find an existing assignment
      const existingAssignment = assignments.find(
        (assignment) =>
          assignment?.courseId === courseId &&
          assignment?.teacherId === teacherId
      );

      // if an assignment already exists, update it
      if (existingAssignment) {
        console.log("Updating existing assignment:", existingAssignment);

        // update the assignments state with the new assignment
        // with updated divisions and batches
        const updatedAssignments = assignments.map((assignment) => {
          if (
            assignment?.courseId === courseId &&
            assignment?.teacherId === teacherId
          ) {
            return { ...assignment, divisions, batches, original: false };
          }
          return assignment;
        });
        setAssignments(updatedAssignments);

        // update the courses and teachers state

        // for context
        // courses -> courses that are displayed in the table (paginated)
        // allCourses -> all courses fetched from the server
        const course = allCourses.find((course) => course._id === courseId);
        const updatedTeachers = teachers.map((teacher) => {
          if (teacher._id === teacherId) {
            return {
              ...teacher,

              // update the assigned load of the teacher
              // by subtracting the existing assignment's divisions and batches load
              // and adding the new divisions and batches load
              assignedLoad:
                teacher.assignedLoad -
                existingAssignment.divisions * course.lectHrs -
                existingAssignment.batches * course.labHrs +
                divisions * course.lectHrs +
                batches * course.labHrs,
            };
          }
          return teacher;
        });

        // we are updating two states independently which have the same data
        // but i guess its all right cause its offline and we are not using
        // any database to store the assignments
        const updatedAllCourses = allCourses.map((course) => {
          if (course._id === courseId) {
            return {
              ...course,
              reqLectLoad:
                course.reqLectLoad +
                existingAssignment.divisions * course.lectHrs -
                divisions * course.lectHrs,
              reqLabLoad:
                course.reqLabLoad +
                existingAssignment.batches * course.labHrs -
                batches * course.labHrs,
            };
          }
          return course;
        });

        const updatedCourses = courses.map((course) => {
          if (course._id === courseId) {
            return {
              ...course,
              // reqLectLoad and reqLabLoad are essentially the load that is pending to be assigned
              // so when we update the assignment:
              // 1. we need to add the existing assignment's load back (which was previously subtracted )
              // 2. we need to subtract the new assignment's load
              reqLectLoad:
                course.reqLectLoad +
                existingAssignment.divisions * course.lectHrs -
                divisions * course.lectHrs,
              reqLabLoad:
                course.reqLabLoad +
                existingAssignment.batches * course.labHrs -
                batches * course.labHrs,
            };
          }
          return course;
        });

        setTeachers(updatedTeachers);
        setAllCourses(updatedAllCourses);
        setCourses(updatedCourses);
        setFilteredCourses(updatedCourses);

        setIsSaveDisabled(false);
      }

      // if no assignment exists, create a new one
      else {
        const newAssignment = {
          courseId,
          teacherId,
          divisions,
          batches,
        };

        const updatedAssignments = [...assignments, newAssignment];
        setAssignments(updatedAssignments);

        const course = allCourses.find((course) => course._id === courseId);

        const updatedTeachers = teachers.map((teacher) => {
          if (teacher._id === teacherId) {
            return {
              ...teacher,
              assignedLoad:
                teacher.assignedLoad +
                divisions * course.lectHrs +
                batches * course.labHrs,
            };
          }
          return teacher;
        });

        const updatedAllCourses = allCourses.map((course) => {
          if (course._id === courseId) {
            return {
              ...course,
              reqLectLoad: course.reqLectLoad - divisions * course.lectHrs,
              reqLabLoad: course.reqLabLoad - batches * course.labHrs,
            };
          }
          return course;
        });

        const updatedCourses = courses.map((course) => {
          if (course._id === courseId) {
            return {
              ...course,
              reqLectLoad: course.reqLectLoad - divisions * course.lectHrs,
              reqLabLoad: course.reqLabLoad - batches * course.labHrs,
            };
          }
          return course;
        });

        setTeachers(updatedTeachers);
        setAllCourses(updatedAllCourses);
        setCourses(updatedCourses);
        setFilteredCourses(updatedCourses);
      }

      setMessage({
        type: "success",
        text: "Assignment updated successfully",
      });
    } catch (e) {
      console.error("Error updating assignment:", e);
      setMessage({ type: "error", text: "Failed to update assignment" });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAssignment = (courseId, teacherId) => {

    setLoading(true);
    try {
      // find the assignment to delete
      const assignmentToDelete = assignments.find(
        (assignment) =>
          assignment.courseId === courseId && assignment.teacherId === teacherId
      );

      if (!assignmentToDelete) {
        setMessage({
          type: "warning",
          text: "No assignment found to delete",
        });
        setLoading(false);
        return;
      }

      // update the assignments state by filtering out the deleted assignment
      const updatedAssignments = assignments.filter(
        (assignment) =>
          !(assignment.courseId === courseId && assignment.teacherId === teacherId)
      );
      setAssignments(updatedAssignments);

      // update the courses and teachers state
      const course = allCourses.find((course) => course._id === courseId);
      const updatedTeachers = teachers.map((teacher) => {
        if (teacher._id === teacherId) {
          return {
            ...teacher,
            assignedLoad:
              teacher.assignedLoad -
              (assignmentToDelete.divisions * course.lectHrs +
                assignmentToDelete.batches * course.labHrs),
          };
        }
        return teacher;
      });

      const updatedAllCourses = allCourses.map((course) => {
        if (course._id === courseId) {
          return {
            ...course,
            reqLectLoad:
              course.reqLectLoad + assignmentToDelete.divisions * course.lectHrs,
            reqLabLoad:
              course.reqLabLoad + assignmentToDelete.batches * course.labHrs,
          };
        }
        return course;
      });

      const updatedCourses = courses.map((course) => {
        if (course._id === courseId) {
          return {
            ...course,
            reqLectLoad:
              course.reqLectLoad + assignmentToDelete.divisions * course.lectHrs,
            reqLabLoad:
              course.reqLabLoad + assignmentToDelete.batches * course.labHrs,
          };
        }
        return course;
      });

      setTeachers(updatedTeachers);
      setAllCourses(updatedAllCourses);
      setCourses(updatedCourses);
      setFilteredCourses(updatedCourses);

      // add the deleted assignment to the deletedAssignments state
      // backend only needs to be updated if the assignment has an _id
      // (or it was already saved to the database)
      if(assignmentToDelete._id) {
        setDeletedAssignments((prev) => [
          ...prev,
          assignmentToDelete,
        ]);
      }

      setMessage({
        type: "success",
        text: "Assignment deleted successfully",
      });
    } catch (e) {
      console.error("Error deleting assignment:", e);
      setMessage({ type: "error", text: "Failed to delete assignment" });
    }finally{
      setLoading(false);
      setIsSaveDisabled(false); // enable save button after deletion
    }
  }

  // ==================================================================================================

  // ALL THESE FUNCTIONS PULL DATA FROM THE COURSES STATE VARIABLE THEY DO NOT CALCULATE DATA ON THE FLY 
  // I SUPPOSE THAT IS RESPONSIBILITY OF THE TEACHER SELECTOR COMPONENT 

  // this getRemainingDivisions function calculates the remaining divisions for a course
  // it pulls the data from the state variable and it is not dynamic when we use it to 
  // control input to load 
  // it can be used as the inital value for the input field but we have to keep extra state 
  // in teacher selector component to control the input value
  const getRemainingDivisions = (courseId) => {
    const course = allCourses.find((c) => c._id === courseId);
    if (!course) return 0;

    const filteredAssignments = assignments.filter(
      (assignment) => assignment.courseId === courseId
    );
    let assignedDivisions = 0;
    filteredAssignments.forEach((assignment) => {
      assignedDivisions += assignment.divisions;
    });

    return course.divisions - assignedDivisions;
  };

  // this getRemainingBatches has the same story as getRemainingDivisions
  // so again only initial state selector component needs to have its own 
  // logic to set clamped value for the input field
  const getRemainingBatches = (courseId) => {
    const course = allCourses.find((c) => c._id === courseId);
    if (!course) return 0;

    const assignedBatches = assignments
      .filter((a) => a.courseId === courseId)
      .reduce((total, assignment) => total + assignment.batches, 0);

    return course.batches - assignedBatches;
  };

  const getAssignedTeachers = (courseId) => {
    return assignments
      .filter((a) => a.courseId === courseId)
      .map((a) => a.teacherId);
  };

  const calculateAssignedLoad = (teacherId) => {
    return assignments
      .filter((a) => a.teacherId === teacherId)
      .reduce((total, assignment) => {
        const course = allCourses.find((c) => c._id === assignment.courseId);
        if (!course) return total;

        const lectLoad = assignment.divisions * course.lectHrs;
        const labLoad = assignment.batches * course.labHrs;

        return total + lectLoad + labLoad;
      }, 0);
  };

  const getRemainingLoad = (teacherId) => {
    const teacher = teachers.find((t) => t._id === teacherId);
    if (!teacher) return 0;

    const assignedLoad = calculateAssignedLoad(teacherId);
    return teacher.loadLimit - assignedLoad;
  };

  // ======================================================SUBMIT FUNCTION============================================
  const handleSubmitAssignments = async () => {
    setLoading(true);
    if(deletedAssignments.length > 0) {
      setMessage({
        type: "info",
        text: "Submitting deleted assignments...",
      });
      await submitDeletedAssignments();
    }

    try {
      const finalAssignments = assignments.filter((a) => a.original !== true);

      if (finalAssignments.length === 0) {
        setMessage({
          type: "warning",
          text: "No new assignments to submit",
        });
        setLoading(false);
        return;
      }

      const response = await fetch("/api/assignments/assign/multiple", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ assignments: finalAssignments }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage({
          type: "success",
          text: data.message || "Teachers assigned successfully!",
        });

        // refresh data after successful submission
        fetchTeachers();
        fetchCourses();
      } else {
        setMessage({
          type: "error",
          text: data.message || "Failed to assign teachers",
        });
      }
    } catch (error) {
      setMessage({ type: "error", text: "Failed to assign teachers" });
      console.error("Error assigning teachers:", error);
    } finally {
      setLoading(false);
      setIsSaveDisabled(true);
    }
  };

  const submitDeletedAssignments = async () => {
    setLoading(true);
    try {
      if (deletedAssignments.length === 0) {
        setMessage({
          type: "warning",
          text: "No deleted assignments to submit",
        });
        setLoading(false);
        return;
      }

      const deletedAssignmentIds = deletedAssignments.map((a) => a._id);

      const response = await fetch("/api/assignments/delete-multiple", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ assignmentIds: deletedAssignmentIds }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage({
          type: "success",
          text: data.message || "Assignments deleted successfully!",
        });

        // refresh data after successful submission
        fetchTeachers();
        fetchCourses();
      } else {
        setMessage({
          type: "error",
          text: data.message || "Failed to delete assignments",
        });
      }
    } catch (error) {
      setMessage({ type: "error", text: "Failed to delete assignments" });
      console.error("Error deleting assignments:", error);
    } finally {
      setLoading(false);
      setIsSaveDisabled(true);
    }
  };

  // clear message after a delay
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setMessage(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  return (
    <div className="bg-gray-50 w-full min-h-screen">
      <div className="mx-auto px-4 py-6">
        <div className="bg-white rounded-xl shadow-md p-6">
          {/* Header and Actions */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4">
            <h1 className="text-2xl font-bold text-gray-800">
              Teacher Assignment System
            </h1>
            <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
              <button
                onClick={() => {
                  fetchTeachers();
                  fetchCourses();
                }}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md flex items-center justify-center border border-gray-300 hover:bg-gray-200 transition-colors"
                disabled={loading}
              >
                {loading ? (
                  <Loader size={16} className="mr-2 animate-spin" />
                ) : (
                  <RefreshCw size={16} className="mr-2" />
                )}
                Refresh
              </button>
              <button
                onClick={() => navigate("/teachers")}
                className="px-4 py-2 bg-blue-600 text-white rounded-md flex items-center justify-center shadow-sm hover:bg-blue-700 transition-colors disabled:bg-blue-300"
              >
                <User size={16} className="mr-2" /> View Teachers
              </button>
              <button
                onClick={handleSubmitAssignments}
                disabled={
                  (isSaveDisabled) && (assignments.filter((a) => !a.original).length === 0 || loading)
                }
                className="px-4 py-2 bg-blue-600 text-white rounded-md flex items-center justify-center shadow-sm hover:bg-blue-700 transition-colors disabled:bg-blue-300"
              >
                <Save size={16} className="mr-2" />
                {loading ? "Saving..." : "Save All Assignments"}
              </button>
            </div>
          </div>

          {/* Message Alert */}
          {message && (
            <div
              className={`p-4 mb-6 rounded-lg border ${message.type === "success"
                ? "bg-green-50 border-green-200 text-green-800"
                : message.type === "warning"
                  ? "bg-yellow-50 border-yellow-200 text-yellow-800"
                  : "bg-red-50 border-red-200 text-red-800"
                } flex items-center`}
            >
              {message.type === "success" ? (
                <Check size={18} className="mr-2 flex-shrink-0" />
              ) : (
                <AlertCircle size={18} className="mr-2 flex-shrink-0" />
              )}
              <span>{message.text}</span>
              <button
                onClick={() => setMessage(null)}
                className="ml-auto text-gray-500 hover:text-gray-700"
              >
                <X size={16} />
              </button>
            </div>
          )}

          {/* Filters and Search Section */}
          <div className="mb-6 flex flex-col sm:flex-row gap-4">
            <div className="w-full sm:w-1/2 xl:w-1/3">
              <label
                htmlFor="search"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Search Course
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search size={16} className="text-gray-400" />
                </div>
                <input
                  type="text"
                  id="search"
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                  placeholder="Search by course name..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                />
              </div>
            </div>
            <div className="w-full sm:w-1/2 xl:w-1/3">
              <label
                htmlFor="year"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Filter by Year
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Filter size={16} className="text-gray-400" />
                </div>
                <select
                  id="year"
                  className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md shadow-sm bg-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                  value={selectedYear}
                  onChange={handleYearChange}
                >
                  <option value="">All Years</option>
                  {yearOptions.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <ChevronDown size={16} className="text-gray-400" />
                </div>
              </div>
            </div>
            <div className="w-full sm:w-1/2 xl:w-1/3">
              <label
                htmlFor="year"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Filter by Sem
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Filter size={16} className="text-gray-400" />
                </div>
                <select
                  id="sem"
                  className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md shadow-sm bg-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                  value={selectedSem}
                  onChange={handleSemChange}
                >
                  <option value="">All Sems</option>
                  {semOptions.map((sem) => (
                    <option key={sem} value={sem}>
                      {sem}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <ChevronDown size={16} className="text-gray-400" />
                </div>
              </div>
            </div>
          </div>

          {/* Stats Summary */}
          <div className="mb-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
              <p className="text-sm text-blue-600 font-medium">Total Courses</p>
              <p className="text-xl font-bold text-blue-800">
                {allCourses.length}
              </p>
            </div>
            <div className="bg-green-50 border border-green-100 rounded-lg p-4">
              <p className="text-sm text-green-600 font-medium">
                Showing Courses
              </p>
              <p className="text-xl font-bold text-green-800">
                {filteredCourses.length}
              </p>
            </div>
            <div className="bg-purple-50 border border-purple-100 rounded-lg p-4">
              <p className="text-sm text-purple-600 font-medium">
                Teachers Available
              </p>
              <p className="text-xl font-bold text-purple-800">
                {teachers.length}
              </p>
            </div>
            <div className="bg-amber-50 border border-amber-100 rounded-lg p-4">
              <p className="text-sm text-amber-600 font-medium">
                New Assignments
              </p>
              <p className="text-xl font-bold text-amber-800">
                {assignments.filter((a) => !a.original).length}
              </p>
            </div>
          </div>

          {/* Courses Table */}
          <div className="overflow-x-auto rounded-lg border border-gray-200 shadow mb-6">
            <table className="w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6"
                  >
                    Course
                  </th>
                  <th
                    scope="col"
                    className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/12"
                  >
                    Curr/Sem/Year
                  </th>
                  <th
                    scope="col"
                    className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-1/18"
                  >
                    Divisions
                  </th>
                  <th
                    scope="col"
                    className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-1/18"
                  >
                    Batches
                  </th>
                  <th
                    scope="col"
                    className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-1/18"
                  >
                    Lect. Load (hrs)
                  </th>
                  <th
                    scope="col"
                    className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-1/18"
                  >
                    Lab Load (hrs)
                  </th>
                  <th
                    scope="col"
                    className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-1/18"
                  >
                    Total Load (hrs)
                  </th>
                  <th
                    scope="col"
                    className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-1/2"
                    colSpan={6}
                  >
                    Teacher Assignments
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredCourses.map((course) => {
                  const remainingDivisions = getRemainingDivisions(course._id);
                  const remainingBatches = getRemainingBatches(course._id);
                  const assignedTeachers = getAssignedTeachers(course._id);
                  const isFullyAssigned =
                    remainingDivisions === 0 && remainingBatches === 0;

                  return (
                    <tr
                      key={course._id}
                      className={`hover:bg-gray-50 transition-colors ${isFullyAssigned ? "bg-green-50" : ""
                        }`}
                    >
                      <td className="px-3 py-3 text-sm text-gray-900 align-top">
                        <div className="max-w-xs break-words font-medium">
                          {course.subject}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {course._id}
                        </div>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-900">
                        <span className="font-medium">
                          {course.curriculum}/{course.sem}
                        </span>
                        <div className="text-xs text-gray-500 mt-1">
                          Year: {course.year || "N/A"}
                        </div>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap text-sm text-center">
                        <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {course.divisions - remainingDivisions}/
                          {course.divisions}
                        </div>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap text-sm text-center">
                        <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          {course.batches - remainingBatches}/{course.batches}
                        </div>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap text-sm text-center">
                        <div
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${course.reqLectLoad === 0
                            ? "bg-green-100 text-green-800"
                            : "bg-yellow-100 text-yellow-800"
                            }`}
                        >
                          {course.reqLectLoad}/{course.totalLectLoad}
                        </div>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap text-sm text-center">
                        <div
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${course.reqLabLoad === 0
                            ? "bg-green-100 text-green-800"
                            : "bg-yellow-100 text-yellow-800"
                            }`}
                        >
                          {course.reqLabLoad}/{course.totalLabLoad}
                        </div>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap text-sm text-center">
                        <div
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${course.reqLectLoad + course.reqLabLoad === 0
                            ? "bg-green-100 text-green-800"
                            : "bg-yellow-100 text-yellow-800"
                            }`}
                        >
                          {course.reqLectLoad + course.reqLabLoad}/
                          {course.totalLoad}
                        </div>
                      </td>

                      {Array.from({ length: 6 }).map((_, index) => (
                        <td key={index} className="px-2 py-3">
                          <TeacherSelector
                            teachers={teachers}
                            courseId={course._id}
                            course={course}
                            setCourses={setCourses}
                            setTeachers={setTeachers}
                            remainingDivisions={remainingDivisions}
                            remainingBatches={remainingBatches}
                            onAssign={handleAssignTeacher}
                            getRemainingLoad={getRemainingLoad}
                            assignedTeachers={assignedTeachers}
                            disabled={isFullyAssigned}
                            index={index}
                            assignments={assignments}
                            setAssignments={setAssignments}
                            onDelete={handleDeleteAssignment}
                          />
                        </td>
                      ))}
                    </tr>
                  );
                })}

                {loading && filteredCourses.length === 0 && (
                  <tr>
                    <td
                      colSpan={13}
                      className="px-3 py-10 text-center text-sm text-gray-500"
                    >
                      <div className="flex flex-col items-center justify-center">
                        <Loader className="w-8 h-8 text-blue-500 animate-spin mb-2" />
                        <p>Loading courses...</p>
                      </div>
                    </td>
                  </tr>
                )}

                {!loading && filteredCourses.length === 0 && (
                  <tr>
                    <td
                      colSpan={13}
                      className="px-3 py-10 text-center text-sm text-gray-500"
                    >
                      <div className="flex flex-col items-center justify-center">
                        <Info className="w-8 h-8 text-gray-400 mb-2" />
                        <p>No courses available for the selected filters</p>
                        {(selectedYear || searchQuery) && (
                          <button
                            onClick={clearFilters}
                            className="mt-2 text-blue-600 hover:text-blue-800 underline text-sm"
                          >
                            Clear filters
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Load More Button */}
          {hasMore && filteredCourses.length > 0 && (
            <div className="flex justify-center mt-6">
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                {loadingMore ? (
                  <>
                    <Loader size={16} className="inline mr-2 animate-spin" />
                    Loading...
                  </>
                ) : (
                  "Load More Courses"
                )}
              </button>
            </div>
          )}

          {/* Course Count Summary */}
          <div className="mt-6 text-center text-sm text-gray-500">
            Showing {filteredCourses.length} out of {totalCourses} courses
            {(selectedYear || searchQuery) && (
              <span className="ml-2">
                (Filtered by:{" "}
                {[
                  selectedYear && `Year: ${selectedYear}`,
                  searchQuery && `Search: "${searchQuery}"`,
                ]
                  .filter(Boolean)
                  .join(", ")}
                )
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherAssignment;

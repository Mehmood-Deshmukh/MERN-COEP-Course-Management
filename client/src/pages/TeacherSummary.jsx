import React, { useState, useEffect } from 'react';
import { Users, User, Calendar, BookOpen, Clock, CircleCheck, AlertCircle, ChevronDown, ChevronUp, Search, Filter } from 'lucide-react';
import axios from 'axios';

const TeacherSummary = () => {
  const [teachers, setTeachers] = useState([]);
  const [filteredTeachers, setFilteredTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [expandedTeacher, setExpandedTeacher] = useState(null);

  useEffect(() => {
    const fetchTeachers = async () => {
      try {
        setLoading(true);
        // Fetch teachers with their assignments
        const response = await axios.get('/api/teachers/all');
        
        if (response.data.success) {
          // For each teacher, fetch their assignments
          const teachersWithAssignments = await Promise.all(
            response.data.data.map(async (teacher) => {
              const assignmentsResponse = await axios.get(`/api/assignments/teacher/${teacher._id}`);
              return {
                ...teacher,
                assignmentsDetails: assignmentsResponse.data.success ? assignmentsResponse.data.data : []
              };
            })
          );
          
          setTeachers(teachersWithAssignments);
          setFilteredTeachers(teachersWithAssignments);
        } else {
          setError(response.data.message);
        }
      } catch (err) {
        setError('Failed to fetch teachers data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchTeachers();
  }, []);

  useEffect(() => {
    // Filter teachers based on search term and status filter
    let filtered = [...teachers];
    
    if (searchTerm) {
      filtered = filtered.filter(teacher => 
        teacher.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter(teacher => teacher.status === statusFilter);
    }
    
    setFilteredTeachers(filtered);
  }, [searchTerm, statusFilter, teachers]);

  const toggleTeacherExpand = (teacherId) => {
    setExpandedTeacher(expandedTeacher === teacherId ? null : teacherId);
  };

  // Calculate load percentage for progress bars
  const calculateLoadPercentage = (assigned, limit) => {
    return Math.min(Math.round((assigned / limit) * 100), 100);
  };

  // Get appropriate color class based on load percentage
  const getLoadColorClass = (percentage) => {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 75) return 'bg-amber-500';
    return 'bg-emerald-500';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
          <p className="font-bold">Error:</p>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center">
          <Users className="h-8 w-8 text-blue-600 mr-3" />
          <h1 className="text-3xl font-bold text-gray-800">Teacher Summary</h1>
        </div>
        <div className="bg-blue-50 px-4 py-2 rounded-lg">
          <span className="text-blue-800 font-medium">Total Teachers: {teachers.length}</span>
        </div>
      </div>

      {/* Search and Filter Section */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-grow">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search teachers..."
            className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Filter className="h-5 w-5 text-gray-400" />
          </div>
          <select
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 mr-4">
              <CircleCheck className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Active Teachers</p>
              <p className="text-2xl font-bold">{teachers.filter(t => t.status === 'Active').length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-amber-100 mr-4">
              <AlertCircle className="h-6 w-6 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Inactive Teachers</p>
              <p className="text-2xl font-bold">{teachers.filter(t => t.status === 'Inactive').length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 mr-4">
              <BookOpen className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Assignments</p>
              <p className="text-2xl font-bold">
                {teachers.reduce((total, teacher) => total + (teacher.assignments?.length || 0), 0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Teachers List */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-100">
          <h2 className="text-lg font-medium text-gray-800">Teachers & Assignments</h2>
        </div>

        {filteredTeachers.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            No teachers found matching your search criteria.
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredTeachers.map((teacher) => (
              <div key={teacher._id} className="hover:bg-gray-50">
                <div 
                  className="px-6 py-4 cursor-pointer"
                  onClick={() => toggleTeacherExpand(teacher._id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className={`p-2 rounded-full ${teacher.status === 'Active' ? 'bg-green-100' : 'bg-amber-100'} mr-4`}>
                        <User className={`h-5 w-5 ${teacher.status === 'Active' ? 'text-green-600' : 'text-amber-600'}`} />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">{teacher.name}</h3>
                        <p className="text-sm text-gray-500">{teacher.position}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <div className="hidden md:block">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          teacher.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {teacher.status}
                        </span>
                      </div>
                      <div className="hidden md:flex flex-col items-end">
                        <div className="flex items-center space-x-1">
                          <Clock className="h-4 w-4 text-gray-400" />
                          <span className="text-sm font-medium text-gray-700">
                            {teacher.assignedLoad} / {teacher.loadLimit}
                          </span>
                        </div>
                        <div className="w-24 bg-gray-200 rounded-full h-2 mt-1">
                          <div 
                            className={`${getLoadColorClass(calculateLoadPercentage(teacher.assignedLoad, teacher.loadLimit))} h-2 rounded-full`} 
                            style={{ width: `${calculateLoadPercentage(teacher.assignedLoad, teacher.loadLimit)}%` }}
                          ></div>
                        </div>
                      </div>
                      <div>
                        {expandedTeacher === teacher._id ? 
                          <ChevronUp className="h-5 w-5 text-gray-400" /> : 
                          <ChevronDown className="h-5 w-5 text-gray-400" />
                        }
                      </div>
                    </div>
                  </div>
                  
                  {/* Mobile view for load */}
                  <div className="md:hidden mt-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        teacher.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {teacher.status}
                      </span>
                      <span className="text-sm font-medium text-gray-700">
                        {teacher.assignedLoad} / {teacher.loadLimit}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`${getLoadColorClass(calculateLoadPercentage(teacher.assignedLoad, teacher.loadLimit))} h-2 rounded-full`} 
                        style={{ width: `${calculateLoadPercentage(teacher.assignedLoad, teacher.loadLimit)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
                
                {/* Expanded Teacher Details */}
                {expandedTeacher === teacher._id && (
                  <div className="px-6 py-4 bg-gray-50">
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-500 mb-2">Load Summary</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                          <p className="text-sm text-gray-500">Assigned Load</p>
                          <p className="text-xl font-bold">{teacher.assignedLoad}</p>
                        </div>
                        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                          <p className="text-sm text-gray-500">Load Limit</p>
                          <p className="text-xl font-bold">{teacher.loadLimit}</p>
                        </div>
                        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                          <p className="text-sm text-gray-500">Remaining Load</p>
                          <p className="text-xl font-bold">{teacher.loadLimit - teacher.assignedLoad}</p>
                        </div>
                      </div>
                    </div>
                    
                    <h4 className="text-sm font-medium text-gray-500 mb-2">Assigned Courses</h4>
                    {teacher.assignmentsDetails && teacher.assignmentsDetails.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-100">
                            <tr>
                              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Course</th>
                              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Divisions</th>
                              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Batches</th>
                              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lecture Load</th>
                              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lab Load</th>
                              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Load</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {teacher.assignmentsDetails.map((assignment) => (
                              <tr key={assignment._id} className="hover:bg-gray-50">
                                <td className="px-4 py-3 whitespace-nowrap">
                                  <div className="text-sm font-medium text-gray-900">
                                    {assignment.courseId.name}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    {assignment.courseId.code}
                                  </div>
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                  {assignment.divisions}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                  {assignment.batches}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                  {assignment.lectureLoad}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                  {assignment.labLoad}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap">
                                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                                    {assignment.lectureLoad + assignment.labLoad}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="bg-white p-4 rounded-lg text-center text-gray-500 border border-gray-100">
                        No assignments for this teacher.
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TeacherSummary;
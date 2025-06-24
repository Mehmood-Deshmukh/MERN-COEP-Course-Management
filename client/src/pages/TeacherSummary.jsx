import React, { useState, useEffect } from 'react';
import { Users, User, Calendar, BookOpen, Clock, CircleCheck, AlertCircle, ChevronDown, ChevronUp, Search, Filter, Download, ArrowLeft, Edit, User2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import * as XLSX from 'xlsx';

const TeacherSummary = () => {
  const [teachers, setTeachers] = useState([]);
  const [filteredTeachers, setFilteredTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [expandedTeacher, setExpandedTeacher] = useState(null);
  const [editingTeacher, setEditingTeacher] = useState(null);
  const [newLoadLimit, setNewLoadLimit] = useState('');
  const [newTeacher, setNewTeacher] = useState({
    name: '',
    position: '',
    loadLimit: ''
  });
  const [showAddTeacherForm, setShowAddTeacherForm] = useState(false);
  
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTeachers = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/api/teachers/all');
        
        if (response.data.success) {
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
    // Close any open edit form when collapsing or expanding another teacher
    if (editingTeacher && editingTeacher !== teacherId) {
      setEditingTeacher(null);
      setNewLoadLimit('');
    }
  };


  const handleAddTeacher = async () => {
    try{
      if (!newTeacher.name || !newTeacher.position || !newTeacher.loadLimit) {
        alert('Please fill in all fields');
        return;
      }

      const loadValue = parseFloat(newTeacher.loadLimit);
      if (isNaN(loadValue) || loadValue < 0) {
        alert('Please enter a valid load limit');
        return;
      }

      const response = await axios.post('/api/teachers/add', {
        name: newTeacher.name.trim(),
        position: newTeacher.position.trim(),
        loadLimit: loadValue,
      });


      if (response.data.success) {
        const newTeacherData = {
          ...response.data.data,
          remainingLoad: loadValue,
          assignedLoad: 0,
          assignmentsDetails: []
        };
        
        setTeachers([...teachers, newTeacherData]);
        setFilteredTeachers([...filteredTeachers, newTeacherData]);
        setShowAddTeacherForm(false);
        setNewTeacher({ name: '', position: '', loadLimit: '' });
      } else {
        alert('Failed to add teacher: ' + response.data.message);
      }        
    } catch (err) {
      console.error(err.message);
      console.error('Error adding teacher:', err.response ? err.response.data : err.message);
      alert('Failed to add teacher. Please try again.');
    }
  };

  const startEditingTeacherLoad = (teacher, e) => {
    e.stopPropagation(); // Prevent triggering the expand/collapse
    setEditingTeacher(teacher._id);
    setNewLoadLimit(teacher.loadLimit.toString());
  };

  const cancelEditingTeacherLoad = (e) => {
    e.stopPropagation(); // Prevent triggering the expand/collapse
    setEditingTeacher(null);
    setNewLoadLimit('');
  };

  const saveTeacherLoad = async (teacher, e) => {
    e.stopPropagation(); // Prevent triggering the expand/collapse
    try {
      const loadValue = parseFloat(newLoadLimit);
      if (isNaN(loadValue) || loadValue < 0) {
        alert('Please enter a valid load value');
        return;
      }

      const response = await axios.put(`/api/teachers/update/${teacher._id}`, {
        loadLimit: loadValue,
        name: teacher.name,
        position: teacher.position,
      });

      if (response.data.success) {
        // Update the teacher in the state
        const updatedTeachers = teachers.map(t => {
          if (t._id === teacher._id) {
            return {
              ...t,
              loadLimit: loadValue,
              remainingLoad: loadValue - t.assignedLoad
            };
          }
          return t;
        });
        
        setTeachers(updatedTeachers);
        setEditingTeacher(null);
        setNewLoadLimit('');
      } else {
        alert('Failed to update teacher load: ' + response.data.message);
      }
    } catch (err) {
      console.error('Error updating teacher load:', err);
      alert('Failed to update teacher load. Please try again.');
    }
  };

  const calculateLoadPercentage = (assigned, limit) => {
    return Math.min(Math.round((assigned / limit) * 100), 100);
  };

  const getLoadColorClass = (percentage) => {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 75) return 'bg-amber-500';
    return 'bg-emerald-500';
  };

  const exportToExcel = () => {
    // Create workbook
    const workbook = XLSX.utils.book_new();
    
    // Current date and user info for metadata
    const currentDate = new Date().toISOString().slice(0, 10);
    const currentUser = "Mehmood-Deshmukhi"; // This could be dynamic from your auth system
    
    // 1. TEACHERS SUMMARY SHEET
    const summaryData = teachers.map(teacher => ({
      'Teacher Name': teacher.name,
      'Position': teacher.position,
      'Status': teacher.status,
      'Assigned Load': teacher.assignedLoad,
      'Load Limit': teacher.loadLimit,
      'Remaining Load': teacher.loadLimit - teacher.assignedLoad,
      'Load Percentage': `${calculateLoadPercentage(teacher.assignedLoad, teacher.loadLimit)}%`,
      'Number of Courses': teacher.assignmentsDetails?.length || 0
    }));
    
    const summarySheet = XLSX.utils.json_to_sheet(summaryData);
    
    // Set column widths for summary sheet
    const summaryColumnWidths = [
      { wch: 25 }, // Teacher Name
      { wch: 15 }, // Position
      { wch: 10 }, // Status
      { wch: 15 }, // Assigned Load
      { wch: 15 }, // Load Limit
      { wch: 15 }, // Remaining Load
      { wch: 15 }, // Load Percentage
      { wch: 18 }, // Number of Courses
    ];
    summarySheet['!cols'] = summaryColumnWidths;
    
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Teachers Summary');
    
    // 2. DETAILED ASSIGNMENTS SHEET
    const detailedData = [];
    teachers.forEach(teacher => {
      if (teacher.assignmentsDetails && teacher.assignmentsDetails.length > 0) {
        teacher.assignmentsDetails.forEach(assignment => {
          detailedData.push({
            'Teacher Name': teacher.name,
            'Teacher Position': teacher.position,
            'Teacher Status': teacher.status,
            'Course Name': assignment.courseId.subject,
            'Course Code': assignment.courseId.code,
            'Divisions': assignment.divisions,
            'Batches': assignment.batches,
            'Lecture Load': assignment.lectureLoad,
            'Lab Load': assignment.labLoad,
            'Total Load': assignment.lectureLoad + assignment.labLoad
          });
        });
      } else {
        detailedData.push({
          'Teacher Name': teacher.name,
          'Teacher Position': teacher.position,
          'Teacher Status': teacher.status,
          'Course Name': 'No assignments',
          'Course Code': '-',
          'Divisions': '-',
          'Batches': '-',
          'Lecture Load': 0,
          'Lab Load': 0,
          'Total Load': 0
        });
      }
    });
    
    const detailedSheet = XLSX.utils.json_to_sheet(detailedData);
    
    // Set column widths for detailed sheet
    const detailedColumnWidths = [
      { wch: 25 }, // Teacher Name
      { wch: 15 }, // Teacher Position
      { wch: 12 }, // Teacher Status
      { wch: 30 }, // Course Name
      { wch: 12 }, // Course Code
      { wch: 10 }, // Divisions
      { wch: 10 }, // Batches
      { wch: 15 }, // Lecture Load
      { wch: 12 }, // Lab Load
      { wch: 12 }, // Total Load
    ];
    detailedSheet['!cols'] = detailedColumnWidths;
    
    XLSX.utils.book_append_sheet(workbook, detailedSheet, 'Detailed Assignments');
    
    // 3. COURSES OVERVIEW SHEET - New sheet focusing on courses
    const coursesData = [];
    const courseMap = new Map();
    
    // Group assignments by course
    teachers.forEach(teacher => {
      if (teacher.assignmentsDetails && teacher.assignmentsDetails.length > 0) {
        teacher.assignmentsDetails.forEach(assignment => {
          const courseId = assignment.courseId._id;
          if (!courseMap.has(courseId)) {
            courseMap.set(courseId, {
              'Course Name': assignment.courseId.subject,
              'Course Code': assignment.courseId.code,
              'Total Teachers': 0,
              'Total Divisions': 0,
              'Total Batches': 0,
              'Teachers List': [],
            });
          }
          
          const courseData = courseMap.get(courseId);
          courseData['Total Teachers'] += 1;
          courseData['Total Divisions'] += parseInt(assignment.divisions) || 0;
          courseData['Total Batches'] += parseInt(assignment.batches) || 0;
          
          // Add teacher to the list if not already included
          if (!courseData['Teachers List'].includes(teacher.name)) {
            courseData['Teachers List'].push(teacher.name);
          }
        });
      }
    });
    
    // Convert map to array for the sheet
    courseMap.forEach((value) => {
      coursesData.push({
        'Course Name': value['Course Name'],
        'Course Code': value['Course Code'],
        'Total Teachers': value['Total Teachers'],
        'Total Divisions': value['Total Divisions'],
        'Total Batches': value['Total Batches'],
        'Teachers Assigned': value['Teachers List'].join(', ')
      });
    });
    
    // Sort courses by name
    coursesData.sort((a, b) => a['Course Name'].localeCompare(b['Course Name']));
    
    const coursesSheet = XLSX.utils.json_to_sheet(coursesData);
    
    // Set column widths for courses sheet
    const coursesColumnWidths = [
      { wch: 30 }, // Course Name
      { wch: 15 }, // Course Code
      { wch: 15 }, // Total Teachers
      { wch: 15 }, // Total Divisions
      { wch: 15 }, // Total Batches
      { wch: 50 }, // Teachers Assigned
    ];
    coursesSheet['!cols'] = coursesColumnWidths;
    
    XLSX.utils.book_append_sheet(workbook, coursesSheet, 'Courses Overview');
    
    // 4. DIVISIONS AND BATCHES SUMMARY - New sheet specifically for divisions and batches
    const divisionsData = [];
    
    // Create a simplified view focused on divisions and batches
    teachers.forEach(teacher => {
      if (teacher.assignmentsDetails && teacher.assignmentsDetails.length > 0) {
        teacher.assignmentsDetails.forEach(assignment => {
          divisionsData.push({
            'Teacher': teacher.name,
            'Course': assignment.courseId.subject,
            'Course Code': assignment.courseId.code,
            'Divisions Assigned': assignment.divisions,
            'Batches Assigned': assignment.batches,
            'Division Details': `${assignment.divisions} division(s)`,
            'Batch Details': `${assignment.batches} batch(es)`,
            'Total Teaching Load': assignment.lectureLoad + assignment.labLoad
          });
        });
      }
    });
    
    // Sort by teacher name
    divisionsData.sort((a, b) => a['Teacher'].localeCompare(b['Teacher']));
    
    const divisionsSheet = XLSX.utils.json_to_sheet(divisionsData);
    
    // Set column widths for divisions sheet
    const divisionsColumnWidths = [
      { wch: 25 }, // Teacher
      { wch: 30 }, // Course
      { wch: 12 }, // Course Code
      { wch: 18 }, // Divisions Assigned
      { wch: 18 }, // Batches Assigned
      { wch: 20 }, // Division Details
      { wch: 20 }, // Batch Details
      { wch: 18 }, // Total Teaching Load
    ];
    divisionsSheet['!cols'] = divisionsColumnWidths;
    
    XLSX.utils.book_append_sheet(workbook, divisionsSheet, 'Divisions & Batches');
    
    // Add metadata
    workbook.Props = {
      Title: "Faculty Assignments Report",
      Subject: "Teacher Course Assignments with Divisions and Batches",
      Author: currentUser,
      CreatedDate: new Date(),
      Manager: "Faculty Management System",
      Company: "Educational Institution",
      LastModifiedBy: currentUser,
    };
    
    // Get current date and time in a readable format for the filename
    const date = new Date().toISOString().slice(0, 10);
    const time = new Date().toTimeString().slice(0, 8).replace(/:/g, '-');
    
    // Export the file
    XLSX.writeFile(workbook, `Teachers_and_Courses_Report_${date}_${time}.xlsx`);
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
    <div className="container mx-auto px-4 py-8 max-w-7xl mt-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center">
          <button 
            onClick={() => navigate('/')} 
            className="mr-4 p-2 rounded-full hover:bg-gray-100 transition-colors duration-200"
            aria-label="Back"
          >
            <ArrowLeft className="h-6 w-6 text-blue-600" />
          </button>
          <div className="flex items-center">
            <Users className="h-8 w-8 text-blue-600 mr-3" />
            <h1 className="text-3xl font-bold text-gray-800">Teacher Summary</h1>
          </div>
        </div>
        <div className="flex space-x-4">
          <div className="bg-blue-50 px-4 py-2 rounded-lg">
            <span className="text-blue-800 font-medium">Total Teachers: {teachers.length}</span>
          </div>
          <button 
            onClick={exportToExcel}
            className="flex items-center bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
          >
            <Download className="h-5 w-5 mr-2" />
            Export to Excel
          </button>
          <button
          onClick={() => setShowAddTeacherForm(true)}
          className="flex items-center bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
          >
            <User2 className="h-5 w-5 mr-2" />
            Add Teacher
          </button>

        </div>
      </div>

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
                  
                  <div className="md:hidden mt-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        teacher.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {teacher.status}
                      </span>
                      <div className="flex items-center">
                        <span className="text-sm font-medium text-gray-700">
                          {teacher.assignedLoad} / {teacher.loadLimit}
                        </span>
                        <button 
                          onClick={(e) => startEditingTeacherLoad(teacher, e)} 
                          className="ml-1 text-blue-500 hover:text-blue-700"
                          aria-label="Edit teacher load"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`${getLoadColorClass(calculateLoadPercentage(teacher.assignedLoad, teacher.loadLimit))} h-2 rounded-full`} 
                        style={{ width: `${calculateLoadPercentage(teacher.assignedLoad, teacher.loadLimit)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
                
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
                          <div className="flex items-center">
                            {editingTeacher === teacher._id ? (
                              <div className="flex items-center">
                                <input
                                  type="number"
                                  min="0"
                                  step="1"
                                  value={newLoadLimit}
                                  onChange={(e) => setNewLoadLimit(e.target.value)}
                                  className="text-xl font-bold w-20 border-b-2 border-blue-500 focus:outline-none bg-transparent"
                                  onClick={(e) => e.stopPropagation()}
                                />
                                <div className="ml-2 flex">
                                  <button 
                                    onClick={(e) => saveTeacherLoad(teacher, e)}
                                    className="p-1 text-green-600 hover:text-green-800"
                                  >
                                    <CircleCheck className="h-5 w-5" />
                                  </button>
                                  <button 
                                    onClick={(e) => cancelEditingTeacherLoad(e)}
                                    className="p-1 text-red-600 hover:text-red-800"
                                  >
                                    <AlertCircle className="h-5 w-5" />
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <>
                                <p className="text-xl font-bold">{teacher.loadLimit}</p>
                                <button 
                                  onClick={(e) => startEditingTeacherLoad(teacher, e)} 
                                  className="ml-2 text-blue-500 hover:text-blue-700"
                                  aria-label="Edit teacher load"
                                >
                                  <Edit className="h-4 w-4" />
                                </button>
                              </>
                            )}
                          </div>
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
                                    {assignment.courseId.subject}
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


      {showAddTeacherForm && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white p-6 rounded  -lg shadow-lg w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Add New Teacher</h2>
            <form className="space-y-4">
              <div> 
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <input
                  type="text"
                  value={newTeacher.name}
                  onChange={(e) => setNewTeacher({ ...newTeacher, name: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 p-2"
                  required
                />

                <label className="block text-sm font-medium text-gray-700 mt-4">Position</label>
                <input
                  type="text"
                  value={newTeacher.position} 
                  onChange={(e) => setNewTeacher({ ...newTeacher, position: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm
  focus:ring-blue-500 focus:border-blue-500 p-2"
                  required
                />

                <label className="block text-sm font-medium text-gray-700 mt-4">Load Limit</label>
                <input
                  type="number"
                  min="0"
                  value={newTeacher.loadLimit}
                  onChange={(e) => setNewTeacher({ ...newTeacher, loadLimit: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 p-2"
                  required
                />
              </div>
              <div className="flex justify-end space-x-2">
                <button 
                  type="button" 
                  onClick={() => setShowAddTeacherForm(false)} 
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button 
                  type="button" 
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  onClick={handleAddTeacher}
                >
                  Add Teacher
                </button>
              </div>
            </form>
          </div>
        </div>
      )}




    </div>
  );
};

export default TeacherSummary;
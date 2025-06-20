import React, { useState } from 'react';
import { X } from 'lucide-react';

const AddCourseModal = ({ 
  isOpen, 
  onClose, 
  onSuccess,
  onError 
}) => {
  const [newCourse, setNewCourse] = useState({
    subject: "",
    curriculum: "",
    sem: "",
    lectHrs: 0,
    labHrs: 0,
    tutHrs: 0,
    divisions: 1,
    batches: 1,
  });
  
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (field, value) => {
    setNewCourse(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    
    try {
      const response = await fetch("/api/courses/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newCourse),
      });
      
      const data = await response.json();
      
      if (data.success) {
        onSuccess?.("New course added successfully!");
        handleClose();
      } else {
        onError?.(data.message || "Failed to add new course");
      }
    } catch (error) {
      onError?.("Failed to add new course");
      console.error("Error adding new course:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setNewCourse({
      subject: "",
      curriculum: "",
      sem: "",
      lectHrs: 0,
      labHrs: 0,
      tutHrs: 0,
      divisions: 1,
      batches: 1
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Add New Course</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Subject */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Subject *
              </label>
              <input
                type="text"
                value={newCourse.subject}
                onChange={(e) => handleInputChange('subject', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter subject name"
                required
              />
            </div>

            {/* Curriculum */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Curriculum *
              </label>
              <input
                type="text"
                value={newCourse.curriculum}
                onChange={(e) => handleInputChange('curriculum', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter curriculum"
                required
              />
            </div>

            {/* Semester */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Semester *
              </label>
              <select
                value={newCourse.sem}
                onChange={(e) => handleInputChange('sem', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Select semester</option>

                <option value="I">1st Semester</option>
                <option value="II">2nd Semester</option>
                <option value="III">3rd Semester</option> 
                <option value="IV">4th Semester</option>
                <option value="V">5th Semester</option>
                <option value="VI">6th Semester</option>
                <option value="VII">7th Semester</option>
                <option value="VIII">8th Semester</option>
                <option value="MTDS-I">MTech DS 1st Semester</option>
                <option value="MTDS-II">MTech DS 2nd Semester</option>
                <option value="MTCE-I">MTech CE 1st Semester</option>
                <option value="MTCE-II">MTech CE 2nd Semester</option>
                <option value="MTIS-I">MTech IS 1st Semester</option>
                <option value="MTIS-II">MTech IS 2nd Semester</option>


              </select>
            </div>

  

            {/* Lecture Hours */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Lecture Hours
              </label>
              <input
                type="number"
                min="0"
                value={newCourse.lectHrs}
                onChange={(e) => handleInputChange('lectHrs', parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Lab Hours */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Lab Hours
              </label>
              <input
                type="number"
                min="0"
                value={newCourse.labHrs}
                onChange={(e) => handleInputChange('labHrs', parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Tutorial Hours */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tutorial Hours
              </label>
              <input
                type="number"
                min="0"
                value={newCourse.tutHrs}
                onChange={(e) => handleInputChange('tutHrs', parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Divisions */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Divisions
              </label>
              <input
                type="number"
                min="1"
                value={newCourse.divisions}
                onChange={(e) => handleInputChange('divisions', parseInt(e.target.value) || 1)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Batches */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Batches
              </label>
              <input
                type="number"
                min="1"
                value={newCourse.batches}
                onChange={(e) => handleInputChange('batches', parseInt(e.target.value) || 1)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
        
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? 'Adding...' : 'Add Course'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddCourseModal;
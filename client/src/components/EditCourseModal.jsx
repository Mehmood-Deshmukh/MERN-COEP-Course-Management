import React, { useState, useEffect } from 'react';
import { X, Save, Loader } from 'lucide-react';

const EditCourseModal = ({ 
  isOpen, 
  onClose, 
  course, 
  onSuccess, 
  onError 
}) => {
  const [formData, setFormData] = useState({
    subject: '',
    curriculum: '',
    sem: '',
    year: '',
    divisions: 1,
    batches: 1
  });
  const [loading, setLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [originalData, setOriginalData] = useState({});

  const yearOptions = [
    '1st Year',
    '2nd Year', 
    '3rd Year',
    '4th Year',
    'MTech 1st Year',
    'MTech 2nd Year'
  ];

  useEffect(() => {
    if (course && isOpen) {
      const initialData = {
        subject: course.subject || '',
        curriculum: course.curriculum || '',
        sem: course.sem || '',
        year: course.year || '',
        divisions: course.divisions || 1,
        batches: course.batches || 1
      };
      setFormData(initialData);
      setOriginalData(initialData);
      setHasChanges(false);
    }
  }, [course, isOpen]);

  useEffect(() => {
    const dataChanged = Object.keys(formData).some(
      key => formData[key] !== originalData[key]
    );
    setHasChanges(dataChanged);
  }, [formData, originalData]);

  const handleInputChange = (e) => {
    const { name, value, type } = e.target;
    const newValue = type === 'number' ? parseInt(value) || 1 : value;
    
    setFormData(prev => ({
      ...prev,
      [name]: newValue
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!hasChanges) {
      onError('No changes detected');
      return;
    }

    if (!formData.subject.trim() || !formData.curriculum.trim() || 
        !formData.sem.trim() || !formData.year.trim()) {
      onError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    
    try {
      const response = await fetch(`/api/courses/edit/${course._id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      const result = await response.json();

      if (result.success) {
        onSuccess('Course updated successfully');
        onClose();
      } else {
        onError(result.message || 'Failed to update course');
        alert(result.message || 'Failed to update course');
      }
    } catch (error) {
      console.error('Error updating course:', error);
      onError('Failed to update course. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (hasChanges) {
      const confirmClose = window.confirm(
        'You have unsaved changes. Are you sure you want to close?'
      );
      if (!confirmClose) return;
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">
            Edit Course
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={loading}
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
              Subject *
            </label>
            <input
              type="text"
              id="subject"
              name="subject"
              value={formData.subject}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter subject name"
              disabled={loading}
              required
            />
          </div>

          <div>
            <label htmlFor="curriculum" className="block text-sm font-medium text-gray-700 mb-1">
              Curriculum *
            </label>
            <input
              type="text"
              id="curriculum"
              name="curriculum"
              value={formData.curriculum}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter curriculum"
              disabled={loading}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="sem" className="block text-sm font-medium text-gray-700 mb-1">
                Semester *
              </label>
              <input
                type="text"
                id="sem"
                name="sem"
                value={formData.sem}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., 1, 2, 3..."
                disabled={loading}
                required
              />
            </div>

            <div>
              <label htmlFor="year" className="block text-sm font-medium text-gray-700 mb-1">
                Year *
              </label>
              <select
                id="year"
                name="year"
                value={formData.year}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={loading}
                required
              >
                <option value="">Select Year</option>
                {yearOptions.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="divisions" className="block text-sm font-medium text-gray-700 mb-1">
                Divisions *
              </label>
              <input
                type="number"
                id="divisions"
                name="divisions"
                value={formData.divisions}
                onChange={handleInputChange}
                min="1"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={loading}
                required
              />
            </div>

            <div>
              <label htmlFor="batches" className="block text-sm font-medium text-gray-700 mb-1">
                Batches *
              </label>
              <input
                type="number"
                id="batches"
                name="batches"
                value={formData.batches}
                onChange={handleInputChange}
                min="1"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={loading}
                required
              />
            </div>
          </div>

          {course && (course.assignments?.length > 0) && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
              <p className="text-sm text-yellow-800">
                <strong>Note:</strong> This course has existing assignments. 
                Divisions and batches cannot be reduced below currently assigned values.
              </p>
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!hasChanges || loading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center"
            >
              {loading ? (
                <>
                  <Loader size={16} className="mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save size={16} className="mr-2" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditCourseModal;
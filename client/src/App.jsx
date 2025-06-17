import './App.css';
import TeacherAssignmentSystem from './components/CourseManagement';
import TeacherSummary from './pages/TeacherSummary';
import { Route, Routes } from 'react-router-dom';
import Assignment from './pages/Assignment';
import TeacherSelector from './components/TeacherSelector';
import EnhancedSidebarUpload from './components/FileUpload';

function App() {


    return (
        <>
            <EnhancedSidebarUpload />
            <Routes>
                <Route path="/" element={<Assignment />} />
                <Route path="/teachers" element={<TeacherSummary />} />
            </Routes>
            {/* <TeacherSummary /> */}
        </>
    );
}

export default App;

import './App.css';
import TeacherAssignmentSystem from './components/CourseManagement';
import TeacherSummary from './pages/TeacherSummary';
import { Route, Routes } from 'react-router-dom';
import Assignment from './pages/Assignment';

function App() {


    return (
        <>
            <Routes>
                <Route path="/" element={<Assignment />} />
                <Route path="/courses" element={<TeacherAssignmentSystem />} />
                <Route path="/teachers" element={<TeacherSummary />} />
                <Route path="/assignments" element={<TeacherAssignmentSystem />} />
            </Routes>
            {/* <TeacherSummary /> */}
        </>
    );
}

export default App;

import React from "react";
import FileUpload from "../components/FileUpload";
import TeacherAssignment from "../components/TeacherAssignment";
import { useState } from "react";

const Assignment = () => {
	const [file, setFile] = useState(null);
	const [loading, setLoading] = useState(false);

	async function onFileUpload(type) {
		let endpoint = "";
		if (type == "xlsx") endpoint = "/api/courses";
		else endpoint = "/api/teachers";

		if (!file) {
			alert("Please select a file first.");
			return;
		}

		setLoading(true);
		try {
			const formData = new FormData();
			formData.append("file", file);

			const response = await fetch(`${endpoint}/import`, {
				method: "POST",
				body: formData,
			});

			const data = await response.json();
			console.log(data.message, data.data);
		} catch (e) {
			console.log(e.message);
			alert(e.message);
		} finally {
			setLoading(false);
		}
	}
	return <div>
        {/* <h1>Assignment</h1>
        <h1>courses.xlsx</h1>
        <FileUpload setFile={setFile} loading={loading} onFileUpload={onFileUpload} fileType="xlsx"/>
        
        <h1>teachers.csv</h1>
        <FileUpload setFile={setFile} loading={loading} onFileUpload={onFileUpload} fileType="csv"/>
        
        <h1>Course Management</h1> */}
        <TeacherAssignment />
    </div>;
};

export default Assignment;

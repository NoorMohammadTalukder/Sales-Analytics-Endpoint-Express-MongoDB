const mongoose = require('mongoose');

const departmentSalarySchema = new mongoose.Schema({
  department: String, // Department name
  salary: Number,     // Salary expense for the department
});

module.exports = mongoose.model('DepartmentSalary', departmentSalarySchema);

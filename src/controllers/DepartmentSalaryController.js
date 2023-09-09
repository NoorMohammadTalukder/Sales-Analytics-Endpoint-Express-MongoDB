const DepartmentSalary = require('../models/DepartmentSalary');

exports.getDepartmentSalaryExpense = async (req, res) => {
  try {
    const departmentSalaryExpense = await DepartmentSalary.aggregate([
      {
        $group: {
          _id: '$department',       // Group by department
          totalSalaryExpense: {
            $sum: '$salary'         // Calculate the total salary expense for each department
          },
        },
      },
    ]);

    if (departmentSalaryExpense.length === 0) {
      res.status(404).json({ status: 'fail', message: 'No department salary data found.' });
    } else {
      res.status(200).json({ status: 'success', data: departmentSalaryExpense });
    }
  } catch (error) {
    res.status(500).json({ status: 'fail', data: error });
  }
};

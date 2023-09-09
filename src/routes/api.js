const express=require('express');
const SalesController=require("../controllers/SalesController");
const SalaryController=require("../controllers/DepartmentSalaryController");
const router=express.Router();


//basic sale api
router.get('/sales/get-all', SalesController.getSale);
router.post('/sales/add', SalesController.addSale);

//analytics sale api
router.get('/sales/total-revenue', SalesController.getTotalRevenue)
router.get('/sales/quantity-by-product', SalesController.getQuantityByProduct);
router.get('/sales/top-products', SalesController.getTopProducts);
router.get('/sales/average-price', SalesController.getAveragePrice);
router.get('/sales/revenue-by-month', SalesController.getRevenueByMonth);
router.get('/sales/highest-quantity-sold', SalesController.getHighestQuantitySold);

//salery api
router.get('/sales/department-salary-expense', SalaryController.getDepartmentSalaryExpense);


module.exports=router;
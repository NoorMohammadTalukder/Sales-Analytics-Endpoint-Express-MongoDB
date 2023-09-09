const Sales = require("../models/Sales");

//add sales
exports.addSale = async (req, res) => {
    try {
        const { product, quantity, price, date } = req.body;

        if (!product || !quantity || !price || !date) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        const newSale = new Sales({
            product,
            quantity,
            price,
            date,
        });

        await newSale.save();
        res.status(201).json({ status: "success", data: newSale });
    } catch (error) {
        res.status(500).json({ status: "fail", data: error });
    }
};

//get all sales
exports.getSale = async (req, res) => {
    try {
        const sales = await Sales.find();
        res.status(200).json({ status: "success", data: sales });
    } catch (error) {
        res.status(500).json({ status: "fail", data: error });
    }
}

//get revenue
exports.getTotalRevenue = async (req, res) => {
    try {
        const totalRevenue = await Sales.aggregate([
            {
                $group: {
                    _id: null, // Group all documents into one group
                    totalRevenue: {
                        $sum: { $multiply: ['$quantity', '$price'] }, // Calculate the total revenue
                    },
                },
            },
        ]);

        if (totalRevenue.length === 0) {
            res.status(200).json({ status: "fail", data: 'No sales data found.' });
        }

        res.status(200).json({ status: "success", data: { totalRevenue: totalRevenue[0].totalRevenue } });
    } catch (error) {
        res.status(500).json({ status: "fail", data: error });
    }
};

//calculate the total quantity sold for each product
//---
exports.getQuantityByProduct = async (req, res) => {
    try {
        const quantityByProduct = await Sales.aggregate([
            {
                $group: {
                    _id: {
                        _id: '$_id', // Keep the original _id
                        product: '$product', // Group by product name
                    },
                    totalQuantity: {
                        $sum: '$quantity', // Calculate the total quantity sold for each product
                    },
                },
            },
            {
                $project: {
                    _id: '$_id._id', // Restore the original _id
                    product: '$_id.product', // Include the product name
                    totalQuantity: 1, // Include the total quantity
                },
            },
        ]);

        if (quantityByProduct.length === 0) {
            res.status(200).json({ status: "fail", data: 'No sales data found.' });
        }

        res.status(200).json({ status: "success", data: { quantityByProduct: quantityByProduct } });

    } catch (error) {
        res.status(500).json({ status: "fail", data: error });
    }
};

//get top 5 product with the highest total revenue
exports.getTopProducts = async (req, res) => {
    try {
        const topProducts = await Sales.aggregate([
            {
                $group: {
                    _id: '$product', // Group by product name
                    totalRevenue: {
                        $sum: { $multiply: ['$quantity', '$price'] }, // Calculate the total revenue for each product
                    },
                },
            },
            {
                $sort: {
                    totalRevenue: -1, // Sort by totalRevenue in descending order (highest revenue first)
                },
            },
            {
                $limit: 5, // Limit to the top 5 products
            },
        ]);

        if (topProducts.length === 0) {
            res.status(200).json({ status: "fail", data: 'No sales data found.' });
        }
        res.status(200).json({ status: "success", data: { topProducts: topProducts } });
    } catch (error) {
        res.status(500).json({ status: "fail", data: error });
    }
};


// avg price of goods
exports.getAveragePrice = async (req, res) => {
    try {
        const averagePrice = await Sales.aggregate([
            {
                $group: {
                    _id: null, // Group all documents into one group
                    totalQuantity: { $sum: '$quantity' }, // Calculate the total quantity sold
                    totalRevenue: {
                        $sum: { $multiply: ['$quantity', '$price'] }, // Calculate the total revenue
                    },
                },
            },
            {
                $project: {
                    _id: 0, // Exclude _id from the result
                    averagePrice: {
                        $divide: ['$totalRevenue', '$totalQuantity'], // Calculate the average price
                    },
                },
            },
        ]);

        if (averagePrice.length === 0) {
            res.status(200).json({ status: "fail", data: 'No sales data found.' });
        }

        res.status(200).json({ status: "success", data: { averagePrice: averagePrice[0] } });

    } catch (error) {
        res.status(500).json({ status: "fail", data: error });
    }
};


// the total revenue for each month-year combination
exports.getRevenueByMonth = async (req, res) => {
    try {
      const revenueByMonth = await Sales.aggregate([
        {
          $project: {
            monthYear: {
              $dateToString: {
                format: '%Y-%m', // Format as 'YYYY-MM'
                date: '$date', // Use the 'date' field for formatting
              },
            },
            revenue: {
              $multiply: ['$quantity', '$price'], // Calculate the revenue for each document
            },
          },
        },
        {
          $group: {
            _id: '$monthYear', // Group by month and year
            totalRevenue: {
              $sum: '$revenue', // Calculate the total revenue for each month-year combination
            },
          },
        },
        {
          $sort: {
            _id: 1, // Sort by month-year in ascending order
          },
        },
        {
          $project: {
            _id: 0, // Exclude _id from the result
            revenueByMonth: '$_id', // Rename _id to revenueByMonth
            totalRevenue: 1, // Include totalRevenue
          },
        },
      ]);
  
      if (revenueByMonth.length === 0) {
        res.status(200).json({ status: "fail", data: 'No sales data found.' });
      }
  
      res.status(200).json({
        status: 'success',
        data: revenueByMonth.map((item) => ({
          revenueByMonth: item.revenueByMonth,
          totalRevenue: item.totalRevenue,
        })),
      });
  
    } catch (error) {
        res.status(500).json({ status: "fail", data: error });
    }
  };
  

  
//highst quantity sold on single day
exports.getHighestQuantitySold = async (req, res) => {
  try {
    const highestQuantitySold = await Sales.aggregate([
      {
        $group: {
          _id: '$date', // Group by date
          maxQuantity: { $max: '$quantity' }, // Find the maximum quantity sold on each date
        },
      },
      {
        $sort: {
          maxQuantity: -1, // Sort by maxQuantity in descending order (highest quantity first)
        },
      },
      {
        $limit: 1, // Limit to the top result (highest quantity)
      },
      {
        $lookup: {
          from: 'sales',
          let: { maxQuantity: '$maxQuantity', date: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$date', '$$date'] }, // Match the date
                    { $eq: ['$quantity', '$$maxQuantity'] }, // Match the maxQuantity
                  ],
                },
              },
            },
          ],
          as: 'productInfo',
        },
      },
      {
        $unwind: '$productInfo',
      },
      {
        $project: {
          _id: 0, // Exclude _id from the result
          date: '$_id', // Rename _id to date
          product: '$productInfo.product', // Include the product name
          quantity: '$maxQuantity', // Include the max quantity sold
        },
      },
    ]);

    if (highestQuantitySold.length === 0) {
      res.status(404).json({ status: 'fail', message: 'No sales data found.' });
    } else {
      res.status(200).json({ status: 'success', data: highestQuantitySold[0] });
    }
  } catch (error) {
    res.status(500).json({ status: 'fail', data: error });
  }
};

const asyncHandler = require("express-async-handler");
const Brand = require("../model/Brand.js");
const Category = require("../model/Category.js");
const Product = require("../model/Product.js");

// Create new product
exports.createProductCtrl = asyncHandler(async (req, res) => {
  //console.log(req.body);
  const { name, description, category, sizes, colors, price, totalQty, brand } =
    req.body;
  const convertedImgs = req.files.map((file) => file?.path);
  //Product exists
  const productExists = await Product.findOne({ name });
  if (productExists) {
    throw new Error("Product Already Exists");
  }
  //find the brand
  const brandFound = await Brand.findOne({
    name: brand,
  });

  if (!brandFound) {
    throw new Error(
      "Brand not found, please create brand first or check brand name"
    );
  }
  //find the category
  const categoryFound = await Category.findOne({
    name: category,
  });
  if (!categoryFound) {
    throw new Error(
      "Category not found, please create category first or check category name"
    );
  }
  //create the product
  const product = await Product.create({
    name,
    description,
    category,
    sizes,
    colors,
    user: req.userAuthId,
    price,
    totalQty,
    brand,
    images: convertedImgs,
  });
  //push the product into category
  categoryFound.products.push(product._id);
  //resave
  await categoryFound.save();
  //push the product into brand
  brandFound.products.push(product._id);
  //resave
  await brandFound.save();
  //send response
  res.json({
    status: "success",
    message: "Product created successfully",
    product,
  });
});

// Get all products
exports.getProductsCtrl = asyncHandler(async (req, res) => {
  console.log(req.query);
  //query
  let productQuery = Product.find();

  //search by name
  if (req.query.name) {
    productQuery = productQuery.find({
      name: { $regex: req.query.name, $options: "i" },
    });
  }

  //filter by brand
  if (req.query.brand) {
    productQuery = productQuery.find({
      brand: { $regex: req.query.brand, $options: "i" },
    });
  }

  //filter by category
  if (req.query.category) {
  // Use exact match without regex for "men"
  productQuery = productQuery.find({
    category: req.query.category,
  });
}


  //filter by color
  if (req.query.color) {
    productQuery = productQuery.find({
      colors: { $regex: req.query.color, $options: "i" },
    });
  }

  //filter by size
  if (req.query.size) {
    productQuery = productQuery.find({
      sizes: { $regex: req.query.size, $options: "i" },
    });
  }
  //filter by price range
  if (req.query.price) {
    const priceRange = req.query.price.split("-");
    //gte: greater or equal
    //lte: less than or equal to
    productQuery = productQuery.find({
      price: { $gte: priceRange[0], $lte: priceRange[1] },
    });
  }
  //pagination
  //page
  //const page = parseInt(req.query.page) ? parseInt(req.query.page) : 1;
  //limit
  //const limit = parseInt(req.query.limit) ? parseInt(req.query.limit) : 10;
  //startIdx
  //const startIndex = (page - 1) * limit;
  //endIdx
  //const endIndex = page * limit;
  //total
  const total = await Product.countDocuments();

  //productQuery = productQuery.skip(startIndex).limit(limit);

  //pagination results
  // const pagination = {};
  // if (endIndex < total) {
  //   pagination.next = {
  //     page: page + 1,
  //     limit,
  //   };
  // }
  // if (startIndex > 0) {
  //   pagination.prev = {
  //     page: page - 1,
  //     limit,
  //   };
  // }

  //await the query
  const products = await productQuery.populate("reviews");
  res.json({
    status: "success",
    total,
    results: products.length,
    message: "Products fetched successfully",
    products,
  });
});

// Get single product by ID
exports.getProductCtrl = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id).populate({
    path: "reviews",
    populate: {
      path: "user",
      select: "fullname",
    },
  });
  if (!product) {
    throw new Error("Product not found");
  }
  res.json({
    status: "success",
    message: "Product fetched successfully",
    product,
  });
});

// Update product
exports.updateProductCtrl = asyncHandler(async (req, res) => {
  const {
    name,
    description,
    category,
    sizes,
    colors,
    user,
    price,
    totalQty,
    brand,
  } = req.body;
  //validation

  //update
  const product = await Product.findByIdAndUpdate(
    req.params.id,
    {
      name,
      description,
      category,
      sizes,
      colors,
      user,
      price,
      totalQty,
      brand,
    },
    {
      new: true,
      runValidators: true,
    }
  );
  res.json({
    status: "success",
    message: "Product updated successfully",
    product,
  });
});

// Delete product
exports.deleteProductCtrl = asyncHandler(async (req, res) => {
  await Product.findByIdAndDelete(req.params.id);
  res.json({
    status: "success",
    message: "Product deleted successfully",
  });
});

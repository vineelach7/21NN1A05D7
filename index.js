const express = require('express');
const axios = require('axios');
const NodeCache = require('node-cache');
const app = express();
const port = 3000;

const cache = new NodeCache({ stdTTL: 300, checkperiod: 320 }); // Cache for 5 minutes

// Your simplified registration API endpoint
const registrationUrl = 'https://api.testserver.com/register';

// Register to all e-commerce companies
const register = async () => {
  try {
    const response = await axios.post(registrationUrl, { apiKey: 'YOUR_API_KEY' });
    console.log('Registered successfully');
  } catch (error) {
    console.error('Error registering:', error);
  }
};

register();

const fetchProducts = async (category) => {
    const apiUrl = `https://api.testserver.com/categories/${category}/products`;
    const cacheKey = `products_${category}`;
    
    if (cache.has(cacheKey)) {
      return cache.get(cacheKey);
    }
  
    try {
      const response = await axios.get(apiUrl);
      const products = response.data.products;
      cache.set(cacheKey, products);
      return products;
    } catch (error) {
      console.error('Error fetching products:', error);
      throw error;
    }
  };
  app.get('/categories/:category/products', async (req, res) => {
    const { category } = req.params;
    let { n = 10, page = 1, sortBy, sortOrder = 'asc' } = req.query;
    n = parseInt(n);
    page = parseInt(page);
  
    try {
      const products = await fetchProducts(category);
  
      // Apply sorting
      if (sortBy) {
        products.sort((a, b) => {
          if (sortOrder === 'asc') {
            return a[sortBy] - b[sortBy];
          } else {
            return b[sortBy] - a[sortBy];
          }
        });
      }
  
      // Paginate results
      const start = (page - 1) * n;
      const end = start + n;
      const paginatedProducts = products.slice(start, end);
  
      // Generate unique IDs
      const responseProducts = paginatedProducts.map(product => ({
        ...product,
        uniqueId: `${category}_${product.id}`
      }));
  
      res.json({
        totalProducts: products.length,
        totalPages: Math.ceil(products.length / n),
        currentPage: page,
        products: responseProducts
      });
    } catch (error) {
      res.status(500).json({ error: 'Error fetching products' });
    }
  });
app.get('/categories/:category/products/:productid', async (req, res) => {
  const { category, productid } = req.params;

  try {
    const products = await fetchProducts(category);
    const product = products.find(p => `${category}_${p.id}` === productid);

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json(product);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching product' });
  }
});
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
  });
      

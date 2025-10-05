// Dummy Product Data
const products = [
    {
      id: 1,
      image: 'https://via.placeholder.com/250x150',
      name: 'Fresh Tomatoes',
      farmerName: 'Raj Farms',
      location: 'Kerala',
      price: 25,
      type: 'fixed',
      rating: 4.5,
      deliveryOption: true,
      category: 'Vegetable'
    },
    {
      id: 2,
      image: 'https://via.placeholder.com/250x150',
      name: 'Organic Bananas',
      farmerName: 'Green Growers',
      location: 'Tamil Nadu',
      price: 35,
      type: 'auction',
      rating: 4.2,
      deliveryOption: false,
      category: 'Fruit'
    },
    // Add 10–15 products with diverse fields
    // ...
  ];
  
  // Pagination Support (optional extension)
  let currentPage = 1;
  const productsPerPage = 6;
  
  // Core display function
  function displayProducts(data) {
    const container = document.getElementById('productGrid');
    container.innerHTML = '';
  
    if (data.length === 0) {
      container.innerHTML = '<p>No products found. Try adjusting filters or search.</p>';
      return;
    }
  
    // Paginate
    const start = (currentPage - 1) * productsPerPage;
    const end = start + productsPerPage;
    const paginated = data.slice(start, end);
  
    paginated.forEach(product => {
      const card = document.createElement('div');
      card.className = 'product-card';
      card.innerHTML = `
        <img src="${product.image}" alt="${product.name}" />
        <h4>${product.name}</h4>
        <p>👨‍🌾 ${product.farmerName} | 📍 ${product.location}</p>
        <p class="price">₹${product.price}</p>
        <p>Type: ${product.type} | ⭐ ${product.rating}</p>
      `;
      container.appendChild(card);
    });
  }
  
  // Search Functionality
  document.getElementById('searchBtn').addEventListener('click', () => {
    const term = document.getElementById('searchInput').value.toLowerCase();
    const filtered = products.filter(p =>
      p.name.toLowerCase().includes(term) ||
      p.farmerName.toLowerCase().includes(term) ||
      p.location.toLowerCase().includes(term)
    );
    currentPage = 1;
    displayProducts(filtered);
  });
  
  // Filter Functionality
  document.getElementById('applyFilters').addEventListener('click', () => {
    const loc = document.getElementById('filterLocation').value.toLowerCase();
    const categories = Array.from(document.querySelectorAll('.filter-category:checked')).map(c => c.value);
    const types = Array.from(document.querySelectorAll('.filter-type:checked')).map(t => t.value);
    const min = Number(document.getElementById('minPrice').value) || 0;
    const max = Number(document.getElementById('maxPrice').value) || Infinity;
    const minRating = Number(document.getElementById('minRating').value) || 0;
  
    const filtered = products.filter(p => {
      return (!loc || p.location.toLowerCase().includes(loc)) &&
             (categories.length === 0 || categories.includes(p.category)) &&
             (types.length === 0 || types.includes(p.type)) &&
             (p.price >= min && p.price <= max) &&
             (p.rating >= minRating);
    });
  
    currentPage = 1;
    displayProducts(filtered);
  });
  
  // Reset Filters
  document.getElementById('resetFilters').addEventListener('click', () => {
    document.getElementById('filterLocation').value = '';
    document.querySelectorAll('.filter-category, .filter-type').forEach(el => el.checked = false);
    document.getElementById('minPrice').value = '';
    document.getElementById('maxPrice').value = '';
    document.getElementById('minRating').value = '';
    currentPage = 1;
    displayProducts(products);
  });
  
  // Sorting
  document.getElementById('sortSelect').addEventListener('change', (e) => {
    const value = e.target.value;
    let sorted = [...products];
  
    if (value === 'priceAsc') sorted.sort((a, b) => a.price - b.price);
    else if (value === 'priceDesc') sorted.sort((a, b) => b.price - a.price);
    else if (value === 'rating') sorted.sort((a, b) => b.rating - a.rating);
  
    currentPage = 1;
    displayProducts(sorted);
  });
  
  // Pagination
  document.getElementById('prevPage').addEventListener('click', () => {
    if (currentPage > 1) {
      currentPage--;
      displayProducts(products);
    }
  });
  
  document.getElementById('nextPage').addEventListener('click', () => {
    const totalPages = Math.ceil(products.length / productsPerPage);
    if (currentPage < totalPages) {
      currentPage++;
      displayProducts(products);
    }
  });
  
  // Initial load
  displayProducts(products);
  
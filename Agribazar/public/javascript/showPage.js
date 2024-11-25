document.addEventListener("DOMContentLoaded", function () {
  const productsPerPage = 12;
  let currentPage = 1;
  let totalPages = 1;
  const sortDropdownItems = document.querySelectorAll(".dropdown-item");
  const searchForm = document.getElementById("searchForm");
  const searchInput = document.getElementById("searchInput");
  let sort = "";
  let search = "";
  let minqty = 0;
  let maxqty = Number.MAX_SAFE_INTEGER;
  let minPrice = 0;
  let maxPrice = Number.MAX_SAFE_INTEGER;
  let quality = "";
  let page = 1;

  async function fetchProducts(
    sort = "",
    search = "",
    minqty = 0,
    maxqty = 1000,
    minPrice = 0,
    maxPrice = "",
    quality = "",
    page = 1
  ) {
    const loadingElement = document.getElementById("loading");
    const productContainer = document.querySelector(".products-container");
    const paginationContainer = document.querySelector(".pagination");

    loadingElement.style.display = "block";
    productContainer.innerHTML = "";
    paginationContainer.innerHTML = "";

    try {
      const response = await fetch(
        `/api/products?sort=${sort}&search=${search}&page=${page}&limit=${productsPerPage}&minqty=${minqty}&maxqty=${maxqty}&minprice=${minPrice}&maxprice=${maxPrice}&quality=${quality}`
      );
      const data = await response.json();
      products = data.products;
      totalPages = data.totalPages;
      renderProducts();
      renderPagination();
    } catch (error) {
      console.error("Error fetching products:", error);
      productContainer.innerHTML = "<p>Error loading products.</p>";
    } finally {
      loadingElement.style.display = "none";
    }
  }

  function renderProducts() {
    const productContainer = document.querySelector(".products-container");
    productContainer.innerHTML = "";

    products.forEach((product) => {
      const productCard = `
                <div class="col-md-4 mb-4">
                    <div class="card">
                        <img class="card-img-top" src="${
                          product.image_url
                        }" alt="Product Image">
                        <div class="card-body">
                            <h5 class="card-title">${product.product_name}</h5>
                            <p class="card-text">${truncateContent(
                              product.description,
                              100
                            )}</p>
                            <p class="card-text">Reserve Price: $${
                              product.reserve_price
                            }</p>
                            <p class="card-text">Starting Price: $${
                              product.starting_price
                            }</p>
                            <a href="/product/${
                              product.product_id
                            }" class="btn btn-primary">See Bids</a>
                        </div>
                    </div>
                </div>
            `;
      productContainer.insertAdjacentHTML("beforeend", productCard);
    });
  }

  function renderPagination() {
    const paginationContainer = document.querySelector(".pagination");
    paginationContainer.innerHTML = "";

    const maxVisiblePages = 5;

    if (currentPage > 1) {
      paginationContainer.innerHTML += `
                <li class="page-item">
                    <a class="page-link" href="#" aria-label="Previous" data-page="${
                      currentPage - 1
                    }">
                        <span aria-hidden="true">&laquo;</span>
                    </a>
                </li>
            `;
    }

    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      paginationContainer.innerHTML += `
                <li class="page-item ${currentPage === i ? "active" : ""}">
                    <a class="page-link" href="#" data-page="${i}">${i}</a>
                </li>
            `;
    }

    if (currentPage < totalPages) {
      paginationContainer.innerHTML += `
                <li class="page-item">
                    <a class="page-link" href="#" aria-label="Next" data-page="${
                      currentPage + 1
                    }">
                        <span aria-hidden="true">&raquo;</span>
                    </a>
                </li>
            `;
    }
  }

  function truncateContent(content, maxLength) {
    if (content.length > maxLength) {
      return content.substring(0, maxLength) + "...";
    }
    return content;
  }

  document
    .querySelector(".pagination")
    .addEventListener("click", function (event) {
      if (event.target.tagName === "A") {
        event.preventDefault();
        currentPage = parseInt(event.target.getAttribute("data-page"));
        fetchProducts(
          sort,
          search,
          minqty,
          maxqty,
          minPrice,
          maxPrice,
          quality,
          currentPage
        );
      }
    });

  sortDropdownItems.forEach((item) => {
    item.addEventListener("click", function (event) {
      event.preventDefault();
      const sortOption = event.target.getAttribute("href").split("=")[1];
      sort = sortOption;
      fetchProducts(
        sort,
        search,
        minqty,
        maxqty,
        minPrice,
        maxPrice,
        quality,
        1
      );
    });
  });
  function debounce(func, delay) {
    let timeout;
    return function (...args) {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), delay);
    };
  }
  searchInput.addEventListener(
    "input",
    debounce(function (event) {
      search = searchInput.value;
      fetchProducts(
        sort,
        searchInput.value,
        minqty,
        maxqty,
        minPrice,
        maxPrice,
        quality,
        1
      );
    }, 500)
  );
  fetchProducts();
  const urlParams = new URLSearchParams(window.location.search);
  const prevSearchQuery = urlParams.get("search");
  if (prevSearchQuery) {
    searchInput.value = prevSearchQuery;
  }
  const filterBtn = document.getElementById("filterBtn");
  const popupMenu = document.getElementById("popupMenu");
  const overlay = document.getElementById("overlay");
  const closeBtn = document.getElementById("closeBtn");

  // Show popup and overlay
  filterBtn.addEventListener("click", (event) => {
    event.preventDefault(); // Prevents the form from submitting
    // Show the popup
    popupMenu.style.display = "block";
    overlay.style.display = "block";
  });

  // Hide popup and overlay
  closeBtn.addEventListener("click", () => {
    popupMenu.style.display = "none";
    overlay.style.display = "none";
  });

  overlay.addEventListener("click", () => {
    popupMenu.style.display = "none";
    overlay.style.display = "none";
  });

  // Add input event listeners
  document
    .getElementById("qualityFilter")
    .addEventListener("change", (event) => {
      quality = event.target.value;
      console.log("Selected Quality:", event.target.value);
      fetchProducts(
        sort,
        search,
        minqty,
        maxqty,
        minPrice,
        maxPrice,
        quality,
        1
      );
    });

  document.getElementById("minQuantity").addEventListener("input", (event) => {
    console.log("Min Quantity:", event.target.value);
    minqty = event.target.value;
    fetchProducts(sort, search, minqty, maxqty, minPrice, maxPrice, quality, 1);
  });

  document.getElementById("maxQuantity").addEventListener("input", (event) => {
    console.log("Max Quantity:", event.target.value);
    maxqty = event.target.value;
    fetchProducts(sort, search, minqty, maxqty, minPrice, maxPrice, quality, 1);
  });

  document.getElementById("minPrice").addEventListener("input", (event) => {
    console.log("Min Price:", event.target.value);
    minPrice = event.target.value;
    fetchProducts(sort, search, minqty, maxqty, minPrice, maxPrice, quality, 1);
  });

  document.getElementById("maxPrice").addEventListener("input", (event) => {
    console.log("Max Price:", event.target.value);
    maxPrice = event.target.value;
    fetchProducts(sort, search, minqty, maxqty, minPrice, maxPrice, quality, 1);
  });
});
// Event listeners for input changes

// Cart Management
const Cart = {
    items: [],
    
    init() {
        this.loadFromStorage();
        this.updateUI();
    },
    
    loadFromStorage() {
        this.items = JSON.parse(localStorage.getItem('cart') || '[]');
    },
    
    saveToStorage() {
        localStorage.setItem('cart', JSON.stringify(this.items));
    },
    
    addItem(product) {
        const existingItem = this.items.find(item => item.id === product.id);
        if (existingItem) {
            existingItem.quantity++;
        } else {
            this.items.push({ ...product, quantity: 1 });
        }
        this.saveToStorage();
        this.updateUI();
        Toast.show('Đã thêm vào giỏ hàng', 'success');
    },
    
    removeItem(productId) {
        this.items = this.items.filter(item => item.id !== productId);
        this.saveToStorage();
        this.updateUI();
        Toast.show('Đã xóa sản phẩm', 'info');
    },
    
    updateQuantity(productId, quantity) {
        const item = this.items.find(item => item.id === productId);
        if (item) {
            item.quantity = Math.max(1, quantity);
            this.saveToStorage();
            this.updateUI();
        }
    },
    
    getTotal() {
        return this.items.reduce((total, item) => total + item.price * item.quantity, 0);
    },
    
    clear() {
        this.items = [];
        this.saveToStorage();
        this.updateUI();
    },
    
    updateUI() {
        // Update cart badge
        const badge = document.querySelector('.cart-badge');
        if (badge) {
            badge.textContent = this.items.length;
        }
        
        // Update cart items list if on cart page
        const cartList = document.querySelector('.cart-items');
        if (cartList) {
            this.renderCartItems(cartList);
        }
        
        // Update total price
        const totalElement = document.querySelector('.cart-total');
        if (totalElement) {
            totalElement.textContent = this.formatPrice(this.getTotal());
        }
        
        // Dispatch custom event
        document.dispatchEvent(new CustomEvent('cart:updated', {
            detail: { items: this.items, total: this.getTotal() }
        }));
    },
    
    renderCartItems(container) {
        container.innerHTML = this.items.map(item => `
            <div class="cart-item d-flex align-items-center p-3 border-bottom animate__animated animate__fadeIn">
                <img src="${item.image}" alt="${item.name}" class="me-3" style="width: 100px; height: 100px; object-fit: cover;">
                <div class="flex-grow-1">
                    <h5 class="mb-1">${item.name}</h5>
                    <p class="mb-1 text-primary">${this.formatPrice(item.price)}</p>
                    <div class="d-flex align-items-center">
                        <button class="btn btn-sm btn-outline-secondary" onclick="Cart.updateQuantity(${item.id}, ${item.quantity - 1})">-</button>
                        <span class="mx-2">${item.quantity}</span>
                        <button class="btn btn-sm btn-outline-secondary" onclick="Cart.updateQuantity(${item.id}, ${item.quantity + 1})">+</button>
                    </div>
                </div>
                <button class="btn btn-link text-danger" onclick="Cart.removeItem(${item.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `).join('');
    },
    
    formatPrice(price) {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(price);
    }
};

// Toast Notifications
const Toast = {
    show(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast show animate__animated animate__fadeIn bg-${type} text-white`;
        toast.innerHTML = `
            <div class="toast-body">
                ${message}
                <button type="button" class="btn-close btn-close-white ms-auto" onclick="this.parentElement.parentElement.remove()"></button>
            </div>
        `;
        
        document.querySelector('.toast-container').appendChild(toast);
        
        setTimeout(() => {
            toast.classList.replace('animate__fadeIn', 'animate__fadeOut');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
};

// Product Search and Filter
const ProductList = {
    init() {
        this.setupSearchFilter();
        this.setupSorting();
    },
    
    setupSearchFilter() {
        const searchInput = document.querySelector('#searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', this.debounce(() => {
                this.filterProducts();
            }, 300));
        }
    },
    
    setupSorting() {
        const sortSelect = document.querySelector('#sortSelect');
        if (sortSelect) {
            sortSelect.addEventListener('change', () => {
                this.sortProducts(sortSelect.value);
            });
        }
    },
    
    filterProducts() {
        const searchQuery = document.querySelector('#searchInput').value.toLowerCase();
        const products = document.querySelectorAll('.product-card');
        
        products.forEach(product => {
            const name = product.querySelector('.card-title').textContent.toLowerCase();
            const description = product.querySelector('.card-text').textContent.toLowerCase();
            
            if (name.includes(searchQuery) || description.includes(searchQuery)) {
                product.style.display = '';
                product.classList.add('animate__fadeIn');
            } else {
                product.style.display = 'none';
            }
        });
    },
    
    sortProducts(criteria) {
        const productsContainer = document.querySelector('.products-grid');
        const products = Array.from(productsContainer.children);
        
        products.sort((a, b) => {
            switch(criteria) {
                case 'price-asc':
                    return this.getPrice(a) - this.getPrice(b);
                case 'price-desc':
                    return this.getPrice(b) - this.getPrice(a);
                case 'name':
                    return this.getName(a).localeCompare(this.getName(b));
                default:
                    return 0;
            }
        });
        
        products.forEach(product => productsContainer.appendChild(product));
    },
    
    getPrice(productElement) {
        return parseFloat(productElement.querySelector('[data-price]').dataset.price);
    },
    
    getName(productElement) {
        return productElement.querySelector('.card-title').textContent;
    },
    
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
};

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    Cart.init();
    ProductList.init();
});
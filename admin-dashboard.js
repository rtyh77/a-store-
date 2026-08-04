// ================================================================
// لوحة تحكم عطور الفخامة - Admin Dashboard Script
// ================================================================

// Supabase Configuration
const SUPABASE_URL = 'https://fzwqqpmsnhvhzffhynse.supabase.co';
const SUPABASE_KEY = 'sb_publishable_9qHnFx2_tS8ISOsIShuySA_MEcEZAFd';

let supabase = null;
let currentUser = null;
let allProducts = [];
let allOrders = [];
let currentOrderId = null;
let currentContactField = null;
let currentProductId = null;

// Storage keys for localStorage
const STORAGE_KEYS = {
    LOGIN: 'admin_login_status',
    PASSWORD: 'admin_password',
    CONTACT_INFO: 'contact_info'
};

// Default contact info
const DEFAULT_CONTACT_INFO = {
    whatsapp: '213656708603',
    ccp: 'غير محدد',
    storeName: 'عطور الفخامة',
    email: 'qdwryyhyy644@gmail.com'
};

// ================================================================
// Initialize Supabase
// ================================================================
function initSupabase() {
    if (!window.supabase) {
        console.error('Supabase library not loaded');
        return false;
    }
    
    try {
        const { createClient } = window.supabase;
        supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
        console.log('Supabase initialized successfully');
        return true;
    } catch (error) {
        console.error('Error initializing Supabase:', error);
        return false;
    }
}

// ================================================================
// Authentication Functions
// ================================================================
function handleLogin() {
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();
    const errorMessage = document.getElementById('errorMessage');

    // Clear error message
    errorMessage.classList.remove('show');
    errorMessage.textContent = '';

    // Validate credentials
    if (username !== 'admin' || password !== 'fakhama2026') {
        errorMessage.textContent = '❌ اسم المستخدم أو كلمة المرور غير صحيحة!';
        errorMessage.classList.add('show');
        return;
    }

    // Store login status
    localStorage.setItem(STORAGE_KEYS.LOGIN, 'true');
    localStorage.setItem(STORAGE_KEYS.PASSWORD, password);
    currentUser = { username: 'admin' };

    // Initialize Supabase
    if (!initSupabase()) {
        errorMessage.textContent = '❌ خطأ في الاتصال بقاعدة البيانات!';
        errorMessage.classList.add('show');
        return;
    }

    // Show dashboard
    document.getElementById('loginContainer').style.display = 'none';
    document.getElementById('dashboardContainer').style.display = 'flex';

    // Load data
    loadDashboardData();
    loadContactInfo();
}

function handleLogout() {
    if (confirm('هل أنت متأكد من تسجيل الخروج؟')) {
        localStorage.removeItem(STORAGE_KEYS.LOGIN);
        localStorage.removeItem(STORAGE_KEYS.PASSWORD);
        currentUser = null;
        
        // Reset forms
        document.getElementById('username').value = '';
        document.getElementById('password').value = '';
        
        // Hide dashboard and show login
        document.getElementById('dashboardContainer').style.display = 'none';
        document.getElementById('loginContainer').style.display = 'flex';
    }
}

function checkAuthStatus() {
    const isLoggedIn = localStorage.getItem(STORAGE_KEYS.LOGIN) === 'true';
    
    if (isLoggedIn) {
        currentUser = { username: 'admin' };
        
        if (!initSupabase()) {
            console.error('Failed to initialize Supabase');
            return;
        }
        
        document.getElementById('loginContainer').style.display = 'none';
        document.getElementById('dashboardContainer').style.display = 'flex';
        
        loadDashboardData();
        loadContactInfo();
    }
}

// ================================================================
// Dashboard Data Loading
// ================================================================
async function loadDashboardData() {
    try {
        // Load products
        const { data: products, error: productsError } = await supabase
            .from('products')
            .select('*');
        
        if (productsError) {
            console.error('Error loading products:', productsError);
            allProducts = [];
        } else {
            allProducts = products || [];
        }

        // Load orders
        const { data: orders, error: ordersError } = await supabase
            .from('orders')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (ordersError) {
            console.error('Error loading orders:', ordersError);
            allOrders = [];
        } else {
            allOrders = orders || [];
        }

        // Update dashboard
        updateDashboardStats();
        loadLatestOrders();
        loadProductsTable();
        loadOrdersTable();

    } catch (error) {
        console.error('Error loading dashboard data:', error);
        showError('خطأ في تحميل البيانات');
    }
}

// ================================================================
// Dashboard Statistics
// ================================================================
function updateDashboardStats() {
    const statsGrid = document.getElementById('statsGrid');
    
    // Calculate statistics
    const totalProducts = allProducts.length;
    const totalOrders = allOrders.length;
    const totalSales = allOrders.reduce((sum, order) => sum + (parseFloat(order.total_price) || 0), 0);
    
    // Find best-selling product
    let bestSelling = 'لا توجد بيانات';
    if (allProducts.length > 0) {
        bestSelling = allProducts[0].name;
    }

    const stats = [
        {
            icon: '📦',
            title: 'عدد المنتجات',
            value: totalProducts,
            color: '#3b82f6'
        },
        {
            icon: '🛒',
            title: 'عدد الطلبات',
            value: totalOrders,
            color: '#f59e0b'
        },
        {
            icon: '💰',
            title: 'إجمالي المبيعات',
            value: `${totalSales.toLocaleString()} دج`,
            color: '#10b981'
        },
        {
            icon: '⭐',
            title: 'العطر الأكثر',
            value: bestSelling,
            color: '#d4af37'
        }
    ];

    statsGrid.innerHTML = stats.map(stat => `
        <div class="stat-card">
            <div class="stat-card-icon">${stat.icon}</div>
            <div class="stat-card-title">${stat.title}</div>
            <div class="stat-card-value" style="color: ${stat.color};">${stat.value}</div>
        </div>
    `).join('');
}

// ================================================================
// Orders Functions
// ================================================================
function loadLatestOrders() {
    const tableBody = document.getElementById('latestOrdersTable');
    
    if (allOrders.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="6" class="no-data">
                    <p>لا توجد طلبات حالياً</p>
                </td>
            </tr>
        `;
        return;
    }

    // Show only latest 5 orders
    const latestOrders = allOrders.slice(0, 5);

    tableBody.innerHTML = latestOrders.map(order => {
        const statusClass = getStatusClass(order.status);
        const createdDate = new Date(order.created_at).toLocaleDateString('ar-EG');
        
        return `
            <tr>
                <td>#${order.id}</td>
                <td>${order.customer_name}</td>
                <td>${order.phone}</td>
                <td>
                    <span class="status-badge ${statusClass}">
                        ${order.status}
                    </span>
                </td>
                <td>${parseFloat(order.total_price).toLocaleString()} دج</td>
                <td>${createdDate}</td>
            </tr>
        `;
    }).join('');
}

function loadOrdersTable() {
    const tableBody = document.getElementById('ordersTable');
    
    if (allOrders.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="7" class="no-data">
                    <p>لا توجد طلبات</p>
                </td>
            </tr>
        `;
        return;
    }

    tableBody.innerHTML = allOrders.map(order => {
        const statusClass = getStatusClass(order.status);
        const createdDate = new Date(order.created_at).toLocaleDateString('ar-EG');
        
        return `
            <tr>
                <td>#${order.id}</td>
                <td>${order.customer_name}</td>
                <td>${order.phone}</td>
                <td>
                    <span class="status-badge ${statusClass}">
                        ${order.status}
                    </span>
                </td>
                <td>${parseFloat(order.total_price).toLocaleString()} دج</td>
                <td>${createdDate}</td>
                <td>
                    <button class="btn btn-warning" onclick="openEditOrderModal(${order.id}, '${order.status}')">تحديث</button>
                    <button class="btn btn-danger" onclick="deleteOrder(${order.id})">حذف</button>
                </td>
            </tr>
        `;
    }).join('');
}

function getStatusClass(status) {
    switch(status) {
        case 'قيد الانتظار': return 'status-pending';
        case 'مكتملة': return 'status-completed';
        case 'ملغاة': return 'status-cancelled';
        default: return 'status-pending';
    }
}

function filterOrders(filterStatus) {
    // Update active filter button
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');

    // Filter and display orders
    const tableBody = document.getElementById('ordersTable');
    let filteredOrders = allOrders;

    if (filterStatus !== 'all') {
        filteredOrders = allOrders.filter(order => order.status === filterStatus);
    }

    if (filteredOrders.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="7" class="no-data">
                    <p>لا توجد طلبات في هذه الفئة</p>
                </td>
            </tr>
        `;
        return;
    }

    tableBody.innerHTML = filteredOrders.map(order => {
        const statusClass = getStatusClass(order.status);
        const createdDate = new Date(order.created_at).toLocaleDateString('ar-EG');
        
        return `
            <tr>
                <td>#${order.id}</td>
                <td>${order.customer_name}</td>
                <td>${order.phone}</td>
                <td>
                    <span class="status-badge ${statusClass}">
                        ${order.status}
                    </span>
                </td>
                <td>${parseFloat(order.total_price).toLocaleString()} دج</td>
                <td>${createdDate}</td>
                <td>
                    <button class="btn btn-warning" onclick="openEditOrderModal(${order.id}, '${order.status}')">تحديث</button>
                    <button class="btn btn-danger" onclick="deleteOrder(${order.id})">حذف</button>
                </td>
            </tr>
        `;
    }).join('');
}

function openEditOrderModal(orderId, currentStatus) {
    currentOrderId = orderId;
    document.getElementById('orderStatus').value = currentStatus;
    openModal('orderModal');
}

async function saveOrderStatus() {
    if (!currentOrderId) return;

    const newStatus = document.getElementById('orderStatus').value;

    try {
        const { error } = await supabase
            .from('orders')
            .update({ status: newStatus })
            .eq('id', currentOrderId);

        if (error) {
            showError('خطأ في تحديث حالة الطلب');
            console.error(error);
            return;
        }

        closeModal('orderModal');
        showSuccess('تم تحديث حالة الطلب بنجاح ✅');
        loadDashboardData();

    } catch (error) {
        showError('خطأ في العملية');
        console.error(error);
    }
}

async function deleteOrder(orderId) {
    if (!confirm('هل أنت متأكد من حذف هذا الطلب؟')) return;

    try {
        const { error } = await supabase
            .from('orders')
            .delete()
            .eq('id', orderId);

        if (error) {
            showError('خطأ في حذف الطلب');
            console.error(error);
            return;
        }

        showSuccess('تم حذف الطلب بنجاح ✅');
        loadDashboardData();

    } catch (error) {
        showError('خطأ في العملية');
        console.error(error);
    }
}

// ================================================================
// Products Functions
// ================================================================
function loadProductsTable() {
    const tableBody = document.getElementById('productsTable');
    
    // Add search functionality
    const searchBox = document.getElementById('productSearchBox');
    searchBox.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        let filteredProducts = allProducts.filter(product =>
            product.name.toLowerCase().includes(searchTerm) ||
            product.category.toLowerCase().includes(searchTerm)
        );

        displayProducts(filteredProducts, tableBody);
    });

    displayProducts(allProducts, tableBody);
}

function displayProducts(products, tableBody) {
    if (products.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="6" class="no-data">
                    <p>لا توجد منتجات</p>
                </td>
            </tr>
        `;
        return;
    }

    tableBody.innerHTML = products.map(product => `
        <tr>
            <td>#${product.id}</td>
            <td>${product.name}</td>
            <td><span class="category-badge">${product.category}</span></td>
            <td>${parseFloat(product.price).toLocaleString()} دج</td>
            <td>${product.stock}</td>
            <td>
                <button class="btn btn-primary" onclick="openEditProductModal(${product.id}, '${product.name}', '${product.category}', ${product.price}, ${product.stock}, '${product.description}', '${product.image_url}')">تعديل</button>
                <button class="btn btn-danger" onclick="deleteProduct(${product.id})">حذف</button>
            </td>
        </tr>
    `).join('');
}

function openAddProductModal() {
    currentProductId = null;
    document.getElementById('productModalTitle').textContent = 'إضافة منتج جديد';
    document.getElementById('productName').value = '';
    document.getElementById('productCategory').value = '';
    document.getElementById('productPrice').value = '';
    document.getElementById('productStock').value = '';
    document.getElementById('productDescription').value = '';
    document.getElementById('productImageUrl').value = '';
    openModal('productModal');
}

function openEditProductModal(id, name, category, price, stock, description, imageUrl) {
    currentProductId = id;
    document.getElementById('productModalTitle').textContent = 'تعديل المنتج';
    document.getElementById('productName').value = name;
    document.getElementById('productCategory').value = category;
    document.getElementById('productPrice').value = price;
    document.getElementById('productStock').value = stock;
    document.getElementById('productDescription').value = description;
    document.getElementById('productImageUrl').value = imageUrl;
    openModal('productModal');
}

async function saveProduct() {
    const name = document.getElementById('productName').value.trim();
    const category = document.getElementById('productCategory').value.trim();
    const price = parseFloat(document.getElementById('productPrice').value);
    const stock = parseInt(document.getElementById('productStock').value);
    const description = document.getElementById('productDescription').value.trim();
    const imageUrl = document.getElementById('productImageUrl').value.trim();

    // Validation
    if (!name || !category || !price || isNaN(stock)) {
        showError('يرجى ملء جميع الحقول المطلوبة');
        return;
    }

    try {
        if (currentProductId) {
            // Update existing product
            const { error } = await supabase
                .from('products')
                .update({
                    name,
                    category,
                    price,
                    stock,
                    description,
                    image_url: imageUrl
                })
                .eq('id', currentProductId);

            if (error) {
                showError('خطأ في تحديث المنتج');
                console.error(error);
                return;
            }
            showSuccess('تم تحديث المنتج بنجاح ✅');
        } else {
            // Add new product
            const { error } = await supabase
                .from('products')
                .insert([{
                    name,
                    category,
                    price,
                    stock,
                    description,
                    image_url: imageUrl
                }]);

            if (error) {
                showError('خطأ في إضافة المنتج');
                console.error(error);
                return;
            }
            showSuccess('تم إضافة المنتج بنجاح ✅');
        }

        closeModal('productModal');
        loadDashboardData();

    } catch (error) {
        showError('خطأ في العملية');
        console.error(error);
    }
}

async function deleteProduct(productId) {
    if (!confirm('هل أنت متأكد من حذف هذا المنتج؟')) return;

    try {
        const { error } = await supabase
            .from('products')
            .delete()
            .eq('id', productId);

        if (error) {
            showError('خطأ في حذف المنتج');
            console.error(error);
            return;
        }

        showSuccess('تم حذف المنتج بنجاح ✅');
        loadDashboardData();

    } catch (error) {
        showError('خطأ في العملية');
        console.error(error);
    }
}

// ================================================================
// Settings Functions
// ================================================================
function changePassword() {
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
        showError('يرجى ملء جميع حقول كلمة المرور');
        return;
    }

    if (currentPassword !== 'fakhama2026') {
        showError('كلمة المرور الحالية غير صحيحة');
        return;
    }

    if (newPassword !== confirmPassword) {
        showError('كلمات المرور الجديدة غير متطابقة');
        return;
    }

    if (newPassword.length < 6) {
        showError('كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل');
        return;
    }

    // Store new password
    localStorage.setItem(STORAGE_KEYS.PASSWORD, newPassword);

    // Clear inputs
    document.getElementById('currentPassword').value = '';
    document.getElementById('newPassword').value = '';
    document.getElementById('confirmPassword').value = '';

    showSuccess('تم تغيير كلمة المرور بنجاح ✅');
}

function loadContactInfo() {
    const stored = localStorage.getItem(STORAGE_KEYS.CONTACT_INFO);
    const contactInfo = stored ? JSON.parse(stored) : DEFAULT_CONTACT_INFO;

    document.getElementById('whatsappValue').textContent = contactInfo.whatsapp;
    document.getElementById('ccpValue').textContent = contactInfo.ccp;
    document.getElementById('storeNameValue').textContent = contactInfo.storeName;
    document.getElementById('emailValue').textContent = contactInfo.email;
}

function editContactInfo(field) {
    currentContactField = field;
    const labels = {
        whatsapp: 'رقم الواتساب',
        ccp: 'رقم الـ CCP',
        storeName: 'اسم المتجر',
        email: 'البريد الإلكتروني'
    };

    const values = {
        whatsapp: 'whatsappValue',
        ccp: 'ccpValue',
        storeName: 'storeNameValue',
        email: 'emailValue'
    };

    document.getElementById('contactModalTitle').textContent = `تحديث ${labels[field]}`;
    document.getElementById('contactLabel').textContent = labels[field];
    document.getElementById('contactValue').value = document.getElementById(values[field]).textContent;

    openModal('contactModal');
}

function saveContactInfo() {
    const newValue = document.getElementById('contactValue').value.trim();

    if (!newValue) {
        showError('يرجى إدخال قيمة');
        return;
    }

    const stored = localStorage.getItem(STORAGE_KEYS.CONTACT_INFO);
    const contactInfo = stored ? JSON.parse(stored) : DEFAULT_CONTACT_INFO;

    contactInfo[currentContactField] = newValue;
    localStorage.setItem(STORAGE_KEYS.CONTACT_INFO, JSON.stringify(contactInfo));

    const values = {
        whatsapp: 'whatsappValue',
        ccp: 'ccpValue',
        storeName: 'storeNameValue',
        email: 'emailValue'
    };

    document.getElementById(values[currentContactField]).textContent = newValue;

    closeModal('contactModal');
    showSuccess('تم تحديث البيانات بنجاح ✅');
}

// ================================================================
// Reports Functions
// ================================================================
function generateProductsReport() {
    const element = document.createElement('div');
    element.style.padding = '20px';
    element.style.fontFamily = 'Arial';
    element.style.direction = 'rtl';

    let html = `
        <h2 style="text-align: center; color: #d4af37; border-bottom: 3px solid #d4af37; padding-bottom: 10px;">
            📦 تقرير المنتجات
        </h2>
        <p style="text-align: center; margin: 20px 0;">
            <strong>عطور الفخامة</strong><br>
            تاريخ التقرير: ${new Date().toLocaleDateString('ar-EG')}<br>
            البريد: qdwryyhyy644@gmail.com
        </p>
        <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
            <thead>
                <tr style="background-color: #d4af37; color: black;">
                    <th style="padding: 10px; border: 1px solid #ddd;">رقم</th>
                    <th style="padding: 10px; border: 1px solid #ddd;">اسم العطر</th>
                    <th style="padding: 10px; border: 1px solid #ddd;">الفئة</th>
                    <th style="padding: 10px; border: 1px solid #ddd;">السعر (دج)</th>
                    <th style="padding: 10px; border: 1px solid #ddd;">الكمية</th>
                </tr>
            </thead>
            <tbody>
    `;

    allProducts.forEach((product, index) => {
        html += `
            <tr>
                <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">${index + 1}</td>
                <td style="padding: 10px; border: 1px solid #ddd;">${product.name}</td>
                <td style="padding: 10px; border: 1px solid #ddd;">${product.category}</td>
                <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">${parseFloat(product.price).toLocaleString()}</td>
                <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">${product.stock}</td>
            </tr>
        `;
    });

    html += `
            </tbody>
        </table>
        <p style="margin-top: 30px; text-align: center; color: #666; font-size: 12px;">
            إجمالي المنتجات: ${allProducts.length}<br>
            تم إنشاء هذا التقرير بواسطة نظام لوحة التحكم
        </p>
    `;

    element.innerHTML = html;

    const options = {
        margin: 10,
        filename: 'تقرير-المنتجات.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { orientation: 'portrait', unit: 'mm', format: 'a4' }
    };

    html2pdf().set(options).from(element).save();
    showSuccess('تم تصدير التقرير بنجاح ✅');
}

function generateOrdersReport() {
    const element = document.createElement('div');
    element.style.padding = '20px';
    element.style.fontFamily = 'Arial';
    element.style.direction = 'rtl';

    let html = `
        <h2 style="text-align: center; color: #d4af37; border-bottom: 3px solid #d4af37; padding-bottom: 10px;">
            🛒 تقرير الطلبات
        </h2>
        <p style="text-align: center; margin: 20px 0;">
            <strong>عطور الفخامة</strong><br>
            تاريخ التقرير: ${new Date().toLocaleDateString('ar-EG')}<br>
            البريد: qdwryyhyy644@gmail.com
        </p>
        <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
            <thead>
                <tr style="background-color: #d4af37; color: black;">
                    <th style="padding: 10px; border: 1px solid #ddd;">رقم الطلب</th>
                    <th style="padding: 10px; border: 1px solid #ddd;">اسم العميل</th>
                    <th style="padding: 10px; border: 1px solid #ddd;">الهاتف</th>
                    <th style="padding: 10px; border: 1px solid #ddd;">الحالة</th>
                    <th style="padding: 10px; border: 1px solid #ddd;">المبلغ (دج)</th>
                    <th style="padding: 10px; border: 1px solid #ddd;">التاريخ</th>
                </tr>
            </thead>
            <tbody>
    `;

    allOrders.forEach(order => {
        const date = new Date(order.created_at).toLocaleDateString('ar-EG');
        html += `
            <tr>
                <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">#${order.id}</td>
                <td style="padding: 10px; border: 1px solid #ddd;">${order.customer_name}</td>
                <td style="padding: 10px; border: 1px solid #ddd;">${order.phone}</td>
                <td style="padding: 10px; border: 1px solid #ddd;">${order.status}</td>
                <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">${parseFloat(order.total_price).toLocaleString()}</td>
                <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">${date}</td>
            </tr>
        `;
    });

    html += `
            </tbody>
        </table>
        <p style="margin-top: 30px; text-align: center; color: #666; font-size: 12px;">
            إجمالي الطلبات: ${allOrders.length}<br>
            تم إنشاء هذا التقرير بواسطة نظام لوحة التحكم
        </p>
    `;

    element.innerHTML = html;

    const options = {
        margin: 10,
        filename: 'تقرير-الطلبات.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { orientation: 'portrait', unit: 'mm', format: 'a4' }
    };

    html2pdf().set(options).from(element).save();
    showSuccess('تم تصدير التقرير بنجاح ✅');
}

function generateSalesReport() {
    const element = document.createElement('div');
    element.style.padding = '20px';
    element.style.fontFamily = 'Arial';
    element.style.direction = 'rtl';

    const totalSales = allOrders.reduce((sum, order) => sum + (parseFloat(order.total_price) || 0), 0);
    const completedOrders = allOrders.filter(o => o.status === 'مكتملة').length;
    const pendingOrders = allOrders.filter(o => o.status === 'قيد الانتظار').length;
    const cancelledOrders = allOrders.filter(o => o.status === 'ملغاة').length;

    let html = `
        <h2 style="text-align: center; color: #d4af37; border-bottom: 3px solid #d4af37; padding-bottom: 10px;">
            💰 تقرير المبيعات والإحصائيات
        </h2>
        <p style="text-align: center; margin: 20px 0;">
            <strong>عطور الفخامة</strong><br>
            تاريخ التقرير: ${new Date().toLocaleDateString('ar-EG')}<br>
            البريد: qdwryyhyy644@gmail.com
        </p>

        <div style="margin: 30px 0; padding: 20px; background-color: #f5f5f5; border-radius: 8px;">
            <h3 style="color: #d4af37; margin-bottom: 15px;">📊 الإحصائيات العامة</h3>
            <table style="width: 100%; text-align: right;">
                <tr>
                    <td style="padding: 10px;"><strong>إجمالي المبيعات:</strong></td>
                    <td style="padding: 10px; color: #10b981; font-weight: bold;">${totalSales.toLocaleString()} دج</td>
                </tr>
                <tr>
                    <td style="padding: 10px;"><strong>عدد الطلبات المكتملة:</strong></td>
                    <td style="padding: 10px; color: #10b981; font-weight: bold;">${completedOrders}</td>
                </tr>
                <tr>
                    <td style="padding: 10px;"><strong>عدد الطلبات قيد الانتظار:</strong></td>
                    <td style="padding: 10px; color: #f59e0b; font-weight: bold;">${pendingOrders}</td>
                </tr>
                <tr>
                    <td style="padding: 10px;"><strong>عدد الطلبات الملغاة:</strong></td>
                    <td style="padding: 10px; color: #ef4444; font-weight: bold;">${cancelledOrders}</td>
                </tr>
                <tr>
                    <td style="padding: 10px;"><strong>إجمالي عدد الطلبات:</strong></td>
                    <td style="padding: 10px; color: #3b82f6; font-weight: bold;">${allOrders.length}</td>
                </tr>
                <tr>
                    <td style="padding: 10px;"><strong>عدد المنتجات:</strong></td>
                    <td style="padding: 10px; color: #3b82f6; font-weight: bold;">${allProducts.length}</td>
                </tr>
            </table>
        </div>

        <h3 style="color: #d4af37; margin-top: 30px; margin-bottom: 15px;">📈 تفاصيل الطلبات</h3>
        <table style="width: 100%; border-collapse: collapse;">
            <thead>
                <tr style="background-color: #d4af37; color: black;">
                    <th style="padding: 10px; border: 1px solid #ddd;">رقم الطلب</th>
                    <th style="padding: 10px; border: 1px solid #ddd;">الحالة</th>
                    <th style="padding: 10px; border: 1px solid #ddd;">المبلغ (دج)</th>
                    <th style="padding: 10px; border: 1px solid #ddd;">التاريخ</th>
                </tr>
            </thead>
            <tbody>
    `;

    allOrders.forEach(order => {
        const date = new Date(order.created_at).toLocaleDateString('ar-EG');
        html += `
            <tr>
                <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">#${order.id}</td>
                <td style="padding: 10px; border: 1px solid #ddd;">${order.status}</td>
                <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">${parseFloat(order.total_price).toLocaleString()}</td>
                <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">${date}</td>
            </tr>
        `;
    });

    html += `
            </tbody>
        </table>
        <p style="margin-top: 30px; text-align: center; color: #666; font-size: 12px;">
            تم إنشاء هذا التقرير بواسطة نظام لوحة التحكم<br>
            جميع الأرقام المالية بالدينار الجزائري (دج)
        </p>
    `;

    element.innerHTML = html;

    const options = {
        margin: 10,
        filename: 'تقرير-المبيعات.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { orientation: 'portrait', unit: 'mm', format: 'a4' }
    };

    html2pdf().set(options).from(element).save();
    showSuccess('تم تصدير التقرير بنجاح ✅');
}

// ================================================================
// Tab Navigation
// ================================================================
function switchTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });

    // Remove active class from all nav links
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });

    // Show selected tab
    document.getElementById(tabName).classList.add('active');

    // Add active class to clicked nav link
    event.target.closest('.nav-link').classList.add('active');

    // Update page title
    const titles = {
        dashboard: 'لوحة المعلومات',
        products: 'إدارة المنتجات',
        orders: 'إدارة الطلبات',
        reports: 'التقارير والإحصائيات',
        settings: 'الإعدادات'
    };

    document.getElementById('pageTitle').textContent = titles[tabName] || 'لوحة التحكم';
}

// ================================================================
// Modal Functions
// ================================================================
function openModal(modalId) {
    document.getElementById(modalId).classList.add('show');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('show');
}

// Close modal when clicking outside of content
document.addEventListener('click', function(event) {
    const modals = document.querySelectorAll('.modal.show');
    modals.forEach(modal => {
        if (event.target === modal) {
            modal.classList.remove('show');
        }
    });
});

// ================================================================
// Utility Functions
// ================================================================
function showSuccess(message) {
    const messageEl = document.getElementById('successMessage');
    messageEl.textContent = message;
    messageEl.classList.add('show');

    setTimeout(() => {
        messageEl.classList.remove('show');
    }, 3000);
}

function showError(message) {
    const messageEl = document.getElementById('errorMessage') || document.getElementById('successMessage');
    messageEl.textContent = message;
    messageEl.classList.add('show');

    setTimeout(() => {
        messageEl.classList.remove('show');
    }, 3000);
}

// ================================================================
// Initialize Application
// ================================================================
document.addEventListener('DOMContentLoaded', function() {
    checkAuthStatus();

    // Add enter key support for login
    document.getElementById('password').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            handleLogin();
        }
    });
});

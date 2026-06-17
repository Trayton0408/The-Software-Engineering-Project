document.addEventListener('DOMContentLoaded', () => {
    const loginScreen = document.getElementById('login-screen');
    const appContent = document.getElementById('app-content');
    const studentView = document.getElementById('student-view');
    const staffView = document.getElementById('staff-view');
    const userDisplayName = document.getElementById('user-display-name');
    
    const menuGrid = document.getElementById('menu-grid');
    const searchBar = document.getElementById('search-bar');
    const filterButtons = document.querySelectorAll('.filter-btn');
    const cartItemsList = document.getElementById('cart-items-list');
    const cartTotalDisplay = document.getElementById('cart-total');
    
    let allMenuItems = []; 
    let activeCategory = 'all';
    let cart = JSON.parse(localStorage.getItem('cafeteria_cart')) || []; 

    document.getElementById('login-btn').addEventListener('click', () => {
        const userId = document.getElementById('login-id').value.trim();
        const password = document.getElementById('login-pass').value;

        if (!userId || !password) {
            alert("Please complete both entry lines.");
            return;
        }

        fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, password })
        })
        .then(res => {
            if (!res.ok) throw new Error("Invalid credential footprint check.");
            return res.json();
        })
        .then(data => {
            if (data.success) {
                userDisplayName.textContent = `User: ${data.name} (${data.role.toUpperCase()})`;
                loginScreen.classList.add('hidden');
                appContent.classList.remove('hidden');

                if (data.role === 'staff') {
                    studentView.classList.add('hidden');
                    staffView.classList.remove('hidden');
                    loadStaffOrders();
                } else {
                    staffView.classList.add('hidden');
                    studentView.classList.remove('hidden');
                    initializeStudentApp();
                }
            }
        })
        .catch(err => alert("Sign In Blocked: " + err.message));
    });

    document.getElementById('logout-btn').addEventListener('click', () => {
        loginScreen.classList.remove('hidden');
        appContent.classList.add('hidden');
        document.getElementById('login-id').value = '';
        document.getElementById('login-pass').value = '';
    });

    function initializeStudentApp() {
        fetch('/api/menu')
            .then(res => res.json())
            .then(menuItems => {
                allMenuItems = menuItems; 
                renderMenu(allMenuItems);  
                renderCart();
            });
    }

    function loadStaffOrders() {
        const container = document.getElementById('staff-orders-container');
        fetch('/api/staff/orders')
            .then(res => res.json())
            .then(orders => {
                container.innerHTML = '';
                if (orders.length === 0) {
                    container.innerHTML = '<p style="color: #757575;">No orders registered in system tracks yet.</p>';
                    return;
                }
                
                orders.forEach(order => {
                    const div = document.createElement('div');
                    const isPending = order.status === 'pending';
                    
                    div.style.background = "white";
                    div.style.borderLeft = isPending ? "6px solid #ff9100" : "6px solid #2e7d32";
                    div.style.padding = "1.25rem";
                    div.style.marginBottom = "1rem";
                    div.style.borderRadius = "4px";
                    div.style.boxShadow = "0 2px 4px rgba(0,0,0,0.05)";
                    div.style.border = "1px solid #e0e0e0";
                    
                    let parsedItems = [];
                    try {
                        parsedItems = JSON.parse(order.items);
                    } catch(e) {
                        parsedItems = [];
                    }
                    
                    const itemsListHTML = parsedItems.map(i => `
                        <li style="margin-bottom: 4px;">
                            <strong>${i.name}</strong> <span style="color:#1b5e20; font-weight:bold;">x${i.quantity}</span>
                        </li>
                    `).join('');
                    
                    div.innerHTML = `
                        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #ddd; padding-bottom: 6px; margin-bottom: 8px;">
                            <h4 style="margin: 0; font-size: 1.1rem; color: #1b5e20;">Ticket #${order.ticket_number}</h4>
                            <span style="background: ${isPending ? '#fff3e0' : '#e8f5e9'}; color: ${isPending ? '#ff9100' : '#2e7d32'}; padding: 4px 10px; border-radius: 12px; font-size: 0.8rem; font-weight: bold; text-transform: uppercase;">
                                ${order.status || 'pending'}
                            </span>
                        </div>
                        <ul style="margin: 0; padding-left: 20px; color: #333;">
                            ${itemsListHTML || '<li>No items mapped</li>'}
                        </ul>
                        <div style="margin-top: 8px; font-size: 0.85rem; color: #666; border-top: 1px dashed #ccc; padding-top: 6px; display: flex; justify-content: space-between; align-items: center;">
                            <span><strong>Target Pickup Time:</strong> ${order.pickup_time}</span>
                            ${isPending ? `<button class="complete-btn" data-id="${order.id}" style="background: #2e7d32; color: white; border: none; padding: 6px 12px; border-radius: 4px; font-weight: bold; cursor: pointer;">Complete Order</button>` : ''}
                        </div>
                    `;
                    
                    const completeBtn = div.querySelector('.complete-btn');
                    if (completeBtn) {
                        completeBtn.addEventListener('click', (e) => {
                            const orderId = e.target.getAttribute('data-id');
                            fetch('/api/staff/orders/complete', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ orderId })
                            })
                            .then(res => res.json())
                            .then(data => {
                                if (data.success) {
                                    loadStaffOrders();
                                }
                            });
                        });
                    }
                    
                    container.appendChild(div);
                });
            })
            .catch(err => {
                container.innerHTML = '<p style="color: red;">Error updating active tracks.</p>';
            });
    }

    document.getElementById('refresh-orders-btn').addEventListener('click', loadStaffOrders);

    function renderMenu(items) {
        menuGrid.innerHTML = ''; 
        items.forEach(item => {
            const card = document.createElement('div');
            card.className = `menu-card ${item.is_in_stock ? '' : 'out-of-stock'}`;
            const displaysPrice = item.price ? item.price.toFixed(2) : '0.00';
            card.innerHTML = `
                <h3>${item.name}</h3>
                <p class="category">${item.category}</p>
                <p class="price">$${displaysPrice}</p>
                ${item.is_in_stock ? '<button class="add-to-cart-btn">Add to Order</button>' : '<strong style="color:red;">SOLD OUT</strong>'}
            `;

            if (item.is_in_stock) {
                card.addEventListener('click', () => {
                    document.getElementById('modal-item-name').textContent = item.name;
                    document.getElementById('modal-item-description').textContent = item.description || "No info provided.";
                    document.getElementById('modal-cal').textContent = item.calories || 0;
                    document.getElementById('modal-protein').textContent = item.protein || 0;
                    document.getElementById('modal-carbs').textContent = item.carbs || 0;
                    document.getElementById('modal-fats').textContent = item.fats || 0;
                    document.getElementById('details-modal').classList.remove('hidden'); 
                });

                card.querySelector('.add-to-cart-btn').addEventListener('click', (e) => {
                    e.stopPropagation();
                    const existingItem = cart.find(c => c.id === item.id);
                    if (existingItem) existingItem.quantity += 1;
                    else cart.push({ ...item, quantity: 1 });
                    renderCart();
                });
            }
            menuGrid.appendChild(card);
        });
    }

    function renderCart() {
        cartItemsList.innerHTML = '';
        localStorage.setItem('cafeteria_cart', JSON.stringify(cart));
        if (cart.length === 0) {
            cartItemsList.innerHTML = '<p class="empty-cart-msg">Your cart is currently empty.</p>';
            cartTotalDisplay.textContent = '0.00';
            return;
        }
        let runningTotal = 0;
        cart.forEach(item => {
            const itemTotal = item.price * item.quantity;
            runningTotal += itemTotal;
            const itemRow = document.createElement('div');
            itemRow.className = 'cart-item';
            itemRow.innerHTML = `<span><strong>${item.name}</strong> x${item.quantity}</span><span>$${itemTotal.toFixed(2)}</span>`;
            cartItemsList.appendChild(itemRow);
        });
        cartTotalDisplay.textContent = runningTotal.toFixed(2);
    }

    document.getElementById('clear-cart-btn').addEventListener('click', () => { cart = []; renderCart(); });

    document.getElementById('checkout-btn').addEventListener('click', () => {
        if (cart.length === 0) return alert("Your cart is empty!");
        const timeInput = document.getElementById('pickup-time');
        const pickupTime = timeInput ? timeInput.value : '';
        if (!pickupTime) return alert("Select a pickup hour.");

        fetch('/api/orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ items: cart, pickup_time: pickupTime })
        })
        .then(res => {
            if (!res.ok) throw new Error(`Code: ${res.status}`);
            return res.json();
        })
        .then(data => {
            if (data.success) {
                alert(`Order recorded!\n\nTicket: #${data.ticketNumber}\nTime: ${pickupTime}`);
                cart = [];
                if (timeInput) timeInput.value = '';
                renderCart();
            }
        })
        .catch(err => alert("Error processing transaction: " + err.message));
    });

    function filterMenu() {
        const searchText = searchBar.value.toLowerCase();
        const filtered = allMenuItems.filter(item => {
            return (activeCategory === 'all' || item.category === activeCategory) && item.name.toLowerCase().includes(searchText);
        });
        renderMenu(filtered);
    }
    searchBar.addEventListener('input', filterMenu);
    filterButtons.forEach(btn => btn.addEventListener('click', (e) => {
        filterButtons.forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        activeCategory = e.target.getAttribute('data-category');
        filterMenu();
    }));

    document.getElementById('close-modal').addEventListener('click', () => document.getElementById('details-modal').classList.add('hidden'));

    // Close nutritional modal when clicking outside of the content box
    window.addEventListener('click', (e) => {
        const modal = document.getElementById('details-modal');
        if (e.target === modal) {
            modal.classList.add('hidden');
        }
    });
});
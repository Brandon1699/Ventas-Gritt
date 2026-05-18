const parsePrice = (priceStr) => {
    if (!priceStr) return 0;
    // Remueve 'S/', espacios y convierte a número
    return parseFloat(priceStr.toString().replace(/S\/\s*/g, '').trim()) || 0;
};

const formatPrice = (price) => {
    return `S/ ${price.toFixed(2)}`;
};

document.addEventListener('DOMContentLoaded', () => {
    const APP_SCRIPT_URL_KEY = 'ventas_app_script_url';
    let SCRIPT_URL = localStorage.getItem(APP_SCRIPT_URL_KEY);
    
    // Elementos del DOM
    const modal = document.getElementById('config-modal');
    const inputUrl = document.getElementById('script-url');
    const btnSaveUrl = document.getElementById('btn-save-url');
    const btnConfig = document.getElementById('btn-config');
    
    const loader = document.getElementById('loader');
    const viewVenta = document.getElementById('view-venta');
    const viewProductos = document.getElementById('view-productos');
    const tabVenta = document.getElementById('tab-venta');
    const tabProductos = document.getElementById('tab-productos');
    
    const form = document.getElementById('venta-form');
    const searchInput = document.getElementById('search-input');
    const searchResults = document.getElementById('search-results');
    
    const cardProduct = document.getElementById('selected-product-card');
    const displayName = document.getElementById('display-name');
    const displayType = document.getElementById('display-type');
    const displayRemate = document.getElementById('display-remate');
    const price1 = document.getElementById('price-1');
    const price3 = document.getElementById('price-3');
    const price6 = document.getElementById('price-6');
    const price12 = document.getElementById('price-12');
    
    const inputCantidad = document.getElementById('cantidad');
    const btnMinus = document.getElementById('btn-minus');
    const btnPlus = document.getElementById('btn-plus');
    
    const appliedPriceDisplay = document.getElementById('applied-price');
    const totalPriceDisplay = document.getElementById('total-price');
    const btnSubmit = document.getElementById('btn-submit');
    
    // Elementos de Precio Personalizado
    const checkCustomPrice = document.getElementById('check-custom-price');
    const customPriceContainer = document.getElementById('custom-price-container');
    const customPriceInput = document.getElementById('custom-price-input');
    
    const successMessage = document.getElementById('success-message');
    const btnNewSale = document.getElementById('btn-new-sale');

    const productsTbody = document.getElementById('products-tbody');
    const filterProductos = document.getElementById('filter-productos');
    
    // Elementos de Modal de Productos
    const productModal = document.getElementById('product-modal');
    const productModalTitle = document.getElementById('product-modal-title');
    const productForm = document.getElementById('product-form');
    const btnAddProduct = document.getElementById('btn-add-product');
    const btnCancelProduct = document.getElementById('btn-cancel-product');
    const btnSaveProduct = document.getElementById('btn-save-product');
    
    const originalPrenda = document.getElementById('original-prenda');
    const prodTipo = document.getElementById('prod-tipo');
    const prodPrenda = document.getElementById('prod-prenda');
    const prodRemate = document.getElementById('prod-remate');
    const prodU = document.getElementById('prod-u');
    const prod3 = document.getElementById('prod-3');
    const prod6 = document.getElementById('prod-6');
    const prod12 = document.getElementById('prod-12');

    let products = [];
    let selectedProduct = null;
    
    // Estados de filtros y ordenamiento
    let currentSortColumn = '';
    let currentSortAsc = true;
    let filterOnlyRemate = false;
    let currentFilterTipo = 'todos';

    const btnFilterRemate = document.getElementById('btn-filter-remate');
    const selectFilterTipo = document.getElementById('select-filter-tipo');
    const sortableHeaders = document.querySelectorAll('.sortable');

    // Inicialización
    if (!SCRIPT_URL) {
        modal.classList.add('active');
    } else {
        loadProducts();
    }

    btnSaveUrl.addEventListener('click', () => {
        const url = inputUrl.value.trim();
        if (url) {
            SCRIPT_URL = url;
            localStorage.setItem(APP_SCRIPT_URL_KEY, url);
            modal.classList.remove('active');
            loadProducts();
        }
    });

    if (btnConfig) {
        btnConfig.addEventListener('click', () => {
            inputUrl.value = SCRIPT_URL || '';
            modal.classList.add('active');
        });
    }

    // Cargar productos
    async function loadProducts() {
        try {
            loader.style.display = 'block';
            form.style.display = 'none';
            
            const response = await fetch(SCRIPT_URL);
            const result = await response.json();
            
            if (result.status === 'success') {
                products = result.data;
                loader.style.display = 'none';
                
                // Solo mostrar viewVenta si la pestaña de ventas está activa (o es la primera carga)
                if (tabVenta.classList.contains('active')) {
                    viewVenta.style.display = 'block';
                    viewProductos.style.display = 'none';
                } else {
                    viewVenta.style.display = 'none';
                    viewProductos.style.display = 'block';
                }
                
                form.style.display = 'block'; // Asegurar que el formulario no se oculte permanentemente
                
                populateFilterTipos(products);
                applyFiltersAndSort();
            } else {
                throw new Error(result.error || 'Error al cargar');
            }
        } catch (error) {
            console.error('Error:', error);
            loader.innerHTML = `<p style="color: var(--danger)">Error al cargar productos. Verifica la URL y permisos de Google Script.</p>
                                <button class="btn-secondary" onclick="localStorage.removeItem('${APP_SCRIPT_URL_KEY}'); location.reload();">Cambiar URL</button>`;
        }
    }

    // Función para renderizar resultados
    function renderSearchResults(query = '') {
        searchResults.innerHTML = '';
        
        let filtered = products;
        if (query.length > 0) {
            filtered = products.filter(p => 
                (p['Prenda'] && p['Prenda'].toLowerCase().includes(query)) ||
                (p['Tipo de Prenda'] && p['Tipo de Prenda'].toLowerCase().includes(query))
            );
        }
        
        // Ya no limitamos los resultados para que se muestren todos
        // filtered = filtered.slice(0, 20);

        if (filtered.length > 0) {
            filtered.forEach(p => {
                const li = document.createElement('li');
                
                let textContent = `${p['Tipo de Prenda']} - ${p['Prenda']}`;
                li.textContent = textContent;
                
                // Agregar etiqueta de remate en la lista si corresponde
                if (p['Es Remate'] === 'Sí' || p['Es Remate'] === 'Si') {
                    const badge = document.createElement('span');
                    badge.textContent = '¡Remate!';
                    badge.style.cssText = 'margin-left: 10px; background: var(--danger); color: white; font-size: 10px; padding: 2px 6px; border-radius: 8px; font-weight: bold; text-transform: uppercase;';
                    li.appendChild(badge);
                }

                li.addEventListener('click', (e) => {
                    e.stopPropagation(); // Evita que se cierre inmediatamente
                    selectProduct(p);
                });
                searchResults.appendChild(li);
            });
            searchResults.classList.add('active');
        } else {
            searchResults.classList.remove('active');
        }
    }

    // Búsqueda
    searchInput.addEventListener('input', (e) => {
        renderSearchResults(e.target.value.toLowerCase());
    });

    searchInput.addEventListener('focus', (e) => {
        renderSearchResults(e.target.value.toLowerCase());
    });

    searchInput.addEventListener('click', (e) => {
        renderSearchResults(e.target.value.toLowerCase());
    });

    // Ocultar resultados al hacer clic fuera
    document.addEventListener('click', (e) => {
        if (!searchInput.contains(e.target) && !searchResults.contains(e.target)) {
            searchResults.classList.remove('active');
        }
    });

    // Seleccionar producto
    function selectProduct(p) {
        selectedProduct = p;
        searchInput.value = p['Prenda'];
        searchResults.classList.remove('active');
        
        // Mostrar tarjeta
        displayType.textContent = p['Tipo de Prenda'];
        displayName.textContent = p['Prenda'];
        displayRemate.style.display = (p['Es Remate'] === 'Sí' || p['Es Remate'] === 'Si') ? 'inline-block' : 'none';
        
        price1.textContent = formatPrice(parsePrice(p['Unidad']));
        price3.textContent = formatPrice(parsePrice(p['≥ 3']));
        price6.textContent = formatPrice(parsePrice(p['≥ 6']));
        price12.textContent = formatPrice(parsePrice(p['≥ 12']));
        
        cardProduct.style.display = 'block';
        btnSubmit.disabled = false;
        
        inputCantidad.value = 1;
        calculateTotal();
    }

    // Controles de cantidad
    btnMinus.addEventListener('click', () => {
        let val = parseInt(inputCantidad.value) || 1;
        if (val > 1) {
            inputCantidad.value = val - 1;
            calculateTotal();
        }
    });

    btnPlus.addEventListener('click', () => {
        let val = parseInt(inputCantidad.value) || 0;
        inputCantidad.value = val + 1;
        calculateTotal();
    });

    inputCantidad.addEventListener('input', calculateTotal);

    // Calcular totales
    function calculateTotal() {
        if (!selectedProduct) return;
        
        const qty = parseInt(inputCantidad.value) || 1;
        let unitPrice = 0;
        
        // Limpiar highlight
        document.querySelectorAll('.tier').forEach(t => t.style.background = 'rgba(255, 255, 255, 0.03)');
        
        if (checkCustomPrice.checked) {
            unitPrice = parseFloat(customPriceInput.value) || 0;
        } else {
            if (qty >= 12) {
                unitPrice = parsePrice(selectedProduct['≥ 12']);
                price12.parentElement.style.background = 'rgba(59, 130, 246, 0.2)';
            } else if (qty >= 6) {
                unitPrice = parsePrice(selectedProduct['≥ 6']);
                price6.parentElement.style.background = 'rgba(59, 130, 246, 0.2)';
            } else if (qty >= 3) {
                unitPrice = parsePrice(selectedProduct['≥ 3']);
                price3.parentElement.style.background = 'rgba(59, 130, 246, 0.2)';
            } else {
                unitPrice = parsePrice(selectedProduct['Unidad']);
                price1.parentElement.style.background = 'rgba(59, 130, 246, 0.2)';
            }
        }
        
        const total = unitPrice * qty;
        
        appliedPriceDisplay.textContent = formatPrice(unitPrice);
        totalPriceDisplay.textContent = formatPrice(total);
    }
    
    checkCustomPrice.addEventListener('change', (e) => {
        if (e.target.checked) {
            customPriceContainer.style.display = 'block';
            customPriceInput.focus();
        } else {
            customPriceContainer.style.display = 'none';
        }
        calculateTotal();
    });

    customPriceInput.addEventListener('input', calculateTotal);

    // Enviar Venta
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!selectedProduct) return;

        const qty = parseInt(inputCantidad.value) || 1;
        const unitPrice = parseFloat(appliedPriceDisplay.textContent.replace(/S\/\s*/g, ''));
        const total = parseFloat(totalPriceDisplay.textContent.replace(/S\/\s*/g, ''));

        const data = {
            accion: 'venta',
            tipo: selectedProduct['Tipo de Prenda'],
            prenda: selectedProduct['Prenda'],
            cantidad: qty,
            precioUnitario: unitPrice,
            total: total
        };

        const originalBtnText = btnSubmit.innerHTML;
        btnSubmit.disabled = true;
        btnSubmit.innerHTML = '<div class="spinner" style="width:20px;height:20px;margin:0;border-width:2px"></div>';

        try {
            const response = await fetch(SCRIPT_URL, {
                method: 'POST',
                mode: 'no-cors', // Importante para evitar error de CORS al enviar JSON
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });
            
            // Con no-cors no podemos leer response.json(), asumimos éxito si no lanza error
            form.style.display = 'none';
            successMessage.style.display = 'block';

        } catch (error) {
            console.error('Error:', error);
            alert('Hubo un error al registrar la venta.');
        } finally {
            btnSubmit.disabled = false;
            btnSubmit.innerHTML = originalBtnText;
        }
    });

    btnNewSale.addEventListener('click', () => {
        successMessage.style.display = 'none';
        form.style.display = 'block';
        form.reset();
        checkCustomPrice.checked = false;
        customPriceContainer.style.display = 'none';
        selectedProduct = null;
        cardProduct.style.display = 'none';
        appliedPriceDisplay.textContent = 'S/ 0.00';
        totalPriceDisplay.textContent = 'S/ 0.00';
        btnSubmit.disabled = true;
    });

    // Navegación de Pestañas
    tabVenta.addEventListener('click', () => {
        tabVenta.classList.add('active');
        tabProductos.classList.remove('active');
        viewVenta.style.display = 'block';
        viewProductos.style.display = 'none';
    });

    tabProductos.addEventListener('click', () => {
        tabProductos.classList.add('active');
        tabVenta.classList.remove('active');
        viewVenta.style.display = 'none';
        viewProductos.style.display = 'block';
    });

    // Poblar dropdown de Tipos
    function populateFilterTipos(prods) {
        const tipos = new Set();
        prods.forEach(p => {
            if (p['Tipo de Prenda']) tipos.add(p['Tipo de Prenda']);
        });
        
        selectFilterTipo.innerHTML = '<option value="todos">Todos los tipos</option>';
        Array.from(tipos).sort().forEach(tipo => {
            const option = document.createElement('option');
            option.value = tipo;
            option.textContent = tipo;
            selectFilterTipo.appendChild(option);
        });
    }

    // Aplicar filtros y ordenamiento
    function applyFiltersAndSort() {
        const query = filterProductos.value.toLowerCase();
        
        let result = products.filter(p => {
            const isRemate = (p['Es Remate'] === 'Sí' || p['Es Remate'] === 'Si');
            
            // Filtro rápido: Solo Remate
            if (filterOnlyRemate && !isRemate) return false;
            
            // Filtro rápido: Tipo
            if (currentFilterTipo !== 'todos' && p['Tipo de Prenda'] !== currentFilterTipo) return false;
            
            // Filtro por texto (query)
            if (query.length > 0) {
                // Comprobar nombre y tipo
                const matchesText = (p['Prenda'] && p['Prenda'].toLowerCase().includes(query)) ||
                                    (p['Tipo de Prenda'] && p['Tipo de Prenda'].toLowerCase().includes(query));
                
                // Comprobar remate escrito
                const matchesRemateKeyword = query === 'remate' && isRemate;
                
                // Comprobar precios exactos
                const u = parsePrice(p['Unidad']).toString();
                const p3 = parsePrice(p['≥ 3']).toString();
                const p6 = parsePrice(p['≥ 6']).toString();
                const p12 = parsePrice(p['≥ 12']).toString();
                
                const matchesPrice = u.includes(query) || p3.includes(query) || p6.includes(query) || p12.includes(query);
                
                if (!matchesText && !matchesRemateKeyword && !matchesPrice) return false;
            }
            
            return true;
        });

        // Ordenar
        if (currentSortColumn) {
            result.sort((a, b) => {
                let valA = a[currentSortColumn];
                let valB = b[currentSortColumn];
                
                // Si es precio (ej. Unidad, >= 3), convertimos a número
                if (currentSortColumn !== 'Prenda') {
                    valA = parsePrice(valA);
                    valB = parsePrice(valB);
                } else {
                    valA = (valA || '').toLowerCase();
                    valB = (valB || '').toLowerCase();
                }

                if (valA < valB) return currentSortAsc ? -1 : 1;
                if (valA > valB) return currentSortAsc ? 1 : -1;
                return 0;
            });
        }

        renderProductsTable(result);
    }

    // Renderizar Tabla de Productos
    function renderProductsTable(productsToRender) {
        productsTbody.innerHTML = '';
        
        if (productsToRender.length === 0) {
            productsTbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: var(--text-muted); padding: 20px;">No se encontraron productos.</td></tr>';
            return;
        }

        productsToRender.forEach(p => {
            const isRemate = (p['Es Remate'] === 'Sí' || p['Es Remate'] === 'Si');
            const tr = document.createElement('tr');
            
            tr.innerHTML = `
                <td>
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <strong>${p['Prenda'] || 'Sin nombre'}</strong>
                        ${isRemate ? '<span class="product-badge">¡Remate!</span>' : ''}
                    </div>
                    <div style="font-size: 11px; color: var(--text-muted); margin-top: 4px;">${p['Tipo de Prenda'] || ''}</div>
                </td>
                <td>${formatPrice(parsePrice(p['Unidad']))}</td>
                <td>${formatPrice(parsePrice(p['≥ 3']))}</td>
                <td>${formatPrice(parsePrice(p['≥ 6']))}</td>
                <td>${formatPrice(parsePrice(p['≥ 12']))}</td>
                <td>
                    <button class="btn-icon btn-edit-row" title="Editar">✏️</button>
                </td>
            `;
            
            // Añadir evento al botón de editar
            const btnEdit = tr.querySelector('.btn-edit-row');
            btnEdit.addEventListener('click', () => openProductModal(p));
            
            productsTbody.appendChild(tr);
        });
    }

    // Modal de Productos
    function openProductModal(product = null) {
        productForm.reset();
        
        if (product) {
            productModalTitle.textContent = 'Editar Producto';
            originalPrenda.value = product['Prenda']; // Identificador original
            prodTipo.value = product['Tipo de Prenda'];
            prodPrenda.value = product['Prenda'];
            prodRemate.checked = (product['Es Remate'] === 'Sí' || product['Es Remate'] === 'Si');
            prodU.value = product['Unidad'];
            prod3.value = product['≥ 3'];
            prod6.value = product['≥ 6'];
            prod12.value = product['≥ 12'];
        } else {
            productModalTitle.textContent = 'Añadir Producto';
            originalPrenda.value = '';
        }
        
        productModal.classList.add('active');
    }

    btnAddProduct.addEventListener('click', () => openProductModal(null));
    btnCancelProduct.addEventListener('click', () => productModal.classList.remove('active'));

    productForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const data = {
            accion: originalPrenda.value ? 'editar_producto' : 'agregar_producto',
            prendaOriginal: originalPrenda.value,
            tipo: prodTipo.value,
            prenda: prodPrenda.value,
            esRemate: prodRemate.checked ? 'Sí' : 'No',
            unidad: prodU.value,
            p3: prod3.value,
            p6: prod6.value,
            p12: prod12.value
        };

        const originalBtnText = btnSaveProduct.innerHTML;
        btnSaveProduct.disabled = true;
        btnSaveProduct.innerHTML = '<div class="spinner" style="width:20px;height:20px;margin:0;border-width:2px"></div>';

        try {
            await fetch(SCRIPT_URL, {
                method: 'POST',
                mode: 'no-cors',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            
            productModal.classList.remove('active');
            
            // Recargar catálogo para ver los cambios
            loadProducts();

        } catch (error) {
            console.error('Error al guardar producto:', error);
            alert('Error al guardar producto.');
        } finally {
            btnSaveProduct.disabled = false;
            btnSaveProduct.innerHTML = originalBtnText;
        }
    });

    // Eventos de Filtros Avanzados
    filterProductos.addEventListener('input', applyFiltersAndSort);

    btnFilterRemate.addEventListener('click', () => {
        filterOnlyRemate = !filterOnlyRemate;
        btnFilterRemate.classList.toggle('active', filterOnlyRemate);
        applyFiltersAndSort();
    });

    selectFilterTipo.addEventListener('change', (e) => {
        currentFilterTipo = e.target.value;
        applyFiltersAndSort();
    });

    // Eventos de Ordenamiento
    sortableHeaders.forEach(th => {
        th.addEventListener('click', () => {
            const column = th.dataset.sort;
            
            if (currentSortColumn === column) {
                currentSortAsc = !currentSortAsc; // Invertir orden
            } else {
                currentSortColumn = column;
                currentSortAsc = true; // Por defecto ascendente al cambiar columna
            }

            // Actualizar iconos visuales
            sortableHeaders.forEach(header => {
                header.classList.remove('active');
                header.querySelector('.sort-icon').textContent = '';
            });
            th.classList.add('active');
            th.querySelector('.sort-icon').textContent = currentSortAsc ? '↑' : '↓';

            applyFiltersAndSort();
        });
    });
});

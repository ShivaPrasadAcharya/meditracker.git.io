document.addEventListener('DOMContentLoaded', function() {
    // Constants
    const PASSWORD = "0000";
    
    // DOM Elements
    const medicineCards = document.querySelectorAll('.medicine-card');
    const logTableBody = document.getElementById('log-table-body');
    const medicineFilter = document.getElementById('medicine-filter');
    const viewToggleBtn = document.getElementById('view-toggle');
    const editModal = document.getElementById('edit-modal');
    const closeModalBtn = document.getElementById('close-modal');
    const cancelEditBtn = document.getElementById('cancel-edit');
    const saveEditBtn = document.getElementById('save-edit');
    const passwordInput = document.getElementById('password-input');
    const datetimeInput = document.getElementById('datetime-input');
    const passwordError = document.getElementById('password-error');
    const successMessage = document.getElementById('success-message');
    const noLogsMessage = document.getElementById('no-logs');
    
    // State
    let medicationLogs = [];
    let currentEditingLog = null;
    let showingAllLogs = false;
    
    // Initialize
    loadDataFromStorage();
    setupEventListeners();
    populateMedicineFilter();
    
    // Setup Event Listeners
    function setupEventListeners() {
        // Medicine cards click
        medicineCards.forEach(card => {
            card.addEventListener('click', function() {
                const medicineName = this.getAttribute('data-name');
                recordMedication(medicineName);
            });
        });
        
        // View toggle button
        viewToggleBtn.addEventListener('click', toggleLogView);
        
        // Medicine filter change
        medicineFilter.addEventListener('change', updateLogTable);
        
        // Modal events
        closeModalBtn.addEventListener('click', closeEditModal);
        cancelEditBtn.addEventListener('click', closeEditModal);
        saveEditBtn.addEventListener('click', saveEditedTime);
        
        // Password input event to hide error
        passwordInput.addEventListener('input', function() {
            passwordError.style.display = 'none';
        });
    }
    
    // Load data from localStorage
    function loadDataFromStorage() {
        const savedLogs = localStorage.getItem('medicationLogs');
        if (savedLogs) {
            medicationLogs = JSON.parse(savedLogs);
            updateLogTable();
            updateLastTakenTimes();
        }
    }
    
    // Save data to localStorage
    function saveDataToStorage() {
        localStorage.setItem('medicationLogs', JSON.stringify(medicationLogs));
    }
    
    // Record medication
    function recordMedication(medicineName) {
        const now = new Date();
        const logEntry = {
            id: Date.now(),
            medicine: medicineName,
            dateTime: now.toISOString(),
            isEdited: false
        };
        
        medicationLogs.push(logEntry);
        saveDataToStorage();
        updateLogTable();
        updateLastTakenTimes();
        showSuccessMessage(`${medicineName} taken successfully!`);
    }
    
    // Update last taken times on medicine cards
    function updateLastTakenTimes() {
        const medicineMap = new Map();
        
        // Find the latest log for each medicine
        for (const log of medicationLogs) {
            const existing = medicineMap.get(log.medicine);
            if (!existing || new Date(log.dateTime) > new Date(existing.dateTime)) {
                medicineMap.set(log.medicine, log);
            }
        }
        
        // Update the last taken text for each medicine card
        medicineMap.forEach((log, medicine) => {
            const element = document.getElementById(`last-taken-${medicine}`);
            if (element) {
                const date = new Date(log.dateTime);
                element.textContent = `Last taken: ${formatDate(date)}`;
            }
        });
    }
    
    // Format date for display
    function formatDate(date) {
        return `${date.toLocaleDateString()} at ${date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
    }
    
    // Update log table based on filters
    function updateLogTable() {
        // Clear current table
        logTableBody.innerHTML = '';
        
        // Apply medicine filter
        const selectedMedicine = medicineFilter.value;
        let filteredLogs = selectedMedicine === 'all' 
            ? medicationLogs 
            : medicationLogs.filter(log => log.medicine === selectedMedicine);
        
        // If not showing all logs, only show the latest for each medicine
        if (!showingAllLogs) {
            const latestLogsMap = new Map();
            for (const log of filteredLogs) {
                const existing = latestLogsMap.get(log.medicine);
                if (!existing || new Date(log.dateTime) > new Date(existing.dateTime)) {
                    latestLogsMap.set(log.medicine, log);
                }
            }
            filteredLogs = Array.from(latestLogsMap.values());
        }
        
        // Sort logs (newest first)
        filteredLogs.sort((a, b) => new Date(b.dateTime) - new Date(a.dateTime));
        
        // Display logs or message
        if (filteredLogs.length === 0) {
            noLogsMessage.style.display = 'block';
        } else {
            noLogsMessage.style.display = 'none';
            
            // Add log entries to table
            filteredLogs.forEach(log => {
                const date = new Date(log.dateTime);
                const row = document.createElement('tr');
                
                row.innerHTML = `
                    <td>${log.medicine}</td>
                    <td>${date.toLocaleDateString()}</td>
                    <td>
                        ${date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        ${log.isEdited ? '<span class="time-badge">edited</span>' : ''}
                    </td>
                    <td>
                        <button class="edit-button">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                    </td>
                `;
                
                // Add edit button event listener
                const editButton = row.querySelector('.edit-button');
                editButton.addEventListener('click', () => openEditModal(log.id));
                
                logTableBody.appendChild(row);
            });
        }
    }
    
    // Toggle between showing all logs and only the latest
    function toggleLogView() {
        showingAllLogs = !showingAllLogs;
        viewToggleBtn.innerHTML = showingAllLogs 
            ? '<i class="fas fa-filter"></i> Show Latest Only'
            : '<i class="fas fa-list"></i> View All Logs';
        updateLogTable();
    }
    
    // Populate medicine filter dropdown
    function populateMedicineFilter() {
        // Get unique medicine names from logs
        const medicineSet = new Set();
        medicationLogs.forEach(log => medicineSet.add(log.medicine));
        
        // Add all medicines from cards
        medicineCards.forEach(card => {
            const medicineName = card.getAttribute('data-name');
            medicineSet.add(medicineName);
        });
        
        // Create and append options
        medicineSet.forEach(medicine => {
            if (medicine) {
                const option = document.createElement('option');
                option.value = medicine;
                option.textContent = medicine;
                medicineFilter.appendChild(option);
            }
        });
    }
    
    // Open edit modal
    function openEditModal(logId) {
        currentEditingLog = medicationLogs.find(log => log.id === logId);
        if (currentEditingLog) {
            const dateTime = new Date(currentEditingLog.dateTime);
            
            // Format datetime for the input (YYYY-MM-DDThh:mm)
            const year = dateTime.getFullYear();
            const month = String(dateTime.getMonth() + 1).padStart(2, '0');
            const day = String(dateTime.getDate()).padStart(2, '0');
            const hours = String(dateTime.getHours()).padStart(2, '0');
            const minutes = String(dateTime.getMinutes()).padStart(2, '0');
            
            const formattedDateTime = `${year}-${month}-${day}T${hours}:${minutes}`;
            
            datetimeInput.value = formattedDateTime;
            passwordInput.value = '';
            passwordError.style.display = 'none';
            editModal.style.display = 'block';
        }
    }
    
    // Close edit modal
    function closeEditModal() {
        editModal.style.display = 'none';
        currentEditingLog = null;
    }
    
    // Save edited time
    function saveEditedTime() {
        if (passwordInput.value !== PASSWORD) {
            passwordError.style.display = 'block';
            return;
        }
        
        if (datetimeInput.value && currentEditingLog) {
            // Update the log
            const newDateTime = new Date(datetimeInput.value);
            
            // Find and update the log in the array
            medicationLogs = medicationLogs.map(log => {
                if (log.id === currentEditingLog.id) {
                    return {
                        ...log,
                        dateTime: newDateTime.toISOString(),
                        isEdited: true
                    };
                }
                return log;
            });
            
            // Save data and update UI
            saveDataToStorage();
            updateLogTable();
            updateLastTakenTimes();
            showSuccessMessage(`Time for ${currentEditingLog.medicine} updated successfully!`);
            closeEditModal();
        }
    }
    
    // Show success message
    function showSuccessMessage(message) {
        successMessage.textContent = message;
        successMessage.style.opacity = '1';
        
        setTimeout(() => {
            successMessage.style.opacity = '0';
        }, 3000);
    }
});
